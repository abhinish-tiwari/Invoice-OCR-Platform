import React, { useCallback, useState } from 'react';

interface InvoiceUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  accept?: string;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Drag and drop file upload zone component
 */
const InvoiceUploadZone: React.FC<InvoiceUploadZoneProps> = ({
  onFileSelect,
  isUploading = false,
  uploadProgress = 0,
  error = null,
  maxSizeMB = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PDF, JPG, or PNG files only.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const displayError = validationError || error;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : displayError
          ? 'border-red-300 bg-red-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      {isUploading ? (
        <div className="space-y-4">
          <div className="text-4xl">⏳</div>
          <p className="text-gray-600">Uploading...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{uploadProgress}%</p>
        </div>
      ) : (
        <>
          <div className="text-4xl mb-4">📤</div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag & drop your invoice here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse files
          </p>
          <input
            type="file"
            onChange={handleInputChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-400">
            Supported formats: PDF, JPG, PNG (max {maxSizeMB}MB)
          </p>
        </>
      )}

      {displayError && !isUploading && (
        <p className="mt-4 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
};

export default InvoiceUploadZone;

