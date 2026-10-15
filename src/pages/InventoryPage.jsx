import React, { useEffect, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from '@tanstack/react-table';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { RefreshCw, Plus, X, Search, ChevronLeft, ChevronRight, Edit, Trash2, Eye } from 'lucide-react';

export default function InventoryPage() {
  const [data, setData] = useState([]);
  const [itemTypes, setItemTypes] = useState([]); 
  const [subTypes, setSubTypes] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  const [totalRows, setTotalRows] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  // Diubah menjadi desc: true agar data terbaru/teratas muncul pertama kali
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State untuk Modal Tambah/Edit & Modal Detail
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // State untuk Modal Detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);

  const [formData, setFormData] = useState({ 
    name: '', 
    quantity: '', 
    price: '', 
    itemTypeId: '', 
    itemSubTypeId: '',
    serialNumber: '' 
  });
  const [displayPrice, setDisplayPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItemTypes = async () => {
    try {
      const response = await api.get('/inventory-service/api/inventory/types');
      setItemTypes(response.data);
    } catch (err) {
      console.error("Gagal memuat tipe barang:", err);
    }
  };

  const fetchSubTypesByTypeId = async (typeId) => {
    if (!typeId) {
      setSubTypes([]);
      return;
    }
    try {
      const response = await api.get(`/inventory-service/api/inventory/types/by-type/${typeId}`);
      setSubTypes(response.data);
    } catch (err) {
      console.error("Gagal memuat sub-tipe barang:", err);
      setSubTypes([]);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const sortBy = sorting[0]?.id || 'id';
      const direction = sorting[0]?.desc ? 'DESC' : 'ASC';

      const response = await api.get('/inventory-service/api/inventory', {
        params: {
          page: pagination.pageIndex,
          size: pagination.pageSize,
          sortBy: sortBy,
          direction: direction,
          search: globalFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });

      setData(response.data.content || response.data); 
      setTotalRows(response.data.totalElements || response.data.length);
    } catch (err) {
      console.error("Gagal memuat data inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemTypes();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter, startDate, endDate]);

  const handleItemTypeChange = async (e) => {
    const selectedTypeId = e.target.value;
    setFormData({
      ...formData,
      itemTypeId: selectedTypeId,
      itemSubTypeId: '',
      serialNumber: ''
    });
    
    if (selectedTypeId) {
      await fetchSubTypesByTypeId(selectedTypeId);
    } else {
      setSubTypes([]);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({ name: '', quantity: '', price: '', itemTypeId: '', itemSubTypeId: '', serialNumber: '' });
    setSubTypes([]);
    setDisplayPrice('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item) => {
    setIsEditMode(true);
    setCurrentId(item.id);
    
    const typeId = item.itemType ? item.itemType.id : '';
    const subTypeId = item.itemSubType ? item.itemSubType.id : '';

    setFormData({
      name: item.name || '',
      quantity: item.quantity || '',
      price: item.price ? item.price.toString() : '',
      itemTypeId: typeId,
      itemSubTypeId: subTypeId,
      serialNumber: item.serialNumber || '',
      itemCode: item.itemCode || ''
    });
    setDisplayPrice(item.price ? Number(item.price).toLocaleString('id-ID') : '');

    if (typeId) {
      await fetchSubTypesByTypeId(typeId);
    } else {
      setSubTypes([]);
    }

    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (item) => {
    setSelectedItemDetail(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus barang ini?")) return;
    try {
      await api.delete(`/inventory-service/api/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      console.error("Gagal menghapus data:", err);
    }
  };

  const columns = React.useMemo(() => [
    {
      accessorKey: 'itemCode',
      header: 'Kode SKU',
      cell: info => <span className="font-mono font-semibold text-indigo-600">{info.getValue() || '-'}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Nama Barang',
      cell: info => <span className="font-semibold text-gray-800">{info.getValue()}</span>,
    },
    {
      accessorKey: 'itemType',
      header: 'Tipe Barang',
      cell: info => {
        const type = info.getValue();
        return (
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
            {type ? type.name : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: info => (
        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
          {info.getValue()} Unit
        </span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Harga',
      cell: info => (
        <span className="text-indigo-600 font-medium">
          Rp {info.getValue() ? Number(info.getValue()).toLocaleString('id-ID') : '0'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenDetailModal(row.original)}
            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition"
            title="Detail Barang"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => handleOpenEditModal(row.original)}
            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
            title="Edit Barang"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
            title="Hapus Barang"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
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

  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
      setFormData({ ...formData, price: '' });
      setDisplayPrice('');
      return;
    }
    const formatted = Number(rawValue).toLocaleString('id-ID');
    setFormData({ ...formData, price: rawValue });
    setDisplayPrice(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedType = itemTypes.find(t => t.id.toString() === formData.itemTypeId.toString());
      const isABD = selectedType && (selectedType.code?.toUpperCase() === 'ABD' || selectedType.name?.toUpperCase().includes('ABD'));

      const payload = {
        name: formData.name,
        quantity: parseInt(formData.quantity, 10),
        price: parseFloat(formData.price),
        itemTypeId: parseInt(formData.itemTypeId, 10),
        itemSubTypeId: formData.itemSubTypeId ? parseInt(formData.itemSubTypeId, 10) : null,
        serialNumber: isABD ? formData.serialNumber : null
      };

      if (isEditMode) {
        await api.put(`/inventory-service/api/inventory/${currentId}`, payload);
      } else {
        await api.post('/inventory-service/api/inventory', payload);
      }

      setFormData({ name: '', quantity: '', price: '', itemTypeId: '', itemSubTypeId: '', serialNumber: '' });
      setSubTypes([]);
      setDisplayPrice('');
      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error("Gagal menyimpan data:", err);
      alert("Terjadi kesalahan: " + (err.response?.data || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeObj = itemTypes.find(t => t.id.toString() === formData.itemTypeId?.toString());
  const isSelectedTypeABD = selectedTypeObj && (selectedTypeObj.code?.toUpperCase() === 'ABD' || selectedTypeObj.name?.toUpperCase().includes('ABD'));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MANAJEMEN INVENTARIS</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola stok barang dan harga inventaris perusahaan.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus size={16} /> Tambah Barang
            </button>
            <button 
              onClick={fetchInventory}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={16} />
            </span>
            <input 
              type="text"
              placeholder="Cari nama barang..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* TABEL DATA */}
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
                    <td colSpan="6" className="py-8 text-center text-gray-400">Memuat data dari server...</td>
                  </tr>
                ) : table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-4 px-6">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400">Tidak ada data ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
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

        {/* MODAL DETAIL BARANG */}
        {isDetailModalOpen && selectedItemDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">Detail Informasi Barang</h3>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-500">Kode SKU / Item Code:</span>
                  <span className="font-mono text-indigo-600 font-semibold">{selectedItemDetail.itemCode || '-'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-500">Nama Barang:</span>
                  <span className="font-medium text-gray-800">{selectedItemDetail.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-500">Tipe Barang:</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                    {selectedItemDetail.itemType ? selectedItemDetail.itemType.name : '-'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-500">Sub-Tipe Barang:</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-semibold">
                    {selectedItemDetail.itemSubType ? selectedItemDetail.itemSubType.name : '-'}
                  </span>
                </div>
                {selectedItemDetail.serialNumber && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-gray-500">Nomor Serial:</span>
                    <span className="font-mono text-gray-800">{selectedItemDetail.serialNumber}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-500">Quantity:</span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-semibold">
                    {selectedItemDetail.quantity} Unit
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="font-semibold text-gray-500">Harga Satuan:</span>
                  <span className="text-indigo-600 font-semibold">
                    Rp {selectedItemDetail.price ? Number(selectedItemDetail.price).toLocaleString('id-ID') : '0'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t mt-4">
                <button 
                  onClick={() => setIsDetailModalOpen(false)} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH / EDIT BARANG */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">
                  {isEditMode ? 'Edit Inventaris Barang' : 'Tambah Inventaris Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isEditMode && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Kode SKU / Item Code</label>
                    <input 
                      type="text" 
                      disabled
                      value={formData.itemCode || ''}
                      className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono text-gray-500 cursor-not-allowed"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nama Barang</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipe Barang</label>
                  <select 
                    required
                    value={formData.itemTypeId}
                    onChange={handleItemTypeChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Pilih Tipe Barang --</option>
                    {itemTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Dropdown Sub-Tipe Barang Dinamis */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Sub-Tipe Barang</label>
                  <select 
                    value={formData.itemSubTypeId}
                    onChange={(e) => setFormData({...formData, itemSubTypeId: e.target.value})}
                    disabled={!formData.itemTypeId || subTypes.length === 0}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.itemTypeId ? "-- Pilih Tipe Terlebih Dahulu --" : subTypes.length === 0 ? "-- Tidak Ada Sub-Tipe --" : "-- Pilih Sub-Tipe Barang --"}
                    </option>
                    {subTypes.map((subType) => (
                      <option key={subType.id} value={subType.id}>
                        {subType.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form Input Nomor Serial Kondisional */}
                {isSelectedTypeABD && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nomor Serial Alat</label>
                    <input 
                      type="text" required
                      placeholder="Contoh: SN-ABD-2026-001"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Quantity</label>
                  <input 
                    type="number" required
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Harga</label>
                  <input 
                    type="text" required
                    value={displayPrice}
                    onChange={handlePriceChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                    {isEditMode ? 'Simpan Perubahan' : 'Simpan'}
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