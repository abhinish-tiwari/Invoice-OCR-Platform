import React from 'react';
import { InvoiceStats, STATUS_CONFIG, InvoiceStatus } from '../types/invoice.types';

interface InvoiceStatsCardProps {
  stats: InvoiceStats | undefined;
  isLoading?: boolean;
}

/**
 * Card component showing invoice status counts
 */
const InvoiceStatsCard: React.FC<InvoiceStatsCardProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statusItems: InvoiceStatus[] = [
    'PENDING',
    'PROCESSING',
    'PARSED',
    'NEEDS_REVIEW',
    'REVIEWED',
    'FAILED',
  ];

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Invoice Status</h3>
        <span className="text-sm text-gray-500">Total: {total}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statusItems.map((status) => {
          const config = STATUS_CONFIG[status];
          const count = stats[status];
          return (
            <div
              key={status}
              className={`p-3 rounded-lg ${config.bgColor} flex flex-col`}
            >
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              <span className={`text-2xl font-bold ${config.color}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InvoiceStatsCard;

