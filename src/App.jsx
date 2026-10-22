import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import InventoryPage from './pages/inventory/InventoryPage'; // Halaman Items
import ItemTypePage from './pages/inventory/ItemTypePage'; // Halaman Item Type
import StockMutationPage from './pages/inventory/StockMutationPage'; // Halaman Mutasi Stok baru
import BranchStockPage from './pages/inventory/BranchStockPage'; // Halaman Stok Cabang baru
import StockOpnamePage from './pages/inventory/StockOpnamePage'; // Halaman Stock Opname baru
import StockOpnameDetailPage from './pages/inventory/StockOpnameDetailPage'; // Halaman Detail Stock Opname baru
import SalesPage from './pages/sales/SalesPage';
import CustomerPage from './pages/customer/CustomerPage'; // Halaman Customer & Rekam Medis baru

function App() {
  return (
    <Router>
      <Routes>
        {/* Semua halaman kini konsisten dibungkus MainLayout agar sidebar selalu tampil */}
        <Route path="/" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/inventory" element={<Navigate to="/inventory/items" replace />} />
        <Route path="/inventory/items" element={<MainLayout><InventoryPage /></MainLayout>} />
        <Route path="/inventory/types" element={<MainLayout><ItemTypePage /></MainLayout>} />
        <Route path="/inventory/mutations" element={<MainLayout><StockMutationPage /></MainLayout>} />
        <Route path="/inventory/branch-stocks" element={<MainLayout><BranchStockPage /></MainLayout>} />
        <Route path="/inventory/stock-opname" element={<MainLayout><StockOpnamePage /></MainLayout>} />
        <Route path="/inventory/stock-opname/:id" element={<MainLayout><StockOpnameDetailPage /></MainLayout>} />
        <Route path="/sales" element={<MainLayout><SalesPage /></MainLayout>} />
        <Route path="/customers" element={<MainLayout><CustomerPage /></MainLayout>} />
      </Routes>
    </Router>
  );
}

export default App;