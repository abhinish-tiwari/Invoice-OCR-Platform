import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../../auth/hooks/useAuth';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🧾</span>
              <h1 className="text-xl font-bold text-gray-900">Invoice OCR Platform</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{user.fullName}</span>
                  {user.companyName && (
                    <span className="ml-2 text-gray-400">({user.companyName})</span>
                  )}
                </div>
              )}
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.fullName}! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            You have successfully logged in to the Invoice OCR Platform.
          </p>

          {/* User Info Card */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="font-medium text-gray-900">{user?.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-medium text-gray-900 capitalize">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200 hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-3">📤</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Invoices</h3>
              <p className="text-sm text-gray-600">
                Upload and process your invoices with AI-powered OCR
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-lg border border-indigo-200 hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">
                View insights and analytics from your invoice data
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-100 p-6 rounded-lg border border-purple-200 hover:shadow-lg transition-shadow duration-200">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Settings</h3>
              <p className="text-sm text-gray-600">
                Manage your account and preferences
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a placeholder dashboard. The full dashboard features are under development.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

