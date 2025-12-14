# Frontend Architecture (React + TypeScript)

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite (fast dev server, optimized builds)
- **Styling:** Tailwind CSS (utility-first, rapid development)
- **Routing:** React Router v6
- **State Management:** 
  - React Context for auth
  - TanStack Query (React Query) for server state
  - Local state with hooks
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts or Chart.js
- **HTTP Client:** Axios
- **Date Handling:** date-fns

---

## Project Structure

```
src/
├── api/                    # API client and endpoints
│   ├── client.ts          # Axios instance with interceptors
│   ├── auth.api.ts        # Auth endpoints
│   ├── invoices.api.ts    # Invoice endpoints
│   ├── analytics.api.ts   # Analytics endpoints
│   └── types.ts           # API response types
├── components/            # Reusable components
│   ├── common/           # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── layout/           # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   ├── invoices/         # Invoice-specific components
│   │   ├── InvoiceCard.tsx
│   │   ├── InvoiceTable.tsx
│   │   ├── InvoiceUpload.tsx
│   │   └── InvoiceStatusBadge.tsx
│   ├── analytics/        # Analytics components
│   │   ├── SpendChart.tsx
│   │   ├── KPICard.tsx
│   │   └── OpportunityList.tsx
│   └── admin/            # Admin components
│       ├── ReviewPanel.tsx
│       ├── LineItemEditor.tsx
│       └── ProductMatcher.tsx
├── pages/                # Page components (routes)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── InvoicesPage.tsx
│   ├── InvoiceDetailPage.tsx
│   └── admin/
│       ├── AdminDashboardPage.tsx
│       └── ReviewInvoicePage.tsx
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   ├── useInvoices.ts
│   ├── useAnalytics.ts
│   └── useDebounce.ts
├── contexts/             # React contexts
│   └── AuthContext.tsx
├── utils/                # Utility functions
│   ├── formatters.ts     # Date, currency formatters
│   ├── validators.ts     # Form validation schemas
│   └── constants.ts      # App constants
├── types/                # TypeScript types
│   └── index.ts
├── App.tsx               # Root component
├── main.tsx              # Entry point
└── routes.tsx            # Route configuration
```

---

## Key Components

