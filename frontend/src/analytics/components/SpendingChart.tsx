/**
 * Spending Chart Component
 * Displays spending trends over time using a simple bar chart
 */

import React from 'react';
import { SpendingByMonth } from '../types/analytics.types';

interface SpendingChartProps {
  data: SpendingByMonth[];
  loading?: boolean;
}

const SpendingChart: React.FC<SpendingChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends</h3>
        <p className="text-gray-500 text-center py-8">No spending data available</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(d => d.totalAmount));
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends</h3>
      <div className="space-y-3">
        {sortedData.map((item) => (
          <div key={item.month} className="flex items-center gap-3">
            <span className="text-sm text-gray-500 w-20">{item.month}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
              <div
                className="bg-blue-500 h-6 rounded-full transition-all duration-300"
                style={{ width: `${maxAmount > 0 ? (item.totalAmount / maxAmount) * 100 : 0}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                ${item.totalAmount.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-gray-400 w-16">{item.invoiceCount} inv</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingChart;

