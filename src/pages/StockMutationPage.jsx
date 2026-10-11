import React, { useEffect, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from '@tanstack/react-table';
import api from '../services/api';
import MainLayout from '../components/MainLayout';
import { RefreshCw, Send, ArrowRightLeft } from 'lucide-react';

export default function StockMutationPage() {
  const [mutations, setMutations] = useState([]);
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State Form Mutasi
  const [formData, setFormData] = useState({
    itemId: '',
    sourceBranchId: '',
    destinationBranchId: '',
    quantity: ''
  });

  // Fetch daftar riwayat mutasi
  const fetchMutations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory-service/api/inventory/mutations');
      setMutations(response.data);
    } catch (err) {
      console.error("Gagal memuat riwayat mutasi:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch daftar barang untuk dropdown
  const fetchItems = async () => {
    try {
      const response = await api.get('/inventory-service/api/inventory');
      setItems(response.data.content || response.data);
    } catch (err) {
      console.error("Gagal memuat data barang:", err);
    }
  };

  // Fetch daftar cabang untuk dropdown asal & tujuan
  const fetchBranches = async () => {
    try {
      const response = await api.get('/inventory-service/api/branches');
      setBranches(response.data);
    } catch (err) {
      console.error("Gagal memuat data cabang:", err);
    }
  };

  useEffect(() => {
    fetchMutations();
    fetchItems();
    fetchBranches();
  }, []);

  // Helper untuk mencari nama cabang berdasarkan ID
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === Number(branchId));
    return branch ? (branch.name || branch.branchName || `Cabang #${branchId}`) : `Cabang #${branchId}`;
  };

  // Helper untuk mencari nama barang berdasarkan ID
  const getItemName = (itemId) => {
    const item = items.find(i => i.id === Number(itemId));
    return item ? (item.name || `Barang #${itemId}`) : `Barang #${itemId}`;
  };

  const handleSubmitMutation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await api.post('/inventory-service/api/inventory/mutations/transfer', {
        itemId: parseInt(formData.itemId, 10),
        sourceBranchId: parseInt(formData.sourceBranchId, 10),
        destinationBranchId: parseInt(formData.destinationBranchId, 10),
        quantity: parseInt(formData.quantity, 10)
      });

      setSuccessMessage('Mutasi stok berhasil dilakukan!');
      setFormData({ itemId: '', sourceBranchId: '', destinationBranchId: '', quantity: '' });
      fetchMutations();
    } catch (err) {
      console.error("Gagal melakukan mutasi:", err);
      const errorMsg = err.response?.data || 'Terjadi kesalahan saat memproses mutasi stok.';
      setErrorMessage(typeof errorMsg === 'string' ? errorMsg : 'Gagal melakukan mutasi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Kolom untuk TanStack Table Riwayat Mutasi
  const columns = React.useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: info => `#${info.getValue()}`,
    },
    {
      accessorKey: 'itemId',
      header: 'Nama Barang',
      cell: info => {
        const itemId = info.getValue();
        return <span className="font-semibold text-gray-800">{getItemName(itemId)}</span>;
      },
    },
    {
      accessorKey: 'sourceBranchId',
      header: 'Cabang Asal',
      cell: info => {
        const branchId = info.getValue();
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">{getBranchName(branchId)}</span>;
      },
    },
    {
      accessorKey: 'destinationBranchId',
      header: 'Cabang Tujuan',
      cell: info => {
        const branchId = info.getValue();
        return <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">{getBranchName(branchId)}</span>;
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Jumlah',
      cell: info => <span className="font-bold text-indigo-600">{info.getValue()} Unit</span>,
    },
    {
      accessorKey: 'mutationDate',
      header: 'Tanggal Mutasi',
      cell: info => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleString('id-ID') : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
      },
    },
  ], [branches, items]);

  const table = useReactTable({
    data: mutations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MUTASI STOK ANTAR CABANG</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola perpindahan inventaris antar lokasi cabang perusahaan.</p>
          </div>
          <button 
            onClick={fetchMutations}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <RefreshCw size={16} /> Refresh Riwayat
          </button>
        </div>

        {/* Form Transfer Stok */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-indigo-600" /> Form Transfer Stok
          </h3>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmitMutation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Pilih Barang</label>
              <select 
                required
                value={formData.itemId}
                onChange={(e) => setFormData({...formData, itemId: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Pilih Barang --</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name || `Barang #${item.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cabang Asal</label>
              <select 
                required
                value={formData.sourceBranchId}
                onChange={(e) => setFormData({...formData, sourceBranchId: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Cabang Asal --</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name || branch.branchName || `Cabang #${branch.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cabang Tujuan</label>
              <select 
                required
                value={formData.destinationBranchId}
                onChange={(e) => setFormData({...formData, destinationBranchId: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">-- Cabang Tujuan --</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name || branch.branchName || `Cabang #${branch.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Kuantitas</label>
              <div className="flex gap-2">
                <input 
                  type="number" required min="1"
                  placeholder="Jumlah"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
                >
                  <Send size={16} /> {submitting ? '...' : 'Kirim'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tabel Riwayat Mutasi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">Riwayat Mutasi Stok</h3>
          </div>
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
                    <td colSpan="7" className="py-8 text-center text-gray-400">Memuat riwayat mutasi...</td>
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
                    <td colSpan="7" className="py-8 text-center text-gray-400">Belum ada riwayat mutasi stok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}