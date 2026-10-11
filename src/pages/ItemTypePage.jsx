import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { Plus, Layers, X, Trash2, Edit } from 'lucide-react';
import api from '../services/api'; 

export default function ItemTypePage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [typeName, setTypeName] = useState('');
  const [typeDesc, setTypeDesc] = useState('');

  // Fungsi untuk mengambil data dari Backend melalui Edge Gateway (/api/inventory/types)
  const fetchItemTypes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory-service/api/inventory/types');
      setTypes(response.data);
    } catch (err) {
      console.error("Gagal memuat data item types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemTypes();
  }, []);

  // Handler Buka Modal untuk Tambah Baru
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setTypeName('');
    setTypeDesc('');
    setIsModalOpen(true);
  };

  // Handler Buka Modal untuk Edit Data
  const handleOpenEditModal = (item) => {
    setIsEditMode(true);
    setCurrentId(item.id);
    setTypeName(item.name);
    setTypeDesc(item.description || '');
    setIsModalOpen(true);
  };

  // Simpan Data (Create atau Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName) return;
    
    try {
      if (isEditMode) {
        // Request PUT untuk update berdasarkan ID
        await api.put(`/inventory-service/api/inventory/types/${currentId}`, {
          name: typeName,
          description: typeDesc || '-'
        });
      } else {
        // Request POST untuk tambah baru
        await api.post('/inventory-service/api/inventory/types', {
          name: typeName,
          description: typeDesc || '-'
        });
      }

      setTypeName('');
      setTypeDesc('');
      setIsModalOpen(false);
      fetchItemTypes(); // Refresh data setelah berhasil simpan
    } catch (err) {
      console.error("Gagal menyimpan data:", err);
    }
  };

  // Hapus Data (Delete)
  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus tipe ini?")) return;
    try {
      await api.delete(`/inventory-service/api/inventory/types/${id}`);
      fetchItemTypes(); // Refresh data setelah berhasil hapus
    } catch (err) {
      console.error("Gagal menghapus data:", err);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MANAJEMEN ITEM TYPE</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola kategori atau tipe jenis barang inventaris.</p>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} /> Tambah Tipe Baru
          </button>
        </div>

        {/* TABEL ITEM TYPE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="py-4 px-6 font-semibold">ID</th>
                <th className="py-4 px-6 font-semibold">Nama Tipe</th>
                <th className="py-4 px-6 font-semibold">Deskripsi</th>
                <th className="py-4 px-6 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-400">Memuat data dari server...</td>
                </tr>
              ) : types.length > 0 ? (
                types.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-4 px-6 font-medium text-gray-900">#{item.id}</td>
                    <td className="py-4 px-6 font-semibold text-gray-800 flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600" /> {item.name}
                    </td>
                    <td className="py-4 px-6 text-gray-500">{item.description}</td>
                    <td className="py-4 px-6 text-center space-x-2">
                      <button 
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition inline-block"
                        title="Edit Tipe"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition inline-block"
                        title="Hapus Tipe"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-400">Belum ada data tipe barang.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL FORM TAMBAH / EDIT TIPE */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-800">
                  {isEditMode ? 'Edit Tipe Barang' : 'Tambah Tipe Barang Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nama Tipe</label>
                  <input 
                    type="text" required
                    placeholder="Contoh: Elektronik, Bahan Baku..." 
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Deskripsi</label>
                  <textarea 
                    placeholder="Keterangan singkat..." 
                    value={typeDesc}
                    onChange={(e) => setTypeDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
                    {isEditMode ? 'Simpan Perubahan' : 'Simpan Tipe'}
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