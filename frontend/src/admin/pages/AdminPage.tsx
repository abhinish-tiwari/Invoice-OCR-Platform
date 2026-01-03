import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemStats, useUsers, useUpdateUserRole, useDeleteUser } from '../hooks/useAdmin';
import { StatsCards } from '../components/StatsCards';
import { UserTable } from '../components/UserTable';
import { useAuth } from '../../auth/hooks/useAuth';
import Button from '../../common/components/Button';
import type { AdminUser, UserListParams } from '../types/admin.types';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [params, setParams] = useState<UserListParams>({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: statsData, isLoading: statsLoading } = useSystemStats();
  const { data: usersData, isLoading: usersLoading, error } = useUsers({
    ...params,
    search: search || undefined,
    role: roleFilter || undefined,
  });
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const stats = statsData?.data;
  const users = usersData?.data?.users || [];
  const totalPages = usersData?.data?.totalPages || 1;

  const handleSearch = (value: string) => {
    setSearch(value);
    setParams((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setParams((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleRoleChange = async (targetUser: AdminUser, newRole: string) => {
    if (window.confirm(`Change ${targetUser.email}'s role to ${newRole}?`)) {
      try {
        await updateRole.mutateAsync({ id: targetUser.id, role: newRole });
      } catch (error) {
        console.error('Failed to update role:', error);
      }
    }
  };

  const handleDelete = async (targetUser: AdminUser) => {
    if (window.confirm(`Are you sure you want to delete ${targetUser.email}? This cannot be undone.`)) {
      try {
        await deleteUser.mutateAsync(targetUser.id);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

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
                <button onClick={() => navigate('/suppliers')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Suppliers</button>
                <button onClick={() => navigate('/analytics')} className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Analytics</button>
                <button onClick={() => navigate('/admin')} className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium">Admin</button>
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Manage users and view system statistics</p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* User Management Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="w-full sm:w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">Failed to load users. Please try again.</p>
            </div>
          )}

          {/* User Table */}
          <UserTable
            users={users}
            isLoading={usersLoading}
            currentPage={params.page || 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRoleChange={handleRoleChange}
            onDelete={handleDelete}
            currentUserId={user?.id || ''}
          />
        </div>
      </main>
    </div>
  );
}

