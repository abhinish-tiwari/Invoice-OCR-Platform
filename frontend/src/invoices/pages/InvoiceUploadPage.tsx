import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadInvoice } from '../hooks/useInvoices';
import { InvoiceUploadZone } from '../components';
import Button from '../../common/components/Button';

/**
 * Invoice upload page with drag-and-drop support
 */
const InvoiceUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [processOcr, setProcessOcr] = useState(true); // Default to auto-process

  const uploadMutation = useUploadInvoice();

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);

    try {
      await uploadMutation.mutateAsync({
        file,
        processOcr,
        onProgress: setUploadProgress,
      });
      setUploadSuccess(true);
      setUploadProgress(100);

      // Redirect to invoices list after short delay
      setTimeout(() => {
        navigate('/invoices');
      }, 1500);
    } catch (error: any) {
      setUploadError(error?.message || 'Failed to upload invoice. Please try again.');
      setUploadProgress(0);
    }
  }, [uploadMutation, navigate, processOcr]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/invoices')}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <span className="text-2xl mr-2">📤</span>
              <h1 className="text-xl font-bold text-gray-900">Upload Invoice</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Upload a new invoice
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload your invoice file and our OCR system will automatically extract the data.
          </p>

          <InvoiceUploadZone
            onFileSelect={handleFileSelect}
            isUploading={uploadMutation.isPending}
            uploadProgress={uploadProgress}
            error={uploadError}
          />

          {/* OCR Processing Option */}
          <div className="mt-4 flex items-center">
            <input
              id="processOcr"
              type="checkbox"
              checked={processOcr}
              onChange={(e) => setProcessOcr(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="processOcr" className="ml-2 block text-sm text-gray-700">
              Automatically extract data with OCR after upload
            </label>
          </div>

          {uploadSuccess && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <p className="font-medium text-green-800">Upload successful!</p>
                  <p className="text-sm text-green-600">
                    Redirecting to invoices list...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              What happens next?
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2">
                  1
                </span>
                Your invoice is uploaded and queued for processing
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2">
                  2
                </span>
                Our OCR system extracts text and data from the invoice
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2">
                  3
                </span>
                The extracted data is available for review
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            View All Invoices
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceUploadPage;

