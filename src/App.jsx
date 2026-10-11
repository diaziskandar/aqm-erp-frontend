import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage'; // Halaman Items
import ItemTypePage from './pages/ItemTypePage'; // Halaman Item Type
import StockMutationPage from './pages/StockMutationPage'; // Halaman Mutasi Stok baru
import BranchStockPage from './pages/BranchStockPage'; // Halaman Stok Cabang baru
import SalesPage from './pages/SalesPage';
import CustomerPage from './pages/CustomerPage'; // Halaman Customer & Rekam Medis baru

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inventory" element={<Navigate to="/inventory/items" replace />} />
        <Route path="/inventory/items" element={<InventoryPage />} />
        <Route path="/inventory/types" element={<ItemTypePage />} />
        {/* Rute baru untuk Mutasi Stok dan Stok Cabang */}
        <Route path="/inventory/mutations" element={<StockMutationPage />} />
        <Route path="/inventory/branch-stocks" element={<BranchStockPage />} />
        <Route path="/sales" element={<SalesPage />} />
        {/* Rute baru untuk Customer & Rekam Medis */}
        <Route path="/customers" element={<CustomerPage />} />
      </Routes>
    </Router>
  );
}

export default App;