/**
 * Status Distribution Component
 * Displays invoice status distribution as a pie chart-like visual
 */

import React from 'react';
import { InvoiceStatusSummary } from '../types/analytics.types';

interface StatusDistributionProps {
  data: InvoiceStatusSummary[];
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  PROCESSING: 'bg-blue-500',
  PARSED: 'bg-green-500',
  NEEDS_REVIEW: 'bg-orange-500',
  REVIEWED: 'bg-purple-500',
  FAILED: 'bg-red-500',
};

const StatusDistribution: React.FC<StatusDistributionProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
        <p className="text-gray-500 text-center py-8">No status data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h3>
      
      {/* Stacked bar */}
      <div className="flex h-8 rounded-full overflow-hidden mb-4">
        {data.map((status) => {
          const percentage = total > 0 ? (status.count / total) * 100 : 0;
          const color = STATUS_COLORS[status.status] || 'bg-gray-500';
          return (
            <div
              key={status.status}
              className={`${color} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
              title={`${status.status}: ${status.count}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((status) => {
          const color = STATUS_COLORS[status.status] || 'bg-gray-500';
          const percentage = total > 0 ? ((status.count / total) * 100).toFixed(1) : 0;
          return (
            <div key={status.status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-xs text-gray-600">
                {status.status.replace('_', ' ')} ({status.count})
              </span>
              <span className="text-xs text-gray-400">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusDistribution;

