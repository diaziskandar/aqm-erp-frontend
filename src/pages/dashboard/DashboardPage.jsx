import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LayoutDashboard, TrendingUp, DollarSign, Package, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [items, setItems] = useState([]);

  // Mengambil data inventory untuk ditampilkan pada grafik dashboard
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get('/inventory-service/api/inventory');
        setItems(response.data);
      } catch (err) {
        console.error("Gagal memuat data untuk dashboard:", err);
      }
    };
    fetchInventory();
  }, []);

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">DASHBOARD UTAMA ERP</h1>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items SKU</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{items.length}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">Active (Connected)</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">API Gateway</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">Port 8081</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        {/* GRAFIK STATISTIK STOK BARANG */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 className="text-indigo-600" size={20} /> Grafik Statistik Stok Barang
            </h3>
            <span className="text-xs text-gray-400">Real-time dari Inventory Service</span>
          </div>
          <div className="h-72 w-full">
            {items.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={items} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    interval={0} 
                    angle={-15} 
                    textAnchor="end" 
                  />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  {/* Diubah dari dataKey="stock" menjadi dataKey="quantity" */}
                  <Bar dataKey="quantity" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Jumlah Quantity" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Belum ada data untuk ditampilkan pada grafik.
              </div>
            )}
          </div>
        </div>
      </div>
  );
}