### 1. API Client Setup

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Auth Context

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      authApi.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { user, token } = await authApi.login(email, password);
    localStorage.setItem('auth_token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    const { user, token } = await authApi.register(data);
    localStorage.setItem('auth_token', token);
    setUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 3. Protected Route Component

```typescript
// src/components/common/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

### 4. Invoice Upload Component

```typescript
// src/components/invoices/InvoiceUpload.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../../api/invoices.api';

export const InvoiceUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: invoicesApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setFile(null);
      alert('Invoice uploaded successfully!');
    },
    onError: (error: any) => {
      alert(`Upload failed: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setFile(file);
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12 mb-4" /* ... icon ... */ />
            <p className="text-lg font-medium">
              Drag and drop your invoice here
            </p>
            <p className="text-sm mt-2">or click to browse</p>
            <p className="text-xs text-gray-500 mt-2">
              PDF, JPG, PNG (max 10MB)
            </p>
          </div>
        </label>
      </div>

      {file && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Invoice'}
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Page Components

### Dashboard Page

```typescript
// src/pages/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import { KPICard } from '../components/analytics/KPICard';
import { SpendChart } from '../components/analytics/SpendChart';
import { OpportunityList } from '../components/analytics/OpportunityList';

export const DashboardPage: React.FC = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary({
      fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      toDate: new Date(),
    }),
  });

  const { data: spendData } = useQuery({
    queryKey: ['analytics', 'spend-over-time'],
    queryFn: () => analyticsApi.getSpendOverTime({
      fromDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
      toDate: new Date(),
      interval: 'month',
    }),
  });

  const { data: opportunities } = useQuery({
    queryKey: ['analytics', 'opportunities'],
    queryFn: () => analyticsApi.getOpportunities({ limit: 5 }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Spend"
          value={`$${summary?.totalSpend.toFixed(2)}`}
          subtitle="Last 30 days"
        />
        <KPICard
          title="Invoices"
          value={summary?.invoiceCount.toString() || '0'}
          subtitle="Processed"
        />
        <KPICard
          title="Suppliers"
          value={summary?.supplierCount.toString() || '0'}
          subtitle="Active"
        />
        <KPICard
          title="Avg Invoice"
          value={`$${summary?.averageInvoiceAmount.toFixed(2)}`}
          subtitle="Per invoice"
        />
      </div>

      {/* Spend Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Spend Over Time</h2>
        <SpendChart data={spendData?.data || []} />
      </div>

      {/* Opportunities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Cost-Saving Opportunities</h2>
        <OpportunityList opportunities={opportunities?.data || []} />
      </div>
    </div>
  );
};
```

### Invoices List Page

```typescript
// src/pages/InvoicesPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices.api';
import { InvoiceTable } from '../components/invoices/InvoiceTable';
import { InvoiceUpload } from '../components/invoices/InvoiceUpload';

export const InvoicesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, filters],
    queryFn: () => invoicesApi.list({ page, limit: 20, ...filters }),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <button
          onClick={() => {/* Open upload modal */}}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Upload Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PARSED">Parsed</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="REVIEWED">Reviewed</option>
          </select>
          {/* Date filters */}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow">
        <InvoiceTable
          invoices={data?.data || []}
          isLoading={isLoading}
          pagination={data?.pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
```

### Admin Review Page

```typescript
// src/pages/admin/ReviewInvoicePage.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, adminApi } from '../../api';
import { LineItemEditor } from '../../components/admin/LineItemEditor';

export const ReviewInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [lineItems, setLineItems] = useState<any[]>([]);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['admin', 'invoices', id],
    queryFn: () => adminApi.getInvoice(id!),
    onSuccess: (data) => {
      setLineItems(data.lineItems);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => adminApi.submitCorrections(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
      alert('Corrections saved successfully!');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      supplierId: invoice?.supplier?.id,
      invoiceDate: invoice?.invoiceDate,
      invoiceNumber: invoice?.invoiceNumber,
      lineItems,
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Review Invoice</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Invoice Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Original Invoice</h2>
          <img
            src={invoice?.fileUrl}
            alt="Invoice"
            className="w-full border rounded"
          />
        </div>

        {/* Right: Line Item Editor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Line Items</h2>
          <LineItemEditor
            lineItems={lineItems}
            onChange={setLineItems}
          />
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Corrections'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Routing Configuration

```typescript
// src/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ReviewInvoicePage } from './pages/admin/ReviewInvoicePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'invoices',
        element: <InvoicesPage />,
      },
      {
        path: 'invoices/:id',
        element: <InvoiceDetailPage />,
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/invoices/:id',
        element: (
          <ProtectedRoute requireAdmin>
            <ReviewInvoicePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
```

---

## Responsive Design Considerations

### Mobile-First Approach

```css
/* Tailwind breakpoints:
   sm: 640px
   md: 768px
   lg: 1024px
   xl: 1280px
   2xl: 1536px
*/

/* Example: Responsive grid */
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>

/* Example: Responsive padding */
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>

/* Example: Hide on mobile */
<div className="hidden md:block">
  {/* Desktop only */}
</div>

/* Example: Mobile menu */
<div className="md:hidden">
  {/* Mobile only */}
</div>
```

### Touch-Friendly UI
- Minimum touch target: 44x44px
- Adequate spacing between interactive elements
- Swipe gestures for mobile navigation
- Bottom navigation bar for mobile

---

## Performance Optimizations

1. **Code Splitting:** Use React.lazy() for route-based splitting
2. **Image Optimization:** Lazy load images, use thumbnails
3. **Query Caching:** TanStack Query handles caching automatically
4. **Debouncing:** Debounce search inputs
5. **Virtual Scrolling:** For large tables (react-window)
6. **Memoization:** Use React.memo, useMemo, useCallback appropriately

```typescript
// Example: Lazy loading routes
const AdminDashboardPage = React.lazy(() => import('./pages/admin/AdminDashboardPage'));

// Example: Debounced search
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useQuery({
  queryKey: ['products', debouncedSearch],
  queryFn: () => productsApi.search(debouncedSearch),
  enabled: debouncedSearch.length > 2,
});
```


