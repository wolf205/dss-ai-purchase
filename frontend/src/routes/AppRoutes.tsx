import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginForm from '../features/auth/components/LoginForm';

// Pages
import InventoryDashboardPage from '../features/inventory/pages/InventoryDashboardPage';
import AbcXyzMatrixPage from '../features/inventory/pages/AbcXyzMatrixPage';
import ForecastingPage from '../features/forecasting/pages/ForecastingPage';
import RecommendationsPage from '../features/recommendations/pages/RecommendationsPage';
import PurchaseOrdersPage from '../features/purchase-orders/pages/PurchaseOrdersPage';
import ProductsPage from '../features/products/pages/ProductsPage';
import SuppliersPage from '../features/suppliers/pages/SuppliersPage';
import SupplierEvaluationsPage from '../features/suppliers/pages/SupplierEvaluationsPage';
import DataImportPage from '../features/ingestion/pages/DataImportPage';
import UserManagementPage from '../features/system-config/pages/UserManagementPage';
import SupplierWeightsPage from '../features/system-config/pages/SupplierWeightsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginForm />} />
      </Route>

      {/* Protected Business Routes (Staff & Admin) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/inventory" replace />} />
          <Route path="/inventory" element={<InventoryDashboardPage />} />
          <Route path="/inventory/abc-xyz" element={<AbcXyzMatrixPage />} />
          <Route path="/forecasting" element={<ForecastingPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/evaluations" element={<SupplierEvaluationsPage />} />
          <Route path="/data-import" element={<DataImportPage />} />

          {/* Protected Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/system/users" element={<UserManagementPage />} />
            <Route path="/system/weights" element={<SupplierWeightsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/inventory" replace />} />
    </Routes>
  );
};

export default AppRoutes;
