import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoice, useInvoiceLines, useUpdateLineItem, useMarkReviewed } from '../hooks/useInvoices';
import { InvoiceLine, InvoiceService } from '../services/invoice.service';
import Button from '../../common/components/Button';
import InvoiceStatusBadge from '../components/InvoiceStatusBadge';

/**
 * Invoice Review Page
 * Allows users to review and correct low-confidence OCR extractions
 */
const InvoiceReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id!);
  const { data: lines, isLoading: linesLoading } = useInvoiceLines(id!);
  const updateLineItem = useUpdateLineItem(id!);
  const markReviewed = useMarkReviewed();
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InvoiceLine>>({});

  const handleEdit = (line: InvoiceLine) => {
    setEditingLine(line.id);
    setEditForm({
      normalized_description: line.normalized_description || line.raw_description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      line_total: line.line_total,
    });
  };

  const handleSave = async (lineId: string) => {
    await updateLineItem.mutateAsync({
      lineId,
      data: {
        normalizedDescription: editForm.normalized_description || undefined,
        quantity: editForm.quantity || undefined,
        unitPrice: editForm.unit_price || undefined,
        lineTotal: editForm.line_total || undefined,
        needsReview: false,
        reviewed: true,
      },
    });
    setEditingLine(null);
    setEditForm({});
  };

  // Approve a single line item (mark as reviewed without changes)
  const handleApprove = async (lineId: string) => {
    await updateLineItem.mutateAsync({
      lineId,
      data: {
        needsReview: false,
        reviewed: true,
      },
    });
  };

  // Reject a line item (mark for deletion or re-processing)
  const handleReject = async (lineId: string) => {
    if (window.confirm('Are you sure you want to reject this line item? It will be removed.')) {
      await updateLineItem.mutateAsync({
        lineId,
        data: {
          needsReview: false,
          reviewed: true,
          // Mark as rejected by setting confidence to 0
          confidenceScore: 0,
        },
      });
    }
  };

  const handleMarkReviewed = async () => {
    await markReviewed.mutateAsync(id!);
    navigate('/invoices');
  };

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const blob = await InvoiceService.exportInvoices(format, [id!]);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extensions = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
      const timestamp = new Date().toISOString().split('T')[0];
      const invoiceNum = invoice?.invoiceNumber || id!.slice(0, 8);
      link.download = `invoice-${invoiceNum}-${timestamp}.${extensions[format]}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export invoice. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = invoice && ['PARSED', 'NEEDS_REVIEW', 'REVIEWED'].includes(invoice.status);

  const getConfidenceColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (invoiceLoading || linesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Invoice not found</h2>
          <Button onClick={() => navigate('/invoices')} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const needsReviewLines = lines?.filter(l => l.needs_review) || [];
  const reviewedLines = lines?.filter(l => !l.needs_review) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/invoices')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                Review Invoice: {invoice.invoiceNumber || 'N/A'}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div className="flex items-center gap-3">
              {/* Export Button - shown when data is available */}
              {canExport && (
                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Exporting...
                      </>
                    ) : (
                      <>
                        📥 Export Data
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
              )}

              <Button
                onClick={handleMarkReviewed}
                disabled={needsReviewLines.length > 0 || markReviewed.isPending}
              >
                {markReviewed.isPending ? 'Saving...' : 'Mark as Reviewed'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Split View: Image on Left, Data on Right */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel: Invoice Image (Scrollable, Zoomable) */}
        <div className="w-1/2 border-r bg-gray-100 overflow-auto p-4">
          <div className="sticky top-0 bg-gray-100 pb-2 mb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900">📄 Original Invoice</h2>
          </div>
          <div className="bg-white rounded-lg shadow p-2">
            {invoice.fileUrl ? (
              <img
                src={`http://localhost:3000${invoice.fileUrl}`}
                alt="Invoice"
                className="w-full h-auto cursor-zoom-in"
                onClick={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.style.transform === 'scale(2)') {
                    img.style.transform = 'scale(1)';
                    img.style.cursor = 'zoom-in';
                  } else {
                    img.style.transform = 'scale(2)';
                    img.style.cursor = 'zoom-out';
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No image available
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Extracted Data */}
        <div className="w-1/2 overflow-auto p-4">
          {/* Invoice Summary Card */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📋 Extracted Data</h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-500 text-xs">Invoice #</p>
                <p className="font-medium">{invoice.invoiceNumber || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-500 text-xs">Date</p>
                <p className="font-medium">{invoice.invoiceDate || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-500 text-xs">Total</p>
                <p className="font-medium">{invoice.totalAmount ? `${invoice.currency} ${invoice.totalAmount}` : 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-500 text-xs">Confidence</p>
                <p className={`font-medium ${getConfidenceColor(parseFloat(invoice.confidenceScore || '0'))}`}>
                  {invoice.confidenceScore ? `${(parseFloat(invoice.confidenceScore) * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-500 text-xs">Line Items</p>
                <p className="font-medium">{lines?.length || 0}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-500 text-xs">Status</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Needs Review Section */}
          {needsReviewLines.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold text-orange-600 mb-2">
                ⚠️ Needs Review ({needsReviewLines.length})
              </h3>
              <LineItemsTable
                lines={needsReviewLines}
                editingLine={editingLine}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={handleEdit}
                onSave={handleSave}
                onApprove={handleApprove}
                onReject={handleReject}
                onCancel={() => setEditingLine(null)}
                getConfidenceColor={getConfidenceColor}
                isUpdating={updateLineItem.isPending}
                showApprovalButtons={true}
              />
            </div>
          )}

          {/* Reviewed Items Section */}
          {reviewedLines.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold text-green-700 mb-2">
                ✓ Approved ({reviewedLines.length})
              </h3>
              <LineItemsTable
                lines={reviewedLines}
                editingLine={editingLine}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={handleEdit}
                onSave={handleSave}
                onApprove={handleApprove}
                onReject={handleReject}
                onCancel={() => setEditingLine(null)}
                getConfidenceColor={getConfidenceColor}
                isUpdating={updateLineItem.isPending}
                showApprovalButtons={false}
              />
            </div>
          )}

          {/* No line items message */}
          {(!lines || lines.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-700">No line items extracted from this invoice.</p>
              <p className="text-sm text-yellow-600 mt-1">The OCR may not have detected any line items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Line Items Table Component
interface LineItemsTableProps {
  lines: InvoiceLine[];
  editingLine: string | null;
  editForm: Partial<InvoiceLine>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<InvoiceLine>>>;
  onEdit: (line: InvoiceLine) => void;
  onSave: (lineId: string) => void;
  onApprove: (lineId: string) => void;
  onReject: (lineId: string) => void;
  onCancel: () => void;
  getConfidenceColor: (score: number | null) => string;
  isUpdating: boolean;
  showApprovalButtons: boolean;
}

const LineItemsTable: React.FC<LineItemsTableProps> = ({
  lines,
  editingLine,
  editForm,
  setEditForm,
  onEdit,
  onSave,
  onApprove,
  onReject,
  onCancel,
  getConfidenceColor,
  isUpdating,
  showApprovalButtons,
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {lines.map((line) => (
          <tr key={line.id} className={line.needs_review ? 'bg-orange-50' : ''}>
            <td className="px-4 py-3 text-sm text-gray-500">{line.line_number}</td>
            <td className="px-4 py-3 text-sm">
              {editingLine === line.id ? (
                <input
                  type="text"
                  value={editForm.normalized_description || ''}
                  onChange={(e) => setEditForm({ ...editForm, normalized_description: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              ) : (
                <div>
                  <p className="font-medium">{line.normalized_description || line.raw_description}</p>
                  {line.normalized_description && line.raw_description !== line.normalized_description && (
                    <p className="text-xs text-gray-400">Raw: {line.raw_description}</p>
                  )}
                </div>
              )}
            </td>
            <td className="px-4 py-3 text-sm">
              {editingLine === line.id ? (
                <input
                  type="number"
                  value={editForm.quantity || ''}
                  onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || null })}
                  className="w-20 border rounded px-2 py-1 text-sm"
                />
              ) : (
                line.quantity || '-'
              )}
            </td>
            <td className="px-4 py-3 text-sm">
              {editingLine === line.id ? (
                <input
                  type="number"
                  step="0.01"
                  value={editForm.unit_price || ''}
                  onChange={(e) => setEditForm({ ...editForm, unit_price: parseFloat(e.target.value) || null })}
                  className="w-24 border rounded px-2 py-1 text-sm"
                />
              ) : (
                line.unit_price ? `$${parseFloat(String(line.unit_price)).toFixed(2)}` : '-'
              )}
            </td>
            <td className="px-4 py-3 text-sm">
              {editingLine === line.id ? (
                <input
                  type="number"
                  step="0.01"
                  value={editForm.line_total || ''}
                  onChange={(e) => setEditForm({ ...editForm, line_total: parseFloat(e.target.value) || null })}
                  className="w-24 border rounded px-2 py-1 text-sm"
                />
              ) : (
                line.line_total ? `$${parseFloat(String(line.line_total)).toFixed(2)}` : '-'
              )}
            </td>
            <td className={`px-4 py-3 text-sm ${getConfidenceColor(parseFloat(String(line.confidence_score)))}`}>
              {line.confidence_score ? `${(parseFloat(String(line.confidence_score)) * 100).toFixed(0)}%` : '-'}
            </td>
            <td className="px-4 py-3 text-sm text-right">
              {editingLine === line.id ? (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onSave(line.id)}
                    disabled={isUpdating}
                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={onCancel}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 justify-end">
                  {showApprovalButtons && (
                    <>
                      <button
                        onClick={() => onApprove(line.id)}
                        disabled={isUpdating}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 text-xs font-medium"
                        title="Approve this item"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => onReject(line.id)}
                        disabled={isUpdating}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 text-xs font-medium"
                        title="Reject this item"
                      >
                        ✗ Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onEdit(line)}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                    title="Edit this item"
                  >
                    ✎ Edit
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default InvoiceReviewPage;

