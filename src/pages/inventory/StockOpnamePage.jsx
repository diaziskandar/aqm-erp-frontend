'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ClipboardList, ArrowLeft, Save, CheckCircle } from 'lucide-react';

export default function StockOpnameDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [sessionInfo, setSessionInfo] = useState({
    documentNo: '',
    branch: '',
    opnameDate: '',
    notes: ''
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStockOpnameDetail();
    }
  }, [id]);

  const fetchStockOpnameDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/inventory-service/api/inventory/stock-opname/${id}`);
      const data = response.data;
      
      setSessionInfo({
        documentNo: data.documentNo || `SO-${id}`,
        branch: data.branch || '-',
        opnameDate: data.opnameDate || '-',
        notes: data.notes || '-'
      });

      if (data.details) {
        const formattedDetails = data.details.map((detail) => ({
          id: detail.id,
          sku: detail.item ? detail.item.itemCode : '-',
          name: detail.item ? detail.item.name : 'Barang Item',
          systemStock: detail.systemStock ?? 0,
          physicalStock: detail.physicalStock ?? 0,
          notes: detail.notes || ''
        }));
        setItems(formattedDetails);
      }
    } catch (error) {
      console.error("Gagal mengambil detail stock opname", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalChange = async (detailId, value) => {
    const val = parseInt(value) || 0;
    setItems(items.map(item => item.id === detailId ? { ...item, physicalStock: val } : item));

    try {
      const currentItem = items.find(i => i.id === detailId);
      await api.put(`/inventory-service/api/inventory/stock-opname/detail/${detailId}`, {
        physicalStock: val,
        notes: currentItem?.notes || ''
      });
    } catch (error) {
      console.error("Gagal memperbarui stok fisik ke backend", error);
    }
  };

  const handleNotesChange = async (detailId, notesValue) => {
    setItems(items.map(item => item.id === detailId ? { ...item, notes: notesValue } : item));

    try {
      const currentItem = items.find(i => i.id === detailId);
      await api.put(`/inventory-service/api/inventory/stock-opname/detail/${detailId}`, {
        physicalStock: currentItem?.physicalStock || 0,
        notes: notesValue
      });
    } catch (error) {
      console.error("Gagal memperbarui catatan ke backend", error);
    }
  };

  const handleCompleteOpname = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menyelesaikan sesi stock opname ini?")) return;
    try {
      const response = await api.put(`/inventory-service/api/inventory/stock-opname/${id}/complete`);
      if (response.status === 200) {
        alert("Sesi Stock Opname berhasil diselesaikan!");
        navigate('/inventory/stock-opname');
      }
    } catch (error) {
      console.error("Gagal menyelesaikan opname", error);
      alert("Terjadi kesalahan pada server saat menyelesaikan opname.");
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/inventory/stock-opname')}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition shadow-sm cursor-pointer"
            title="Kembali ke Daftar Stock Opname"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-indigo-600" />
              Detail Stock Opname: {sessionInfo.documentNo}
            </h1>
            <p className="text-sm text-slate-500">Cabang: {sessionInfo.branch} | Tanggal: {sessionInfo.opnameDate}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            type="button"
            onClick={() => alert("Perubahan tersimpan otomatis.")}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Save className="w-4 h-4" /> Simpan Draft
          </button>
          <button 
            type="button"
            onClick={handleCompleteOpname}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" /> Selesaikan Opname
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">SKU / Barang</th>
                <th className="py-3 px-4 text-center">Stok Sistem</th>
                <th className="py-3 px-4 text-center">Stok Fisik (Input)</th>
                <th className="py-3 px-4 text-center">Selisih (Variance)</th>
                <th className="py-3 px-4">Keterangan / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Memuat detail barang...</td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => {
                  const variance = item.physicalStock - item.systemStock;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-600">{item.systemStock}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={item.physicalStock}
                          onChange={(e) => handlePhysicalChange(item.id, e.target.value)}
                          className="w-20 text-center border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          variance === 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : variance > 0 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          placeholder="Tambahkan catatan..."
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">Tidak ada item inventaris yang ditemukan dalam database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}