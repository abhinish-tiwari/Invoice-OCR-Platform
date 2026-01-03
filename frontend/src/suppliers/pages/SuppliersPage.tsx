import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuppliers, useDeleteSupplier } from '../hooks/useSuppliers';
import { SupplierTable } from '../components/SupplierTable';
import { SupplierModal } from '../components/SupplierModal';
import { useAuth } from '../../auth/hooks/useAuth';
import Button from '../../common/components/Button';
import type { Supplier, SupplierListParams } from '../types/supplier.types';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [params, setParams] = useState<SupplierListParams>({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC',
  });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data, isLoading, error } = useSuppliers({
    ...params,
    search: search || undefined,
  });
  const deleteSupplier = useDeleteSupplier();

  const suppliers = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;

  const handleSearch = (value: string) => {
    setSearch(value);
    setParams((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      try {
        await deleteSupplier.mutateAsync(supplier.id);
      } catch (error) {
        console.error('Failed to delete supplier:', error);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
                <span className="text-2xl mr-2">🧾</span>
                <h1 className="text-xl font-bold text-gray-900">Invoice OCR</h1>
              </div>
              <div className="hidden sm:flex space-x-4">
                <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</button>
                <button onClick={() => navigate('/invoices')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Invoices</button>
                <button onClick={() => navigate('/products')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Products</button>
                <button onClick={() => navigate('/suppliers')} className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">Suppliers</button>
                <button onClick={() => navigate('/analytics')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Analytics</button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && <span className="text-sm text-gray-600">{user.fullName}</span>}
              <Button variant="secondary" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your supplier directory
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Supplier
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">Failed to load suppliers. Please try again.</p>
          </div>
        )}

        {/* Supplier Table */}
        <SupplierTable
          suppliers={suppliers}
          isLoading={isLoading}
          currentPage={params.page || 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Supplier Modal */}
        <SupplierModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          supplier={editingSupplier}
        />
      </main>
    </div>
  );
}

