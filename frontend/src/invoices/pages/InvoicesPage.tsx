import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceList, useInvoiceStats, useDeleteInvoice, useProcessOcr } from '../hooks/useInvoices';
import { InvoiceTable, InvoiceStatsCard } from '../components';
import { InvoiceStatus } from '../types/invoice.types';
import { InvoiceService } from '../services/invoice.service';
import Button from '../../common/components/Button';

const STATUSES: { value: '' | InvoiceStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PARSED', label: 'Parsed' },
  { value: 'NEEDS_REVIEW', label: 'Needs Review' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'FAILED', label: 'Failed' },
];

/**
 * Main invoices list page
 */
const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'' | InvoiceStatus>('');
  const limit = 10;

  const { data: invoiceData, isLoading } = useInvoiceList({
    page,
    limit,
    status: status || undefined,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const { data: stats, isLoading: statsLoading } = useInvoiceStats();
  const deleteInvoice = useDeleteInvoice();
  const processOcr = useProcessOcr();
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoice.mutateAsync(id);
    }
  };

  const handleProcessOcr = async (id: string) => {
    setProcessingIds(prev => [...prev, id]);
    try {
      await processOcr.mutateAsync(id);
    } finally {
      setProcessingIds(prev => prev.filter(pid => pid !== id));
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const blob = await InvoiceService.exportInvoices(format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extensions = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `invoices-export-${timestamp}.${extensions[format]}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export invoices. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = invoiceData?.totalPages || 1;

  return (
    <div className="min-h-screen bg-gray-50">
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
                <button onClick={() => navigate('/invoices')} className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">Invoices</button>
                <button onClick={() => navigate('/products')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Products</button>
                <button onClick={() => navigate('/suppliers')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Suppliers</button>
                <button onClick={() => navigate('/analytics')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Analytics</button>
              </div>
            </div>
            <Button onClick={() => navigate('/invoices/upload')}>
              + Upload Invoice
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-6">
          <InvoiceStatsCard stats={stats} isLoading={statsLoading} />
        </div>

        {/* Filters and Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | InvoiceStatus);
                setPage(1);
              }}
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || !invoiceData?.data?.length}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  📥 Export
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    📄 Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    📊 Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    📕 Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Table */}
        <InvoiceTable
          invoices={invoiceData?.data || []}
          isLoading={isLoading}
          onDelete={handleDelete}
          onProcessOcr={handleProcessOcr}
          processingOcrIds={processingIds}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Page {page} of {totalPages} ({invoiceData?.total || 0} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;

