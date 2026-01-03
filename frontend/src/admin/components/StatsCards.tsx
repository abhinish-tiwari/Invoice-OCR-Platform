import type { SystemStats } from '../types/admin.types';

interface StatsCardsProps {
  stats: SystemStats | undefined;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'blue' },
    { label: 'Total Invoices', value: stats?.totalInvoices || 0, icon: '🧾', color: 'green' },
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: '📦', color: 'purple' },
    { label: 'Total Suppliers', value: stats?.totalSuppliers || 0, icon: '🏢', color: 'orange' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
            </div>
            <span className="text-3xl">{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

