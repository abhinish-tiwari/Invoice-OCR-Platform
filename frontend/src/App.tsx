import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './auth/hooks/useAuth';
import { ProtectedRoute } from './auth/components/ProtectedRoute';
import { PublicRoute } from './auth/components/PublicRoute';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./auth/pages/Login'));
const RegisterPage = lazy(() => import('./auth/pages/Register'));
const DashboardPage = lazy(() => import('./common/pages/Dashboard'));
const InvoicesPage = lazy(() => import('./invoices/pages/InvoicesPage'));
const InvoiceUploadPage = lazy(() => import('./invoices/pages/InvoiceUploadPage'));
const InvoiceReviewPage = lazy(() => import('./invoices/pages/InvoiceReviewPage'));
const AnalyticsDashboard = lazy(() => import('./analytics/pages/DashboardPage'));
const ProductsPage = lazy(() => import('./products/pages/ProductsPage'));
const SuppliersPage = lazy(() => import('./suppliers/pages/SuppliersPage'));
const AdminPage = lazy(() => import('./admin/pages/AdminPage'));
const SettingsPage = lazy(() => import('./settings/pages/SettingsPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
                <Route path="/invoices/upload" element={<ProtectedRoute><InvoiceUploadPage /></ProtectedRoute>} />
                <Route path="/invoices/:id/review" element={<ProtectedRoute><InvoiceReviewPage /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
