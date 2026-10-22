import React, { useEffect, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from '@tanstack/react-table';
import api from '../../services/api';
import { RefreshCw, Building2, Package } from 'lucide-react';

export default function BranchStockPage() {
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchStocks, setBranchStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch daftar cabang untuk dropdown & helper nama
  const fetchBranches = async () => {
    try {
      const response = await api.get('/inventory-service/api/branches');
      const branchList = response.data;
      setBranches(branchList);
      if (branchList.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchList[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat data cabang:", err);
    }
  };

  // Fetch daftar barang untuk helper nama barang
  const fetchItems = async () => {
    try {
      const response = await api.get('/inventory-service/api/inventory');
      setItems(response.data.content || response.data);
    } catch (err) {
      console.error("Gagal memuat data barang:", err);
    }
  };

  // Fetch stok berdasarkan branchId yang dipilih
  const fetchBranchStocks = async (branchId) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const response = await api.get(`/inventory-service/api/inventory/branch-stocks/${branchId}`);
      setBranchStocks(response.data);
    } catch (err) {
      console.error("Gagal memuat stok cabang:", err);
      setBranchStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchItems();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchStocks(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Helper untuk mencari nama cabang
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === Number(branchId));
    return branch ? (branch.name || branch.branchName || `Cabang #${branchId}`) : `Cabang #${branchId}`;
  };

  // Helper untuk mencari nama barang
  const getItemName = (itemId) => {
    const item = items.find(i => i.id === Number(itemId));
    return item ? (item.name || `Barang #${itemId}`) : `Barang #${itemId}`;
  };

  // Kolom untuk TanStack Table Stok Cabang
  const columns = React.useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID Mapping',
      cell: info => `#${info.getValue()}`,
    },
    {
      accessorKey: 'itemId',
      header: 'Nama Barang',
      cell: info => {
        const itemId = info.getValue();
        return (
          <span className="font-semibold text-gray-800 flex items-center gap-1.5">
            <Package size={16} className="text-indigo-600" /> {getItemName(itemId)}
          </span>
        );
      },
    },
    {
      accessorKey: 'branchId',
      header: 'Cabang',
      cell: info => {
        const branchId = info.getValue();
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">{getBranchName(branchId)}</span>;
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Sisa Stok di Cabang',
      cell: info => (
        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
          {info.getValue()} Unit
        </span>
      ),
    },
  ], [branches, items]);

  const table = useReactTable({
    data: branchStocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const currentBranchName = getBranchName(selectedBranchId);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MONITORING STOK PER CABANG</h1>
            <p className="text-sm text-gray-500 mt-1">Pantau ketersediaan inventaris secara spesifik di tiap lokasi cabang.</p>
          </div>
          <button 
            onClick={() => fetchBranchStocks(selectedBranchId)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <RefreshCw size={16} /> Refresh Stok
          </button>
        </div>

        {/* Filter / Pemilih Cabang */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
            <Building2 size={18} className="text-indigo-600" /> Pilih Cabang:
          </div>
          <select 
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[260px]"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name || branch.branchName || `Cabang #${branch.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Tabel Data Stok Cabang */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-800">
              Daftar Stok Inventaris — {currentBranchName}
            </h3>
            <span className="text-xs text-gray-500">Total Jenis Barang Tercatat: {branchStocks.length}</span>
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
                    <td colSpan="4" className="py-8 text-center text-gray-400">Memuat data stok cabang...</td>
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
                    <td colSpan="4" className="py-8 text-center text-gray-400">Belum ada data stok yang tercatat di cabang ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}