import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading fallback component for Suspense
 * Used when lazy loading components
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading...',
  fullScreen = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-2',
    lg: 'h-16 w-16 border-4',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-purple-600 border-t-transparent`}
          role="status"
          aria-label="Loading"
        />
        {message && (
          <p className="text-sm text-gray-600 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Minimal loading spinner without text
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-purple-600 border-t-transparent`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingFallback;

