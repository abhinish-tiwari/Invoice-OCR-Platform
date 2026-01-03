/**
 * Summary Cards Component
 * Displays key metrics in card format
 */

import React from 'react';
import { DashboardSummary } from '../types/analytics.types';

interface SummaryCardsProps {
  summary: DashboardSummary;
  loading?: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  const cards = [
    {
      title: 'Total Invoices',
      value: summary.totalInvoices,
      icon: '📄',
      color: 'bg-blue-500',
    },
    {
      title: 'Total Spending',
      value: `$${summary.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'bg-green-500',
    },
    {
      title: 'Pending',
      value: summary.pendingInvoices,
      icon: '⏳',
      color: 'bg-yellow-500',
    },
    {
      title: 'Processed',
      value: summary.processedInvoices,
      icon: '✅',
      color: 'bg-purple-500',
    },
    {
      title: 'Avg Confidence',
      value: `${(summary.averageConfidence * 100).toFixed(1)}%`,
      icon: '📊',
      color: 'bg-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-full text-white text-xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;

