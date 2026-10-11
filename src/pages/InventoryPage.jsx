import React, { useEffect, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from '@tanstack/react-table';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { RefreshCw, Plus, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function InventoryPage() {
  const [data, setData] = useState([]);
  const [itemTypes, setItemTypes] = useState([]); // State untuk daftar kategori/tipe barang
  const [loading, setLoading] = useState(false);
  
  // State untuk Server-Side Parameters & Pagination
  const [totalRows, setTotalRows] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([{ id: 'id', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State untuk Modal Tambah Data (ditambahkan itemTypeId)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', stock: '', price: '', itemTypeId: '' });
  const [displayPrice, setDisplayPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fungsi fetch data Tipe Barang untuk Dropdown (SUDAH DISESUAIKAN)
  const fetchItemTypes = async () => {
    try {
      const response = await api.get('/inventory-service/api/inventory/types');
      setItemTypes(response.data);
    } catch (err) {
      console.error("Gagal memuat tipe barang:", err);
    }
  };

  // Fungsi fetch data inventory dari Backend
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
    fetchItemTypes(); // Ambil data tipe saat halaman dimuat
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter, startDate, endDate]);

  // Definisi Kolom untuk TanStack Table (Ditambahkan kolom Tipe Barang)
  const columns = React.useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: info => `#${info.getValue()}`,
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
      accessorKey: 'stock',
      header: 'Stok',
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
      // Payload disesuaikan dengan relasi itemType ke backend Spring Boot
      await api.post('/inventory-service/api/inventory', {
        name: formData.name,
        stock: parseInt(formData.stock, 10),
        price: parseFloat(formData.price),
        itemType: {
          id: parseInt(formData.itemTypeId, 10)
        }
      });
      setFormData({ name: '', stock: '', price: '', itemTypeId: '' });
      setDisplayPrice('');
      setIsModalOpen(false);
      fetchInventory();
    } catch (err) {
      console.error("Gagal menyimpan data:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header & Aksi */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MANAJEMEN INVENTARIS</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola stok barang dan harga inventaris perusahaan.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
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

        {/* TABEL DATA DENGAN TANSTACK TABLE */}
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
                    <td colSpan="5" className="py-8 text-center text-gray-400">Memuat data dari server...</td>
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
                    <td colSpan="5" className="py-8 text-center text-gray-400">Tidak ada data ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
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

        {/* MODAL TAMBAH BARANG */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">Tambah Inventaris Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nama Barang</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* Dropdown Tipe Barang */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tipe Barang</label>
                  <select 
                    required
                    value={formData.itemTypeId}
                    onChange={(e) => setFormData({...formData, itemTypeId: e.target.value})}
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
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Stok</label>
                  <input 
                    type="number" required
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
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
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}