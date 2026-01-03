/**
 * Top Products Component
 * Displays top products by spending
 */

import React from 'react';
import { TopProduct } from '../types/analytics.types';

interface TopProductsProps {
  data: TopProduct[];
  loading?: boolean;
}

const TopProducts: React.FC<TopProductsProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
        <p className="text-gray-500 text-center py-8">No product data available</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(p => p.totalAmount));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2">#</th>
              <th className="pb-2">Product</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Total</th>
              <th className="pb-2 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, index) => (
              <tr key={product.productId} className="border-b last:border-0">
                <td className="py-2 text-sm text-gray-400">{index + 1}</td>
                <td className="py-2 text-sm font-medium text-gray-900">{product.productName}</td>
                <td className="py-2 text-sm text-gray-500 text-right">
                  {product.totalQuantity.toLocaleString()}
                </td>
                <td className="py-2 text-sm text-gray-900 text-right">
                  ${product.totalAmount.toLocaleString()}
                </td>
                <td className="py-2 pl-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${maxAmount > 0 ? (product.totalAmount / maxAmount) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopProducts;

