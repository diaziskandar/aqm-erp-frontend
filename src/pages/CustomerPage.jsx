import React, { useEffect, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from '@tanstack/react-table';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { RefreshCw, Search, ChevronLeft, ChevronRight, FileText, Eye, Stethoscope, ShoppingBag, Phone, MapPin, User, Mail, Calendar } from 'lucide-react';

export default function CustomerPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State untuk Pagination & Search
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);

  // State untuk Modal Terpadu Detail Customer, Rekam Medis & Riwayat Pembelian
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [customerAttachments, setCustomerAttachments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  
  // State untuk Form Tambah Rekam Medis di dalam Modal Detail
  const [isAddingMedical, setIsAddingMedical] = useState(false);
  const [newMedicalRecord, setNewMedicalRecord] = useState({
    examDate: new Date().toISOString().split('T')[0],
    audiogramData: '',
    earCondition: '',
    examinerName: ''
  });

  // Ambil data customer dari backend
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales-service/api/customers', {
        params: {
          search: globalFilter || undefined,
          page: pagination.pageIndex,
          size: pagination.pageSize
        }
      });
      const resData = response.data;
      setData(resData.content || resData || []);
      setTotalRows(resData.totalElements || (resData ? resData.length : 0));
    } catch (err) {
      console.error("Gagal memuat data customer:", err);
      try {
        const fallbackRes = await api.get('/sales-service/api/sales');
        setData(fallbackRes.data.content || fallbackRes.data || []);
      } catch (innerErr) {
        console.error("Gagal memuat fallback customer:", innerErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

  // Handler Buka Modal Terpadu Detail Customer
  const handleOpenCustomerDetail = async (customer) => {
    setActiveCustomer(customer);
    setIsAddingMedical(false);

    // 1. Parsing Lampiran Dokumen / KTP Customer
    if (customer.attachments) {
      const paths = customer.attachments.split(',').map(p => p.trim());
      setCustomerAttachments(paths);
    } else {
      setCustomerAttachments([]);
    }

    try {
      // 2. Ambil Rekam Medis berdasarkan customer.id
      const medRes = await api.get(`/sales-service/api/medical-records/customer/${customer.id}`);
      setMedicalRecords(Array.isArray(medRes.data) ? medRes.data : []);
    } catch (err) {
      console.error("Gagal memuat rekam medis:", err);
      setMedicalRecords([]);
    }

    try {
      // 3. Ambil Riwayat Pembelian menggunakan endpoint /sales-service/api/sales
      const salesRes = await api.get('/sales-service/api/sales', {
        params: { search: customer.name }
      });
      const resData = salesRes.data;
      const listTrx = resData.content || resData || [];
      
      // Filter transaksi yang sesuai dengan nama customer
      const filteredTrx = listTrx.filter(trx => 
        trx.customerName && trx.customerName.toLowerCase() === customer.name.toLowerCase()
      );

      // Ekstraksi item dari transaksi penjualan
      let allItems = [];
      filteredTrx.forEach(trx => {
        if (trx.items && Array.isArray(trx.items)) {
          trx.items.forEach(it => {
            allItems.push({
              date: trx.date,
              itemName: it.itemName,
              itemType: it.itemType,
              quantity: it.quantity,
              totalPrice: it.totalPrice
            });
          });
        }
      });

      setPurchaseHistory(allItems);
    } catch (err) {
      console.error("Gagal memuat riwayat pembelian:", err);
      setPurchaseHistory([]);
    }

    setIsDetailModalOpen(true);
  };

  // Simpan Rekam Medis Baru
  const handleSaveMedicalRecord = async (e) => {
    e.preventDefault();
    if (!activeCustomer) return;

    try {
      const payload = {
        customerId: activeCustomer.id,
        examDate: newMedicalRecord.examDate,
        audiogramData: newMedicalRecord.audiogramData,
        earCondition: newMedicalRecord.earCondition,
        examinerName: newMedicalRecord.examinerName
      };

      await api.post('/sales-service/api/medical-records', payload);

      // Refresh rekam medis
      const res = await api.get(`/sales-service/api/medical-records/customer/${activeCustomer.id}`);
      setMedicalRecords(Array.isArray(res.data) ? res.data : []);

      setNewMedicalRecord({
        examDate: new Date().toISOString().split('T')[0],
        audiogramData: '',
        earCondition: '',
        examinerName: ''
      });
      setIsAddingMedical(false);
    } catch (err) {
      console.error("Gagal menyimpan rekam medis:", err);
      alert("Gagal menyimpan data rekam medis.");
    }
  };

  const columns = React.useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Nama Customer',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {info.getValue()?.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-gray-800 font-semibold block">{info.getValue()}</span>
            <span className="text-xs text-gray-400">NIK: {info.row.original.nik || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'No. Telepon',
      cell: info => <span className="text-gray-600 font-medium flex items-center gap-1"><Phone size={13} className="text-gray-400" /> {info.getValue() || '-'}</span>,
    },
    {
      accessorKey: 'address',
      header: 'Alamat',
      cell: info => <span className="text-gray-600 truncate max-w-xs block"><MapPin size={13} className="inline mr-1 text-gray-400" /> {info.getValue() || '-'}</span>,
    },
    {
      id: 'actions',
      header: 'Aksi Layanan Pasien',
      cell: info => {
        const customer = info.row.original;
        return (
          <button
            onClick={() => handleOpenCustomerDetail(customer)}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            title="Lihat Profil, Rekam Medis & Riwayat Pembelian"
          >
            <User size={14} /> Detail Customer & Rekam Medis
          </button>
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
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">DATA CUSTOMER & REKAM MEDIS</h1>
            <p className="text-sm text-gray-500 mt-1">Pusat profil pasien, riwayat pemeriksaan audiogram, dan riwayat transaksi terpadu.</p>
          </div>
          <button 
            onClick={fetchCustomers}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={16} />
            </span>
            <input 
              type="text"
              placeholder="Cari berdasarkan nama atau NIK customer..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* TABEL CUSTOMER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="py-4 px-6 font-semibold">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400">Memuat data customer...</td>
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
                    <td colSpan="4" className="py-8 text-center text-gray-400">Belum ada data customer terdaftar.</td>
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
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL TERPADU: DETAIL CUSTOMER, REKAM MEDIS & RIWAYAT PEMBELIAN */}
        {isDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
              
              {/* Header Modal */}
              <div className="flex justify-between items-center mb-6 border-b pb-3 bg-indigo-50 -mx-6 -mt-6 p-4 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <User size={20} className="text-indigo-600" /> Profil & Rekam Medis Terpadu: {activeCustomer?.name}
                  </h3>
                  <p className="text-xs text-indigo-600 mt-0.5">Pusat informasi lengkap profil pasien, pemeriksaan audiogram, dan riwayat transaksi.</p>
                </div>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
              </div>

              <div className="space-y-6">
                
                {/* 1. SECTION: DETAIL INFORMASI PROFIL CUSTOMER */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-1.5">
                    <User size={14} className="text-indigo-600" /> Informasi Profil Customer
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Nama Lengkap</span>
                      <strong className="text-gray-800 text-sm">{activeCustomer?.name || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Nomor KTP (NIK)</span>
                      <strong className="text-gray-800">{activeCustomer?.nik || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Nomor Telepon</span>
                      <strong className="text-gray-800">{activeCustomer?.phone || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Email</span>
                      <strong className="text-gray-800">{activeCustomer?.email || '-'}</strong>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-400 block">Alamat Lengkap</span>
                      <strong className="text-gray-800">{activeCustomer?.address || '-'}</strong>
                    </div>
                  </div>

                  {/* Lampiran Dokumen / KTP */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-600 block mb-2">Lampiran Dokumen / KTP Customer ({customerAttachments.length}):</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {customerAttachments.length > 0 ? (
                        customerAttachments.map((path, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded-lg text-xs shadow-sm">
                            <span className="truncate max-w-[220px] text-gray-700">{path}</span>
                            <a 
                              href={`http://localhost:8888/sales-service/${path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium flex items-center gap-1 transition"
                            >
                              <Eye size={12} /> Buka File ↗
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">Tidak ada lampiran dokumen.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SECTION: RIWAYAT REKAM MEDIS & AUDIOGRAM */}
                <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-teal-800 uppercase flex items-center gap-1.5">
                      <Stethoscope size={14} className="text-teal-700" /> Riwayat Rekam Medis & Pemeriksaan Audiogram
                    </h4>
                    {!isAddingMedical && (
                      <button
                        onClick={() => setIsAddingMedical(true)}
                        className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
                      >
                        + Tambah Pemeriksaan Medis
                      </button>
                    )}
                  </div>

                  {!isAddingMedical ? (
                    <div className="space-y-3">
                      {medicalRecords.length > 0 ? (
                        medicalRecords.map((rec, idx) => (
                          <div key={idx} className="p-3 bg-white border border-teal-200 rounded-xl space-y-2 shadow-sm">
                            <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-2">
                              <span className="font-semibold text-teal-900 flex items-center gap-1">
                                <Calendar size={12} /> Tanggal Periksa: {rec.examDate}
                              </span>
                              <span>Pemeriksa: <strong className="text-gray-800">{rec.examinerName || '-'}</strong></span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="bg-gray-50 p-2 rounded-lg border">
                                <span className="font-semibold text-teal-700 block mb-1">Data Audiogram:</span>
                                <p className="text-gray-700">{rec.audiogramData || '-'}</p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded-lg border">
                                <span className="font-semibold text-teal-700 block mb-1">Kondisi Telinga:</span>
                                <p className="text-gray-700">{rec.earCondition || '-'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-xs bg-white rounded-xl border border-dashed border-teal-200">
                          Belum ada riwayat rekam medis untuk customer ini.
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSaveMedicalRecord} className="space-y-3 bg-white p-4 rounded-xl border border-teal-200">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h5 className="text-xs font-bold text-teal-800 uppercase">Form Input Pemeriksaan Baru</h5>
                        <button type="button" onClick={() => setIsAddingMedical(false)} className="text-xs text-gray-500 hover:underline">Batal</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-semibold text-gray-600 mb-1">Tanggal Pemeriksaan</label>
                          <input 
                            type="date" required
                            value={newMedicalRecord.examDate}
                            onChange={(e) => setNewMedicalRecord({...newMedicalRecord, examDate: e.target.value})}
                            className="w-full border rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-gray-600 mb-1">Nama Dokter / Pemeriksa</label>
                          <input 
                            type="text" placeholder="Contoh: Dr. Sp.THT-KL"
                            value={newMedicalRecord.examinerName}
                            onChange={(e) => setNewMedicalRecord({...newMedicalRecord, examinerName: e.target.value})}
                            className="w-full border rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                      </div>
                      <div className="text-xs">
                        <label className="block font-semibold text-gray-600 mb-1">Data Audiogram</label>
                        <textarea 
                          rows="2" placeholder="Contoh: Kanan: 25dB, Kiri: 30dB"
                          value={newMedicalRecord.audiogramData}
                          onChange={(e) => setNewMedicalRecord({...newMedicalRecord, audiogramData: e.target.value})}
                          className="w-full border rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                      <div className="text-xs">
                        <label className="block font-semibold text-gray-600 mb-1">Kondisi Telinga</label>
                        <textarea 
                          rows="2" placeholder="Contoh: Membran timpani utuh"
                          value={newMedicalRecord.earCondition}
                          onChange={(e) => setNewMedicalRecord({...newMedicalRecord, earCondition: e.target.value})}
                          className="w-full border rounded-lg px-2.5 py-1.5"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700">Simpan Rekam Medis</button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 3. SECTION: RIWAYAT PEMBELIAN / TRANSAKSI */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-900 uppercase mb-3 flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-blue-700" /> Riwayat Transaksi Pembelian Alat / Aksesoris
                  </h4>
                  <div className="space-y-2">
                    {purchaseHistory.length > 0 ? (
                      purchaseHistory.map((trx, idx) => (
                        <div key={idx} className="p-3 bg-white border border-blue-200 rounded-xl flex items-center justify-between text-xs shadow-sm">
                          <div className="space-y-1">
                            <span className="font-bold text-gray-800 text-sm">{trx.itemName}</span>
                            <p className="text-gray-500">Tanggal: {trx.date} | Kategori: <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{trx.itemType || '-'}</span></p>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="font-bold text-indigo-600 text-sm">Rp {trx.totalPrice ? Number(trx.totalPrice).toLocaleString('id-ID') : '0'}</span>
                            <p className="text-gray-500">{trx.quantity} Pcs</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-400 text-xs bg-white rounded-xl border border-dashed border-blue-200">
                        Belum ada riwayat transaksi pembelian tercatat untuk customer ini.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Modal */}
              <div className="pt-4 mt-6 flex justify-end border-t">
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                >
                  Tutup Jendela
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}