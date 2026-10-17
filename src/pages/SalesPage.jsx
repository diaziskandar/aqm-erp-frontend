import React, { useEffect, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from '@tanstack/react-table';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { RefreshCw, Plus, X, Search, ChevronLeft, ChevronRight, FileText, CheckCircle, AlertCircle, UserPlus, Eye, Trash2 } from 'lucide-react';

export default function SalesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State untuk Server-Side Parameters & Pagination
  const [totalRows, setTotalRows] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([{ id: 'date', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State untuk Modal & Form Transaksi Master-Detail (Multi-Item + Multiple Files)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    items: [],
    attachmentFiles: [] // Menyimpan multiple file bukti transaksi sales
  });

  // State untuk baris item sementara yang sedang dipilih sebelum dimasukkan ke keranjang
  const [currentItem, setCurrentItem] = useState({
    itemId: '',
    itemName: '',
    itemType: '',
    quantity: 1,
    price: 0
  });
  const [displayPrice, setDisplayPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State untuk manajemen verifikasi Customer & Multiple Files Lampiran Customer
  const [customerStatus, setCustomerStatus] = useState(null); 
  const [customerData, setCustomerData] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    nik: '',
    phone: '',
    address: '',
    email: '',
    attachmentFiles: [] // Menampung multiple files lampiran customer
  });
  const [registeringCustomer, setRegisteringCustomer] = useState(false);
  const [customerError, setCustomerError] = useState('');

  // State untuk Modal Detail Item & Lampiran Bukti Transaksi
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState({
    customerName: '',
    date: '',
    items: [],
    attachment: ''
  });

  // State untuk opsi dropdown dinamis dari API inventory
  const [inventoryItems, setInventoryItems] = useState([]);

  const fetchDropdownOptions = async () => {
    try {
      const itemRes = await api.get('/inventory-service/api/inventory');
      const rawData = itemRes.data;
      let itemList = [];

      if (Array.isArray(rawData)) {
        itemList = rawData;
      } else if (rawData && Array.isArray(rawData.content)) {
        itemList = rawData.content;
      } else if (rawData && Array.isArray(rawData.data)) {
        itemList = rawData.data;
      }

      setInventoryItems(itemList);
    } catch (err) {
      console.error("Gagal memuat opsi dropdown inventory:", err);
      setInventoryItems([]);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const sortBy = sorting[0]?.id || 'date';
      const direction = sorting[0]?.desc ? 'DESC' : 'ASC';

      const response = await api.get('/sales-service/api/sales', {
        params: {
          page: pagination.pageIndex,
          size: pagination.pageSize,
          sortBy: sortBy,
          direction: direction,
          search: globalFilter || undefined,
          startDate: startDate ? startDate : undefined, 
          endDate: endDate ? endDate : undefined        
        }
      });

      setData(response.data.content || response.data || []);
      setTotalRows(response.data.totalElements || (response.data ? response.data.length : 0));
    } catch (err) {
      console.error("Gagal memuat data penjualan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchDropdownOptions();
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter, startDate, endDate]);

  const handleCheckCustomer = async (identifier) => {
    if (!identifier || identifier.trim() === '') {
      setCustomerStatus(null);
      setCustomerData(null);
      return;
    }

    setCustomerStatus('CHECKING');
    try {
      // Deteksi apakah input berupa angka (NIK) atau teks (Nama)
      const isNumeric = /^\d+$/.test(identifier);
      const params = isNumeric ? { nik: identifier } : { name: identifier };

      const response = await api.get(`/sales-service/api/customers/check`, { params });
      
      const resultData = response.data.data || response.data;

      if (resultData && (resultData.exists === true || resultData.id || resultData.nik)) {
        setCustomerStatus('EXISTS');
        setCustomerData(resultData);
        setTransactionForm(prev => ({ ...prev, customerName: resultData.name }));
      } else {
        setCustomerStatus('NOT_FOUND');
        setCustomerData(null);
        setNewCustomer(prev => ({
          ...prev,
          name: !isNumeric ? identifier : '',
          nik: isNumeric ? identifier : ''
        }));
      }
    } catch (err) {
      console.error("Gagal memeriksa customer:", err);
      setCustomerStatus('NOT_FOUND');
      setCustomerData(null);
    }
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    setCustomerError('');

    if (!/^\d{16}$/.test(newCustomer.nik)) {
      setCustomerError('Nomor KTP (NIK) harus berupa angka dan tepat 16 digit.');
      return;
    }

    if (!/^\d{10,13}$/.test(newCustomer.phone)) {
      setCustomerError('Nomor Telepon harus berupa angka dengan panjang antara 10 hingga 13 digit.');
      return;
    }

    setRegisteringCustomer(true);

    const dataPayload = new FormData();
    dataPayload.append('name', newCustomer.name);
    dataPayload.append('nik', newCustomer.nik);
    dataPayload.append('phone', newCustomer.phone);
    dataPayload.append('address', newCustomer.address || '');
    dataPayload.append('email', newCustomer.email || '');

    if (newCustomer.attachmentFiles && newCustomer.attachmentFiles.length > 0) {
      Array.from(newCustomer.attachmentFiles).forEach((file) => {
        dataPayload.append('attachment', file);
      });
    }

    try {
      const response = await api.post('/sales-service/api/customers', dataPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const registeredData = response.data.data || response.data;
      setCustomerData(registeredData);
      setCustomerStatus('EXISTS');
      setTransactionForm(prev => ({ ...prev, customerName: registeredData.name }));
      setIsCustomerModalOpen(false);
    } catch (err) {
      console.error("Gagal mendaftarkan customer:", err);
      const errorMsg = err.response?.data || 'Gagal mendaftarkan customer baru.';
      setCustomerError(typeof errorMsg === 'string' ? errorMsg : 'Gagal mendaftarkan customer baru.');
    } finally {
      setRegisteringCustomer(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.get('/sales-service/api/sales/export/pdf', {
        params: {
          search: globalFilter || undefined,
          startDate: startDate ? startDate : undefined,
          endDate: endDate ? endDate : undefined
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Laporan_Sales_AQM_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal mengunduh PDF:", err);
      alert("Gagal mengunduh laporan PDF.");
    }
  };

  const handleDownloadInvoicePdf = async (transactionId) => {
    try {
      const response = await api.get(`/sales-service/api/sales/${transactionId}/invoice-pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Faktur_Penjualan_SI.${transactionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal mengunduh faktur PDF:", err);
      alert("Gagal mengunduh faktur penjualan PDF.");
    }
  };

  const handleItemSelectChange = (e) => {
    const selectedId = e.target.value;
    const selectedItem = inventoryItems.find(item => String(item.id) === String(selectedId));

    const qty = Number(currentItem.quantity) || 1;
    const unitPrice = selectedItem ? Number(selectedItem.price || selectedItem.unitPrice || 0) : 0;
    const calculatedTotal = unitPrice * qty;

    const typeName = 
      selectedItem?.itemType?.name || 
      (typeof selectedItem?.itemType === 'string' ? selectedItem.itemType : '') || 
      selectedItem?.typeName || 
      selectedItem?.type || 
      selectedItem?.category || 
      '';

    setCurrentItem(prev => ({
      ...prev,
      itemId: selectedId,
      itemName: selectedItem ? selectedItem.name : '',
      price: unitPrice,
      totalPrice: calculatedTotal,
      itemType: typeName
    }));

    setDisplayPrice(calculatedTotal ? calculatedTotal.toLocaleString('id-ID') : '');
  };

  const handleCurrentQuantityChange = (e) => {
    const qty = parseInt(e.target.value, 10) || 1;
    const calculatedTotal = (Number(currentItem.price) || 0) * qty;

    setCurrentItem(prev => ({
      ...prev,
      quantity: qty,
      totalPrice: calculatedTotal
    }));

    setDisplayPrice(calculatedTotal ? calculatedTotal.toLocaleString('id-ID') : '');
  };

  const handleCurrentPriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setCurrentItem(prev => ({ ...prev, price: 0, totalPrice: 0 }));
      setDisplayPrice('');
      return;
    }
    const priceNum = Number(rawValue);
    const calculatedTotal = priceNum * (Number(currentItem.quantity) || 1);

    setCurrentItem(prev => ({
      ...prev,
      price: priceNum,
      totalPrice: calculatedTotal
    }));
    setDisplayPrice(priceNum.toLocaleString('id-ID'));
  };

  const handleAddRowToCart = () => {
    if (!currentItem.itemId) {
      alert("Silakan pilih item terlebih dahulu!");
      return;
    }
    if (currentItem.quantity <= 0) {
      alert("Jumlah (quantity) minimal adalah 1");
      return;
    }

    setTransactionForm(prev => ({
      ...prev,
      items: [...prev.items, { ...currentItem }]
    }));

    setCurrentItem({
      itemId: '',
      itemName: '',
      itemType: '',
      quantity: 1,
      price: 0
    });
    setDisplayPrice('');
  };

  const handleRemoveCartItem = (index) => {
    setTransactionForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleOpenDetailModal = (rowOriginal) => {
    setSelectedTransactionDetails({
      customerName: rowOriginal.customerName,
      date: rowOriginal.date,
      items: rowOriginal.items || [],
      attachment: rowOriginal.attachment || ''
    });
    setIsDetailModalOpen(true);
  };

  const columns = React.useMemo(() => [
    {
      accessorKey: 'date',
      header: 'Tanggal',
      cell: info => <span className="text-gray-600">{info.getValue()}</span>,
    },
    {
      accessorKey: 'customerName', 
      header: 'Customer',
      cell: info => <span className="text-gray-800 font-medium">{info.getValue()}</span>,
    },
    {
      accessorKey: 'items',
      header: 'Rincian Item Pembelian & Faktur',
      cell: info => {
        const items = info.getValue();
        const transactionId = info.row.original.id;
        if (!Array.isArray(items) || items.length === 0) return <span className="text-gray-400 italic">Tanpa item</span>;
        
        const totalItemsCount = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
        const grandTotal = items.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0);

        return (
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <span className="font-semibold text-gray-800 text-xs block">
                {items.length} Jenis Barang ({totalItemsCount} Pcs)
              </span>
              <span className="text-indigo-600 font-bold text-xs">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadInvoicePdf(transactionId)}
                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Download Faktur Penjualan PDF"
              >
                <FileText size={14} /> Faktur PDF
              </button>
              <button
                onClick={() => handleOpenDetailModal(info.row.original)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                title="Lihat Detail Barang & Lampiran"
              >
                <Eye size={14} /> Detail
              </button>
            </div>
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionForm.customerName) {
      alert("Nama customer wajib diisi!");
      return;
    }
    if (transactionForm.items.length === 0) {
      alert("Keranjang masih kosong, minimal tambahkan 1 item barang ke tabel rincian!");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      
      const transactionPayload = {
        date: transactionForm.date,
        customerName: transactionForm.customerName,
        items: transactionForm.items
      };
      
      formData.append('transaction', JSON.stringify(transactionPayload));

      if (transactionForm.attachmentFiles && transactionForm.attachmentFiles.length > 0) {
        Array.from(transactionForm.attachmentFiles).forEach((file) => {
          formData.append('attachments', file);
        });
      }

      await api.post('/sales-service/api/sales', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTransactionForm({
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        items: [],
        attachmentFiles: []
      });
      setCustomerStatus(null);
      setCustomerData(null);
      setIsModalOpen(false);
      fetchSales();
    } catch (err) {
      console.error("Gagal menambahkan data sales:", err);
      const responseData = err.response?.data;
      const errorMessage = typeof responseData === 'string'
        ? responseData
        : responseData?.message || responseData?.detail || responseData?.error;
      const statusMessage = err.response?.status
        ? ` (HTTP ${err.response.status})`
        : '';
      alert(errorMessage || `Gagal menyimpan data transaksi penjualan${statusMessage}.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">DASHBOARD SALES</h1>
            <p className="text-sm text-gray-500 mt-1">Manajemen data transaksi penjualan aksesoris dan alat (Multi-Item).</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <FileText size={16} /> Download Laporan PDF
            </button>
            <button 
              onClick={() => {
                setTransactionForm({
                  date: new Date().toISOString().split('T')[0],
                  customerName: '',
                  items: [],
                  attachmentFiles: []
                });
                setCurrentItem({ itemId: '', itemName: '', itemType: '', quantity: 1, price: 0 });
                setCustomerStatus(null);
                setCustomerData(null);
                setDisplayPrice('');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus size={16} /> Tambah Transaksi
            </button>
            <button 
              onClick={fetchSales}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={16} />
            </span>
            <input 
              type="text"
              placeholder="Cari customer atau item..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Filter Tanggal:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="py-4 px-6 font-semibold cursor-pointer select-none hover:text-gray-600"
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted()] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-400">Memuat data dari server...</td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-4 px-6 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-gray-400">Belum ada data transaksi penjualan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Menampilkan halaman <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> dari <span className="font-medium">{table.getPageCount() || 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DETAIL ITEM & PRATINJAU LANGSUNG BUKTI TRANSAKSI */}
        {isDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" /> Rincian Item & Bukti Transaksi
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customer: <span className="font-semibold text-gray-700">{selectedTransactionDetails.customerName}</span> | Tanggal: <span className="font-semibold text-gray-700">{selectedTransactionDetails.date}</span>
                  </p>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {selectedTransactionDetails.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{it.itemName}</td>
                        <td className="py-2.5 px-3 text-gray-600">{it.itemType || '-'}</td>
                        <td className="py-2.5 px-3 text-center text-gray-600">{it.quantity} Pcs</td>
                        <td className="py-2.5 px-3 text-right text-indigo-600 font-semibold">Rp {Number(it.totalPrice || 0).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bagian Pratinjau Langsung (Preview) Bukti Transaksi / Nota */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 uppercase block mb-2">Pratinjau Bukti Transaksi / Nota:</span>
                {selectedTransactionDetails.attachment ? (
                  <div className="space-y-3">
                    {selectedTransactionDetails.attachment.split(',').map((filePath, index) => {
                      const trimmedPath = filePath.trim();
                      const fileUrl = `http://localhost:8888/sales-service/${trimmedPath}`;
                      const fileName = trimmedPath.split('/').pop();
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(trimmedPath);

                      return (
                        <div key={index} className="bg-white p-3 rounded-lg border shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600 truncate max-w-[320px]">{fileName}</span>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                            >
                              Buka Tab Baru ↗
                            </a>
                          </div>
                          
                          {isImage ? (
                            <div className="overflow-hidden rounded border bg-gray-100 flex justify-center max-h-[250px]">
                              <img 
                                src={fileUrl} 
                                alt="Bukti Transaksi" 
                                className="object-contain max-h-[250px] w-full rounded"
                              />
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded text-center">
                              File dokumen (Non-gambar). Silakan klik tautan di atas untuk melihat dokumen.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Tidak ada lampiran bukti transaksi.</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Total Keseluruhan: <span className="text-indigo-600 font-bold text-sm">
                    Rp {selectedTransactionDetails.items.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0).toLocaleString('id-ID')}
                  </span>
                </span>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH TRANSAKSI (MASTER-DETAIL + MULTIPLE FILES) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">Tambah Transaksi Sales Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tanggal</label>
                    <input 
                      type="date" 
                      required
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm(prev => ({...prev, date: e.target.value}))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cari / Nama Customer</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ketik NIK atau Nama Customer..."
                      value={transactionForm.customerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTransactionForm(prev => ({...prev, customerName: val}));
                        handleCheckCustomer(val);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    
                    {customerStatus === 'EXISTS' && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle size={14} /> Terverifikasi: {customerData?.name} (NIK: {customerData?.nik})
                      </div>
                    )}

                    {customerStatus === 'NOT_FOUND' && (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-amber-700">
                          <AlertCircle size={14} /> Belum terdaftar.
                        </div>
                        <button 
                          type="button"
                          onClick={() => setIsCustomerModalOpen(true)}
                          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-xs font-medium transition"
                        >
                          <UserPlus size={12} /> Lengkapi Data Customer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Upload Bukti Transaksi (Opsional, Multiple Files) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Upload Bukti Transaksi / Nota (Opsional, Bisa Lebih dari 1 File)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:bg-gray-50 transition">
                    <input 
                      type="file" 
                      multiple
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, attachmentFiles: e.target.files }))}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {transactionForm.attachmentFiles && transactionForm.attachmentFiles.length > 0 && (
                      <p className="mt-2 text-xs text-green-600 font-medium">
                        ✓ {transactionForm.attachmentFiles.length} file bukti transaksi dipilih.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Input Rincian Barang ke Keranjang</h4>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 items-end">
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">Nama Item</label>
                      <select
                        value={currentItem.itemId || ''}
                        onChange={handleItemSelectChange}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      >
                        <option value="" disabled>-- Pilih Item --</option>
                        {Array.isArray(inventoryItems) && inventoryItems.map((item) => {
                          const itemTypeName = item.itemType?.name || (typeof item.itemType === 'string' ? item.itemType : '') || item.typeName || item.type || '';
                          return (
                            <option key={item.id} value={item.id}>
                              {item.name} {itemTypeName ? `(${itemTypeName})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">Type</label>
                      <input 
                        type="text"
                        placeholder="Tipe..."
                        value={currentItem.itemType}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, itemType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">Qty</label>
                      <input 
                        type="number" 
                        min="1"
                        value={currentItem.quantity}
                        onChange={handleCurrentQuantityChange}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-semibold text-gray-600 uppercase mb-1">Total Harga (Rp)</label>
                      <input 
                        type="text" 
                        placeholder="0"
                        value={displayPrice}
                        onChange={handleCurrentPriceChange}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <button 
                        type="button"
                        onClick={handleAddRowToCart}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center transition"
                        title="Tambah Item"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Daftar Rincian Barang Dipilih</label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-600 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Nama Barang</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Qty</th>
                          <th className="py-2.5 px-3">Subtotal</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {transactionForm.items.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-4 text-center text-gray-400 italic">Belum ada item ditambahkan ke keranjang.</td>
                          </tr>
                        ) : (
                          transactionForm.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2 px-3 font-medium text-gray-800">{it.itemName}</td>
                              <td className="py-2 px-3 text-gray-600">{it.itemType || '-'}</td>
                              <td className="py-2 px-3 text-gray-600">{it.quantity} Pcs</td>
                              <td className="py-2 px-3 text-indigo-600 font-semibold">Rp {Number(it.totalPrice || 0).toLocaleString('id-ID')}</td>
                              <td className="py-2 px-3 text-center">
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveCartItem(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded"
                                  title="Hapus Item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting || customerStatus !== 'EXISTS'}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PENDAFTARAN CUSTOMER BARU */}
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-3 bg-amber-50 -mx-6 -mt-6 p-4 rounded-t-2xl">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus size={18} className="text-amber-600" /> Pendaftaran Customer Baru
                </h3>
                <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <form onSubmit={handleRegisterCustomer} className="space-y-3 mt-4">
                {customerError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
                    {customerError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nama Lengkap</label>
                  <input 
                    type="text" required
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Nomor KTP (NIK)</label>
                    <span className={`text-[10px] ${newCustomer.nik.length === 16 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      {newCustomer.nik.length}/16 digit
                    </span>
                  </div>
                  <input 
                    type="text" 
                    required 
                    maxLength="16"
                    placeholder="Wajib 16 digit angka"
                    value={newCustomer.nik}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); 
                      if (val.length <= 16) setNewCustomer({...newCustomer, nik: val});
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-600 uppercase">Nomor Telepon / HP</label>
                    <span className={`text-[10px] ${newCustomer.phone.length >= 10 && newCustomer.phone.length <= 13 ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                      {newCustomer.phone.length} (10-13 digit)
                    </span>
                  </div>
                  <input 
                    type="text" 
                    required 
                    maxLength="13"
                    placeholder="Contoh: 081234567890"
                    value={newCustomer.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, ''); 
                      if (val.length <= 13) setNewCustomer({...newCustomer, phone: val});
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Alamat</label>
                  <textarea 
                    rows="2"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {/* Input Multiple Lampiran KTP Customer (Opsional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Upload Lampiran / KTP Customer (Opsional, Bisa Lebih dari 1)</label>
                  <input 
                    type="file" 
                    multiple
                    onChange={(e) => setNewCustomer({...newCustomer, attachmentFiles: e.target.files})}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  {newCustomer.attachmentFiles && newCustomer.attachmentFiles.length > 0 && (
                    <p className="mt-1 text-[11px] text-green-600 font-medium">
                      ✓ {newCustomer.attachmentFiles.length} file lampiran customer dipilih.
                    </p>
                  )}
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t">
                  <button 
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={registeringCustomer}
                    className="flex items-center gap-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {registeringCustomer ? 'Menyimpan...' : 'Simpan & Verifikasi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}