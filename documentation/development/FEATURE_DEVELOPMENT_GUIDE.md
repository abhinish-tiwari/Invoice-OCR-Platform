# 🚀 Feature Development Guide - Invoice OCR Platform

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Understanding](#architecture-understanding)
3. [Development Workflow](#development-workflow)
4. [Feature Development Process](#feature-development-process)
5. [Code Standards & Conventions](#code-standards--conventions)
6. [Testing Guidelines](#testing-guidelines)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

### What is This Platform?
The **Invoice OCR Platform** is a hospitality cost-saving application that:
- 📸 **Captures** supplier invoices (PDF/images)
- 🤖 **Extracts** data using AWS Textract OCR
- 📊 **Analyzes** spending patterns and price trends
- 💰 **Identifies** cost-saving opportunities
- ✅ **Enables** admin review and correction of OCR results

### Tech Stack Summary
```
Frontend:  React 18 + TypeScript + Vite + Tailwind CSS
Backend:   Node.js 18 + Express + TypeScript
Database:  PostgreSQL 15
OCR:       AWS Textract
Storage:   AWS S3
```

### Key Features
1. **Authentication** - JWT-based user authentication
2. **Invoice Upload** - Drag-and-drop file upload to S3
3. **OCR Processing** - Automatic data extraction via Textract
4. **Product Matching** - Fuzzy matching with alias learning
5. **Analytics Dashboard** - Spend tracking and insights
6. **Admin Review** - Manual correction and validation
7. **Price Tracking** - Historical price monitoring

---

## 🏗 Architecture Understanding

### System Architecture (High-Level)
```
┌─────────────┐
│   React     │  ← User Interface (Port 5173)
│  Frontend   │
└──────┬──────┘
       │ HTTP/REST API
┌──────▼──────┐
│   Express   │  ← Backend API (Port 3000)
│   Backend   │
└──┬───┬───┬──┘
   │   │   │
   ▼   ▼   ▼
┌────┐ ┌──┐ ┌────────┐
│ DB │ │S3│ │Textract│
└────┘ └──┘ └────────┘
```

### Backend Architecture (Layered)
```
Routes (HTTP endpoints)
   ↓
Controllers (Request/Response handling)
   ↓
Services (Business logic)
   ↓
Repositories (Database access)
   ↓
Database (PostgreSQL)
```

### Frontend Architecture
```
Pages (Route components)
   ↓
Components (Reusable UI)
   ↓
Hooks (Data fetching & state)
   ↓
API Client (Axios)
   ↓
Backend API
```

### Database Schema (9 Tables)
1. **users** - User accounts and authentication
2. **suppliers** - Supplier directory
3. **products** - Product catalog
4. **invoices** - Invoice metadata
5. **invoice_lines** - Line items from invoices
6. **price_history** - Historical pricing data
7. **product_aliases** - Learned product name mappings
8. **ocr_results** - Raw OCR output storage
9. **processing_logs** - Audit trail

### Data Flow: Invoice Upload
```
1. User uploads file (Frontend)
   ↓
2. File sent to backend API
   ↓
3. File uploaded to S3
   ↓
4. Invoice record created (status: PENDING)
   ↓
5. Textract processes file
   ↓
6. OCR results parsed
   ↓
7. Products matched
   ↓
8. Data stored in database (status: PARSED/NEEDS_REVIEW)
   ↓
9. Admin reviews if needed
   ↓
10. Analytics updated
```

---

## 💻 Development Workflow

### Initial Setup
```bash
# 1. Database setup
createdb invoice_ocr
psql invoice_ocr < database/schema.sql

# 2. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

### Daily Development
```bash
# Terminal 1: Backend
cd backend
npm run dev  # Runs on http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm run dev  # Runs on http://localhost:5173

# Terminal 3: Database (if needed)
psql invoice_ocr
```

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_ocr
JWT_SECRET=your_super_secret_key_change_this
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=your-bucket-name
PORT=3000
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 🔨 Feature Development Process

### Step-by-Step: Adding a New Feature

#### 1. **Plan the Feature**
- [ ] Define the feature requirements
- [ ] Identify affected components (frontend/backend/database)
- [ ] Check if database schema changes are needed
- [ ] Review existing similar features for patterns

#### 2. **Database Changes (if needed)**
```sql
-- Example: Adding a new table
CREATE TABLE feature_name (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    -- Add your columns
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feature_name_user_id ON feature_name(user_id);
```

#### 3. **Backend Implementation**

**A. Create TypeScript Types/Interfaces**
```typescript
// backend/src/types/feature-name.interface.ts
export interface FeatureName {
  id: string;
  userId: string;
  // Add your properties
  createdAt: Date;
}

export interface CreateFeatureDTO {
  userId: string;
  // Add required fields
}
```

**B. Create Repository (Database Layer)**
```typescript
// backend/src/repositories/feature-name.repository.ts
import { pool } from '../utils/database';
import { FeatureName, CreateFeatureDTO } from '../types/feature-name.interface';

export class FeatureNameRepository {
  async create(data: CreateFeatureDTO): Promise<FeatureName> {
    const result = await pool.query(
      `INSERT INTO feature_name (user_id, ...)
       VALUES ($1, ...)
       RETURNING *`,
      [data.userId, ...]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<FeatureName | null> {
    const result = await pool.query(
      'SELECT * FROM feature_name WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByUserId(userId: string): Promise<FeatureName[]> {
    const result = await pool.query(
      'SELECT * FROM feature_name WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }
}
```

**C. Create Service (Business Logic Layer)**
```typescript
// backend/src/services/feature-name.service.ts
import { FeatureNameRepository } from '../repositories/feature-name.repository';
import { CreateFeatureDTO } from '../types/feature-name.interface';

export class FeatureNameService {
  private repository: FeatureNameRepository;

  constructor() {
    this.repository = new FeatureNameRepository();
  }

  async createFeature(data: CreateFeatureDTO) {
    // Add validation
    if (!data.userId) {
      throw new Error('User ID is required');
    }

    // Business logic here
    const feature = await this.repository.create(data);

    // Additional processing if needed

    return feature;
  }

  async getUserFeatures(userId: string) {
    return await this.repository.findByUserId(userId);
  }
}
```

**D. Create Controller (HTTP Handler)**
```typescript
// backend/src/controllers/feature-name.controller.ts
import { Request, Response, NextFunction } from 'express';
import { FeatureNameService } from '../services/feature-name.service';

export class FeatureNameController {
  private service: FeatureNameService;

  constructor() {
    this.service = new FeatureNameService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id; // From auth middleware
      const data = req.body;

      const feature = await this.service.createFeature({
        userId,
        ...data
      });

      res.status(201).json(feature);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const features = await this.service.getUserFeatures(userId);
      res.json(features);
    } catch (error) {
      next(error);
    }
  };
}
```

**E. Create Routes**
```typescript
// backend/src/routes/feature-name.routes.ts
import { Router } from 'express';
import { FeatureNameController } from '../controllers/feature-name.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new FeatureNameController();

// All routes require authentication
router.use(authMiddleware);

router.post('/', controller.create);
router.get('/', controller.list);

export default router;
```

**F. Register Routes in Main App**
```typescript
// backend/src/index.ts
import featureNameRoutes from './routes/feature-name.routes';

app.use('/api/v1/feature-name', featureNameRoutes);
```

#### 4. **Frontend Implementation**

**A. Create TypeScript Types**
```typescript
// frontend/src/types/feature-name.types.ts
export interface FeatureName {
  id: string;
  userId: string;
  // Add your properties
  createdAt: string;
}

export interface CreateFeatureRequest {
  // Add required fields
}
```

**B. Create API Client Functions**
```typescript
// frontend/src/api/feature-name.api.ts
import { apiClient } from './client';
import { FeatureName, CreateFeatureRequest } from '../types/feature-name.types';

export const featureNameApi = {
  create: async (data: CreateFeatureRequest): Promise<FeatureName> => {
    const response = await apiClient.post('/feature-name', data);
    return response.data;
  },

  list: async (): Promise<FeatureName[]> => {
    const response = await apiClient.get('/feature-name');
    return response.data;
  },

  getById: async (id: string): Promise<FeatureName> => {
    const response = await apiClient.get(`/feature-name/${id}`);
    return response.data;
  }
};
```

**C. Create Custom Hook (Optional but Recommended)**
```typescript
// frontend/src/hooks/use-feature-name.hook.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureNameApi } from '../api/feature-name.api';
import { CreateFeatureRequest } from '../types/feature-name.types';
import toast from 'react-hot-toast';

export const useFeatureName = () => {
  const queryClient = useQueryClient();

  // Fetch list
  const { data: features, isLoading } = useQuery({
    queryKey: ['features'],
    queryFn: featureNameApi.list
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateFeatureRequest) => featureNameApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create feature');
    }
  });

  return {
    features,
    isLoading,
    createFeature: createMutation.mutate,
    isCreating: createMutation.isPending
  };
};
```

**D. Create Component**
```typescript
// frontend/src/components/feature-name/feature-name-list.component.tsx
import React from 'react';
import { useFeatureName } from '../../hooks/use-feature-name.hook';

export const FeatureNameList: React.FC = () => {
  const { features, isLoading } = useFeatureName();

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Features</h2>

      {features?.length === 0 ? (
        <p className="text-gray-500">No features found</p>
      ) : (
        <div className="grid gap-4">
          {features?.map((feature) => (
            <div key={feature.id} className="border rounded-lg p-4">
              {/* Render feature details */}
              <p>{feature.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**E. Create Page Component**
```typescript
// frontend/src/pages/feature-name.page.tsx
import React from 'react';
import { FeatureNameList } from '../components/feature-name/feature-name-list.component';

export const FeatureNamePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <FeatureNameList />
    </div>
  );
};
```

**F. Add Route**
```typescript
// frontend/src/App.tsx
import { FeatureNamePage } from './pages/feature-name.page';

// Inside your Routes component
<Route path="/feature-name" element={<FeatureNamePage />} />
```

#### 5. **Testing**

**Backend Tests**
```typescript
// backend/src/tests/feature-name.test.ts
import { FeatureNameService } from '../services/feature-name.service';

describe('FeatureNameService', () => {
  let service: FeatureNameService;

  beforeEach(() => {
    service = new FeatureNameService();
  });

  it('should create a feature', async () => {
    const data = { userId: 'test-user-id' };
    const result = await service.createFeature(data);
    expect(result).toHaveProperty('id');
  });
});
```

**Frontend Tests**
```typescript
// frontend/src/components/feature-name/__tests__/feature-name-list.test.tsx
import { render, screen } from '@testing-library/react';
import { FeatureNameList } from '../feature-name-list.component';

describe('FeatureNameList', () => {
  it('renders loading state', () => {
    render(<FeatureNameList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

---

## 📋 Code Standards & Conventions

### File Naming Conventions

**Backend Files:**
```
✅ CORRECT:
- feature-name.interface.ts
- feature-name.service.ts
- feature-name.repository.ts
- feature-name.controller.ts
- feature-name.routes.ts

❌ INCORRECT:
- featureName.ts
- feature_name.ts
- FeatureName.ts
```

**Frontend Files:**
```
✅ CORRECT:
- feature-name.component.tsx
- feature-name.page.tsx
- feature-name.hook.ts
- feature-name.api.ts
- feature-name.types.ts

❌ INCORRECT:
- FeatureName.tsx
- feature_name.tsx
- featureName.tsx
```

### Code Style

**TypeScript Interfaces vs Types**
```typescript
// Use interfaces for objects
export interface User {
  id: string;
  email: string;
}

// Use types for unions, primitives, or complex types
export type UserRole = 'user' | 'admin';
export type Status = 'PENDING' | 'PROCESSING' | 'PARSED';
```

**Async/Await (Preferred over Promises)**
```typescript
// ✅ GOOD
async function fetchData() {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    handleError(error);
  }
}

// ❌ AVOID
function fetchData() {
  return apiCall()
    .then(result => result)
    .catch(error => handleError(error));
}
```

**Error Handling**
```typescript
// Backend
try {
  const result = await service.doSomething();
  res.json(result);
} catch (error) {
  next(error); // Pass to error middleware
}

// Frontend
try {
  const result = await api.doSomething();
  toast.success('Success!');
} catch (error: any) {
  toast.error(error.response?.data?.message || 'An error occurred');
}
```

**Database Queries (Use Parameterized Queries)**
```typescript
// ✅ GOOD - Prevents SQL injection
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ NEVER DO THIS - SQL injection risk
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### Component Structure (React)

```typescript
import React from 'react';
import { useHook } from '../../hooks/use-hook';

// 1. Props interface
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

// 2. Component definition
export const ComponentName: React.FC<ComponentProps> = ({ title, onAction }) => {
  // 3. Hooks
  const { data, isLoading } = useHook();

  // 4. Event handlers
  const handleClick = () => {
    onAction?.();
  };

  // 5. Early returns
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // 6. Main render
  return (
    <div className="container">
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
};
```

### API Response Format

**Success Response:**
```typescript
// Single item
{
  "id": "uuid",
  "name": "Item name",
  "createdAt": "2025-01-15T10:30:00Z"
}

// List
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Error Response:**
```typescript
{
  "error": "Error message",
  "details": "Additional details (optional)",
  "code": "ERROR_CODE"
}
```

---

## 🧪 Testing Guidelines

### Backend Testing

**Unit Tests (Services)**
```typescript
// backend/src/tests/services/feature-name.service.test.ts
import { FeatureNameService } from '../../services/feature-name.service';

describe('FeatureNameService', () => {
  let service: FeatureNameService;

  beforeEach(() => {
    service = new FeatureNameService();
  });

  describe('createFeature', () => {
    it('should create a feature successfully', async () => {
      const data = { userId: 'test-id', name: 'Test' };
      const result = await service.createFeature(data);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test');
    });

    it('should throw error if userId is missing', async () => {
      await expect(
        service.createFeature({ userId: '', name: 'Test' })
      ).rejects.toThrow('User ID is required');
    });
  });
});
```

**Integration Tests (API Endpoints)**
```typescript
// backend/src/tests/integration/feature-name.test.ts
import request from 'supertest';
import app from '../../index';

describe('Feature Name API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = response.body.token;
  });

  describe('POST /api/v1/feature-name', () => {
    it('should create a feature', async () => {
      const response = await request(app)
        .post('/api/v1/feature-name')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Feature' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/feature-name')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });
  });
});
```

### Frontend Testing

**Component Tests**
```typescript
// frontend/src/components/__tests__/feature-name.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FeatureNameComponent } from '../feature-name.component';

describe('FeatureNameComponent', () => {
  it('renders correctly', () => {
    render(<FeatureNameComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<FeatureNameComponent title="Test" onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Running Tests

```bash
# Backend
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Frontend
cd frontend
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

---

## 🎨 Common Patterns

### 1. Authentication Pattern

**Backend Middleware:**
```typescript
// backend/src/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Frontend API Client:**
```typescript
// frontend/src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. Data Fetching Pattern (React Query)

```typescript
// frontend/src/hooks/use-data.hook.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import toast from 'react-hot-toast';

export const useData = () => {
  const queryClient = useQueryClient();

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: api.fetchData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: api.createData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] });
      toast.success('Created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  return {
    data,
    isLoading,
    error,
    create: createMutation.mutate,
    isCreating: createMutation.isPending
  };
};
```

### 3. Form Handling Pattern (React Hook Form + Zod)

```typescript
// frontend/src/components/form.component.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+')
});

type FormData = z.infer<typeof schema>;

export const FormComponent: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit">Submit</button>
    </form>
  );
};
```

### 4. Error Handling Pattern

**Backend:**
```typescript
// backend/src/middleware/error-handler.middleware.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
};
```

**Frontend:**
```typescript
// frontend/src/components/error-boundary.component.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Check connection
psql -U postgres -c "SELECT 1"
```

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port in .env
PORT=3001
```

#### 3. AWS Credentials Error
```
Error: Missing credentials in config
```

**Solution:**
```bash
# Check .env file has AWS credentials
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# Verify credentials work
aws sts get-caller-identity
```

#### 4. CORS Error (Frontend)
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
```typescript
// backend/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
```

#### 5. TypeScript Errors
```
Cannot find module or its corresponding type declarations
```

**Solution:**
```bash
# Install type definitions
npm install --save-dev @types/package-name

# Or add to tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

#### 6. React Query Not Updating
```
Data not refreshing after mutation
```

**Solution:**
```typescript
// Make sure to invalidate queries after mutation
const mutation = useMutation({
  mutationFn: api.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['data'] });
  }
});
```

### Debugging Tips

**Backend Debugging:**
```typescript
// Add console logs
console.log('Debug:', { variable });

// Use debugger
debugger;

// Check logs
tail -f backend/logs/combined.log
```

**Frontend Debugging:**
```typescript
// React DevTools
// Install: https://react.dev/learn/react-developer-tools

// Console logs
console.log('Component rendered:', props);

// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

**Database Debugging:**
```bash
# Connect to database
psql invoice_ocr

# Check tables
\dt

# View table structure
\d table_name

# Run query
SELECT * FROM users LIMIT 5;

# Check indexes
\di
```

---

## 📚 Quick Reference

### Useful Commands

**Backend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
npm test             # Run tests
npm run lint         # Lint code
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Lint code
```

**Database:**
```bash
# Create database
createdb invoice_ocr

# Run schema
psql invoice_ocr < database/schema.sql

# Connect to database
psql invoice_ocr

# Backup database
pg_dump invoice_ocr > backup.sql

# Restore database
psql invoice_ocr < backup.sql
```

### Important File Locations

```
Backend:
├── src/index.ts                    # Entry point
├── src/controllers/                # HTTP handlers
├── src/services/                   # Business logic
├── src/repositories/               # Database access
├── src/middleware/                 # Express middleware
├── src/types/                      # TypeScript types
└── src/utils/                      # Utilities

Frontend:
├── src/main.tsx                    # Entry point
├── src/App.tsx                     # Root component
├── src/pages/                      # Page components
├── src/components/                 # Reusable components
├── src/hooks/                      # Custom hooks
├── src/api/                        # API client
└── src/types/                      # TypeScript types

Database:
└── database/schema.sql             # Database schema
```

### Environment Variables Reference

**Backend (.env):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_ocr

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your-bucket

# Logging
LOG_LEVEL=info
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 🎯 Feature Development Checklist

Use this checklist when developing a new feature:

### Planning Phase
- [ ] Define feature requirements clearly
- [ ] Identify database schema changes needed
- [ ] Design API endpoints (if needed)
- [ ] Sketch UI components (if frontend)
- [ ] Review similar existing features

### Backend Development
- [ ] Create TypeScript interfaces/types
- [ ] Create repository (database layer)
- [ ] Create service (business logic)
- [ ] Create controller (HTTP handler)
- [ ] Create routes
- [ ] Add validation (Zod schemas)
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test manually with Postman/curl

### Frontend Development
- [ ] Create TypeScript types
- [ ] Create API client functions
- [ ] Create custom hook (if needed)
- [ ] Create components
- [ ] Create page component
- [ ] Add route
- [ ] Add form validation (if applicable)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test manually in browser
- [ ] Test on mobile viewport

### Database Changes
- [ ] Write migration SQL
- [ ] Test migration locally
- [ ] Add indexes for performance
- [ ] Update seed data (if needed)
- [ ] Document schema changes

### Testing & Quality
- [ ] All tests pass
- [ ] Code follows conventions
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Responsive design works
- [ ] Error cases handled
- [ ] Loading states present

### Documentation
- [ ] Update API documentation
- [ ] Add code comments
- [ ] Update README (if needed)
- [ ] Document environment variables

---

## 💡 Best Practices

### 1. Security
- ✅ Always use parameterized queries (prevent SQL injection)
- ✅ Validate all user input (use Zod)
- ✅ Use JWT for authentication
- ✅ Hash passwords with bcrypt
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Sanitize error messages (don't expose internals)

### 2. Performance
- ✅ Add database indexes on frequently queried columns
- ✅ Use pagination for large datasets
- ✅ Implement caching where appropriate
- ✅ Optimize images before upload
- ✅ Use lazy loading for components
- ✅ Minimize bundle size

### 3. Code Quality
- ✅ Write meaningful variable names
- ✅ Keep functions small and focused
- ✅ Add comments for complex logic
- ✅ Follow DRY principle (Don't Repeat Yourself)
- ✅ Use TypeScript strictly (avoid `any`)
- ✅ Handle errors gracefully

### 4. User Experience
- ✅ Show loading states
- ✅ Display helpful error messages
- ✅ Provide feedback for actions (toasts)
- ✅ Make UI responsive
- ✅ Add keyboard shortcuts
- ✅ Ensure accessibility

### 5. Git Workflow
```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add feature name"

# Push to remote
git push origin feature/feature-name

# Create pull request
# After review, merge to main
```

**Commit Message Format:**
```
feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor service
test: add tests
chore: update dependencies
```

---

## 📖 Additional Resources

### Documentation
- [Main README](../../README.md) - Complete project documentation
- [Implementation Checklist](../IMPLEMENTATION_CHECKLIST.md) - Task tracking
- [API Design](../api/API_DESIGN.md) - API specifications
- [Database Schema](../../database/schema.sql) - Database structure

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS Textract](https://docs.aws.amazon.com/textract/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [pgAdmin](https://www.pgadmin.org/) - PostgreSQL GUI
- [React DevTools](https://react.dev/learn/react-developer-tools) - React debugging
- [VS Code Extensions](https://code.visualstudio.com/docs/editor/extension-marketplace):
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense
  - PostgreSQL

---

## 🎉 Summary

You now have a complete guide for developing features in the Invoice OCR Platform!

### Key Takeaways:
1. **Follow the layered architecture** - Repository → Service → Controller
2. **Use TypeScript strictly** - Define interfaces for everything
3. **Test as you go** - Don't wait until the end
4. **Follow naming conventions** - Use kebab-case for files
5. **Handle errors gracefully** - Always think about edge cases
6. **Keep it simple** - Don't over-engineer

### Next Steps:
1. Review the [Implementation Checklist](../IMPLEMENTATION_CHECKLIST.md)
2. Pick a feature to implement
3. Follow the step-by-step process in this guide
4. Test thoroughly
5. Deploy with confidence!

**Happy coding! 🚀**

---

*Last updated: 2025-12-13*

