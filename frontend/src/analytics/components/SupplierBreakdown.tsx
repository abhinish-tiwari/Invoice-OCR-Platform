/**
 * Supplier Breakdown Component
 * Displays spending by supplier in a list format
 */

import React from 'react';
import { SpendingBySupplier } from '../types/analytics.types';

interface SupplierBreakdownProps {
  data: SpendingBySupplier[];
  loading?: boolean;
}

const SupplierBreakdown: React.FC<SupplierBreakdownProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h3>
        <p className="text-gray-500 text-center py-8">No supplier data available</p>
      </div>
    );
  }

  const totalSpending = data.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h3>
      <div className="space-y-3">
        {data.map((supplier, index) => {
          const percentage = totalSpending > 0 ? (supplier.totalAmount / totalSpending) * 100 : 0;
          return (
            <div key={supplier.supplierId} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">{supplier.supplierName}</span>
                  <span className="text-sm text-gray-500">
                    ${supplier.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 w-12">{supplier.invoiceCount} inv</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SupplierBreakdown;

