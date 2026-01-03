import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '../types/invoice.types';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { InvoiceService } from '../services/invoice.service';

interface InvoiceTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onProcessOcr?: (id: string) => void;
  processingOcrIds?: string[];
}

/**
 * Table component for displaying invoice list
 */
const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  isLoading,
  onDelete,
  onProcessOcr,
  processingOcrIds = [],
}) => {
  const navigate = useNavigate();
  const [exportingIds, setExportingIds] = useState<string[]>([]);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);

  const canProcessOcr = (status: string) => {
    return ['PENDING', 'FAILED'].includes(status);
  };

  const canExport = (status: string) => {
    return ['PARSED', 'NEEDS_REVIEW', 'REVIEWED'].includes(status);
  };

  const handleExport = async (invoiceId: string, format: 'csv' | 'excel' | 'pdf') => {
    setExportingIds(prev => [...prev, invoiceId]);
    setExportMenuId(null);
    try {
      const blob = await InvoiceService.exportInvoices(format, [invoiceId]);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extensions = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `invoice-${invoiceId.slice(0, 8)}-${timestamp}.${extensions[format]}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export invoice. Please try again.');
    } finally {
      setExportingIds(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: string | null, currency: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-4 border-b border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
        <p className="text-gray-500">Upload your first invoice to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {invoice.invoiceNumber || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(invoice.invoiceDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatAmount(invoice.totalAmount, invoice.currency)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <InvoiceStatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(invoice.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => navigate(`/invoices/${invoice.id}/review`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {invoice.status === 'NEEDS_REVIEW' ? 'Review' : 'View'}
                  </button>
                  {onProcessOcr && canProcessOcr(invoice.status) && (
                    <button
                      onClick={() => onProcessOcr(invoice.id)}
                      disabled={processingOcrIds.includes(invoice.id)}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOcrIds.includes(invoice.id) ? 'Processing...' : 'Process OCR'}
                    </button>
                  )}
                  {/* Export dropdown for processed invoices */}
                  {canExport(invoice.status) && (
                    <div className="relative">
                      <button
                        onClick={() => setExportMenuId(exportMenuId === invoice.id ? null : invoice.id)}
                        disabled={exportingIds.includes(invoice.id)}
                        className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        title="Export extracted data"
                      >
                        {exportingIds.includes(invoice.id) ? '⏳' : '📥 Export'}
                      </button>
                      {exportMenuId === invoice.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                          <div className="py-1">
                            <button
                              onClick={() => handleExport(invoice.id, 'csv')}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              📄 CSV
                            </button>
                            <button
                              onClick={() => handleExport(invoice.id, 'excel')}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              📊 Excel
                            </button>
                            <button
                              onClick={() => handleExport(invoice.id, 'pdf')}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                            >
                              📕 PDF
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(invoice.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;

