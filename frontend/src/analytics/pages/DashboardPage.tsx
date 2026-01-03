/**
 * Analytics Dashboard Page
 * Main dashboard with all analytics visualizations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SummaryCards,
  SpendingChart,
  SupplierBreakdown,
  StatusDistribution,
  TopProducts,
} from '../components';
import analyticsApi from '../services/analytics.api';
import { AnalyticsDashboard } from '../types/analytics.types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await analyticsApi.getDashboard();
        setDashboard(data);
      } catch (err: any) {
        const errorMessage = typeof err === 'string' ? err : (err?.message || 'Failed to load dashboard');
        setError(errorMessage);
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    analyticsApi.getDashboard()
      .then(setDashboard)
      .catch((err) => setError(typeof err === 'string' ? err : (err?.message || 'Failed to load dashboard')))
      .finally(() => setLoading(false));
  };

  const defaultSummary = {
    totalInvoices: 0,
    totalSpending: 0,
    pendingInvoices: 0,
    processedInvoices: 0,
    averageConfidence: 0,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
                <span className="text-2xl mr-2">🧾</span>
                <h1 className="text-xl font-bold text-gray-900">Invoice OCR</h1>
              </div>
              <div className="hidden sm:flex space-x-4">
                <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</button>
                <button onClick={() => navigate('/invoices')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Invoices</button>
                <button onClick={() => navigate('/products')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Products</button>
                <button onClick={() => navigate('/suppliers')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Suppliers</button>
                <button onClick={() => navigate('/analytics')} className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">Analytics</button>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of your invoice processing</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <button onClick={handleRefresh} className="text-sm underline mt-1">
              Try again
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <SummaryCards summary={dashboard?.summary || defaultSummary} loading={loading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SpendingChart data={dashboard?.spendingByMonth || []} loading={loading} />
          <StatusDistribution data={dashboard?.statusSummary || []} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SupplierBreakdown data={dashboard?.spendingBySupplier || []} loading={loading} />
          <TopProducts data={dashboard?.topProducts || []} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

