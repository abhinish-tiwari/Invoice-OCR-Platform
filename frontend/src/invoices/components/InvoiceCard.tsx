import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice } from '../types/invoice.types';
import InvoiceStatusBadge from './InvoiceStatusBadge';

interface InvoiceCardProps {
  invoice: Invoice;
  onDelete?: (id: string) => void;
}

/**
 * Card component for displaying invoice summary
 */
const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onDelete }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: string | null, currency: string) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(parseFloat(amount));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFileIcon(invoice.fileType)}</span>
          <div>
            <h3 className="font-medium text-gray-900">
              {invoice.invoiceNumber || 'No Invoice Number'}
            </h3>
            <p className="text-sm text-gray-500">
              Uploaded {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Invoice Date</span>
          <p className="font-medium text-gray-900">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <div>
          <span className="text-gray-500">Amount</span>
          <p className="font-medium text-gray-900">
            {formatAmount(invoice.totalAmount, invoice.currency)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => navigate(`/invoices/${invoice.id}`)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          View Details
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(invoice.id)}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default InvoiceCard;

