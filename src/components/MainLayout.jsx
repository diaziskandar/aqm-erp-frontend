import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, ShieldCheck, ChevronDown, ChevronUp, Layers, Menu, Bell, Search, LogOut, ArrowRightLeft, Building2, Users, ClipboardList } from 'lucide-react';
import keycloak from '../keycloak';

export default function MainLayout({ children }) {
  const location = useLocation();
  
  // State dropdown terbuka otomatis HANYA jika rute saat ini dimulai dengan /inventory
  const [inventoryOpen, setInventoryOpen] = useState(location.pathname.startsWith('/inventory'));

  // Sinkronkan state jika path berubah
  useEffect(() => {
    if (location.pathname.startsWith('/inventory')) {
      setInventoryOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* SIDEBAR KIRI */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 bg-indigo-600 text-white font-bold text-xl tracking-wider">
          MINIMIA
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 text-sm">
          <div>
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <nav className="space-y-1">
              <Link 
                to="/" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition ${
                  location.pathname === '/' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>

              {/* MENU INVENTORY DENGAN SUBMENU */}
              <div>
                <button 
                  onClick={() => setInventoryOpen(!inventoryOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition ${
                    location.pathname.startsWith('/inventory') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package size={18} /> Inventory
                  </div>
                  {inventoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {inventoryOpen && (
                  <div className="pl-9 space-y-1 mt-1">
                    <Link 
                      to="/inventory/items" 
                      className={`block px-3 py-2 rounded-lg text-xs font-medium transition ${
                        location.pathname === '/inventory/items' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      Items
                    </Link>
                    <Link 
                      to="/inventory/types" 
                      className={`block px-3 py-2 rounded-lg text-xs font-medium transition ${
                        location.pathname === '/inventory/types' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      Item Type
                    </Link>
                    <Link 
                      to="/inventory/mutations" 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        location.pathname === '/inventory/mutations' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <ArrowRightLeft size={14} /> Mutasi Stok
                    </Link>
                    <Link 
                      to="/inventory/branch-stocks" 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        location.pathname === '/inventory/branch-stocks' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <Building2 size={14} /> Stok Cabang
                    </Link>
                    {/* Submenu baru untuk Stock Opname */}
                    <Link 
                      to="/inventory/stock-opname" 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        location.pathname === '/inventory/stock-opname' ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <ClipboardList size={14} /> Stock Opname
                    </Link>
                  </div>
                )}
              </div>

              <Link 
                to="/sales" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition ${
                  location.pathname === '/sales' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart size={18} /> Sales
              </Link>

              {/* MENU CUSTOMER & REKAM MEDIS */}
              <Link 
                to="/customers" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition ${
                  location.pathname === '/customers' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users size={18} /> Customer & Medis
              </Link>
            </nav>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-indigo-600 text-white flex items-center justify-between px-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-300">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="admin, widgets..." 
                className="bg-indigo-700/50 text-white placeholder-indigo-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none w-64"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Bell size={20} className="cursor-pointer text-indigo-200 hover:text-white" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-indigo-700 hover:bg-red-600 text-indigo-100 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}