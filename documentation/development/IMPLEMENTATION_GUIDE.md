# Implementation Guide - Code Examples & Best Practices

## Backend Architecture

### Layered Architecture Pattern

```
┌─────────────────────────────────────┐
│         Controllers/Routes          │  ← HTTP layer
├─────────────────────────────────────┤
│            Services                 │  ← Business logic
├─────────────────────────────────────┤
│          Repositories               │  ← Data access
├─────────────────────────────────────┤
│           Database                  │  ← PostgreSQL
└─────────────────────────────────────┘
```

### Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── app.ts                   # Express app setup
│   ├── config/                  # Configuration
│   │   ├── database.ts
│   │   ├── aws.ts
│   │   └── env.ts
│   ├── middleware/              # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── upload.middleware.ts
│   ├── controllers/             # Route handlers
│   │   ├── auth.controller.ts
│   │   ├── invoices.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── admin.controller.ts
│   ├── services/                # Business logic
│   │   ├── auth/
│   │   │   └── auth.service.ts
│   │   ├── ocr/
│   │   │   ├── types.ts
│   │   │   ├── textract.service.ts
│   │   │   └── ocr-orchestrator.service.ts
│   │   ├── parser/
│   │   │   └── invoice-parser.service.ts
│   │   ├── matching/
│   │   │   ├── product-matcher.service.ts
│   │   │   └── product-cache.service.ts
│   │   ├── analytics/
│   │   │   └── analytics.service.ts
│   │   └── storage/
│   │       └── s3.service.ts
│   ├── repositories/            # Data access
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── invoice.repository.ts
│   │   ├── product.repository.ts
│   │   └── supplier.repository.ts
│   ├── models/                  # TypeScript types
│   │   └── types.ts
│   ├── utils/                   # Utilities
│   │   ├── text-utils.ts
│   │   ├── string-similarity.ts
│   │   ├── validators.ts
│   │   └── logger.ts
│   └── routes/                  # Route definitions
│       ├── index.ts
│       ├── auth.routes.ts
│       ├── invoices.routes.ts
│       ├── analytics.routes.ts
│       └── admin.routes.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Key Implementation Examples

### 1. Base Repository Pattern

```typescript
// src/repositories/base.repository.ts
import { Pool, QueryResult } from 'pg';

export abstract class BaseRepository<T> {
  constructor(
    protected db: Pool,
    protected tableName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(limit = 100, offset = 0): Promise<T[]> {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  async create(data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const result = await this.db.query(
      `INSERT INTO ${this.tableName} (${columns}) 
       VALUES (${placeholders}) 
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await this.db.query(
      `UPDATE ${this.tableName} 
       SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }
}
```

### 2. Invoice Repository (Extended)

```typescript
// src/repositories/invoice.repository.ts
import { BaseRepository } from './base.repository';
import { Invoice, InvoiceLine } from '../models/types';

export class InvoiceRepository extends BaseRepository<Invoice> {
  constructor(db: Pool) {
    super(db, 'invoices');
  }

  async findByUserId(
    userId: string,
    filters: {
      status?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: Invoice[]; total: number }> {
    const { status, fromDate, toDate, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fromDate) {
      whereClause += ` AND invoice_date >= $${paramIndex}`;
      params.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereClause += ` AND invoice_date <= $${paramIndex}`;
      params.push(toDate);
      paramIndex++;
    }

    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataResult = await this.db.query(
      `SELECT i.*, s.name as supplier_name
       FROM ${this.tableName} i
       LEFT JOIN suppliers s ON s.id = i.supplier_id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      data: dataResult.rows,
      total,
    };
  }

  async findWithLineItems(id: string): Promise<Invoice & { lineItems: InvoiceLine[] }> {
    const invoiceResult = await this.db.query(
      `SELECT i.*, s.name as supplier_name, s.contact_email as supplier_email
       FROM invoices i
       LEFT JOIN suppliers s ON s.id = i.supplier_id
       WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      throw new Error('Invoice not found');
    }

    const lineItemsResult = await this.db.query(
      `SELECT il.*, p.name as product_name, p.category as product_category
       FROM invoice_lines il
       LEFT JOIN products p ON p.id = il.product_id
       WHERE il.invoice_id = $1
       ORDER BY il.line_number ASC`,
      [id]
    );

    return {
      ...invoiceResult.rows[0],
      lineItems: lineItemsResult.rows,
    };
  }

  async createLineItem(data: Partial<InvoiceLine>): Promise<InvoiceLine> {
    const result = await this.db.query(
      `INSERT INTO invoice_lines 
       (invoice_id, line_number, raw_description, normalized_description, 
        pack_size, quantity, unit_price, line_total, confidence_score, needs_review)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.invoiceId,
        data.lineNumber,
        data.rawDescription,
        data.normalizedDescription,
        data.packSize,
        data.quantity,
        data.unitPrice,
        data.lineTotal,
        data.confidenceScore,
        data.needsReview,
      ]
    );
    return result.rows[0];
  }

  async logProcessing(
    invoiceId: string,
    log: { stage: string; status: string; errorMessage?: string; metadata?: any }
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO processing_logs (invoice_id, stage, status, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [invoiceId, log.stage, log.status, log.errorMessage || null, log.metadata || {}]
    );
  }

  async createOCRResult(invoiceId: string, ocrResult: any): Promise<void> {
    await this.db.query(
      `INSERT INTO ocr_results (invoice_id, provider, raw_output, processing_time_ms)
       VALUES ($1, $2, $3, $4)`,
      [invoiceId, ocrResult.provider, ocrResult.rawOutput, ocrResult.processingTimeMs]
    );
  }
}
```

### 3. Auth Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Token expired',
      });
    }
    
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid token',
    });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  next();
};
```

### 4. Error Handling Middleware

```typescript
// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code || 'ERROR',
      message: err.message,
    });
  }

  // Unhandled errors
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId: req.headers['x-request-id'],
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### 5. Invoice Controller Example

```typescript
// src/controllers/invoices.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { S3Service } from '../services/storage/s3.service';
import { OCROrchestratorService } from '../services/ocr/ocr-orchestrator.service';
import { asyncHandler, AppError } from '../middleware/error.middleware';

export class InvoicesController {
  constructor(
    private invoiceRepo: InvoiceRepository,
    private s3Service: S3Service,
    private ocrOrchestrator: OCROrchestratorService
  ) {}

  upload = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded', 'MISSING_FILE');
    }

    const userId = req.user!.id;
    const file = req.file;

    // Upload to S3
    const fileUrl = await this.s3Service.uploadFile(
      file.buffer,
      `${userId}/${Date.now()}-${file.originalname}`,
      file.mimetype
    );

    // Create invoice record
    const invoice = await this.invoiceRepo.create({
      userId,
      fileUrl,
      fileType: file.mimetype,
      fileSizeBytes: file.size,
      status: 'PENDING',
    });

    // Trigger OCR processing (async)
    this.ocrOrchestrator.processInvoice(invoice.id, fileUrl)
      .catch(err => {
        console.error('OCR processing failed:', err);
      });

    res.status(201).json(invoice);
  });

  list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const filters = {
      status: req.query.status as string,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
    };

    const { data, total } = await this.invoiceRepo.findByUserId(userId, filters);

    res.json({
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  });

  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const invoice = await this.invoiceRepo.findWithLineItems(id);

    if (!invoice) {
      throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    }

    // Check ownership
    if (invoice.userId !== userId && req.user!.role !== 'admin') {
      throw new AppError(403, 'Access denied', 'FORBIDDEN');
    }

    // Generate pre-signed URL for file access
    if (invoice.fileUrl) {
      invoice.fileUrl = await this.s3Service.getSignedUrl(invoice.fileUrl);
    }

    res.json(invoice);
  });
}
```

### 6. Validation Middleware with Zod

```typescript
// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Example schemas
export const schemas = {
  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    }),
  }),

  uploadInvoice: z.object({
    body: z.object({}), // File is in req.file
  }),

  listInvoices: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      status: z.enum(['PENDING', 'PROCESSING', 'PARSED', 'NEEDS_REVIEW', 'REVIEWED', 'FAILED']).optional(),
      fromDate: z.string().datetime().optional(),
      toDate: z.string().datetime().optional(),
    }),
  }),
};
```

### 7. Route Setup

```typescript
// src/routes/invoices.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { InvoicesController } from '../controllers/invoices.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  },
});

// Inject dependencies (in real app, use DI container)
const invoicesController = new InvoicesController(
  invoiceRepo,
  s3Service,
  ocrOrchestrator
);

router.post(
  '/',
  authenticate,
  upload.single('file'),
  validate(schemas.uploadInvoice),
  invoicesController.upload
);

router.get(
  '/',
  authenticate,
  validate(schemas.listInvoices),
  invoicesController.list
);

router.get(
  '/:id',
  authenticate,
  invoicesController.getById
);

export default router;
```

### 8. App Setup

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import invoicesRoutes from './routes/invoices.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
```

### 9. Entry Point

```typescript
// src/index.ts
import app from './app';
import { initDatabase } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Initialize database connection
    await initDatabase();
    logger.info('Database connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

start();
```

---

## Best Practices

### 1. Environment Variables

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().regex(/^\d+$/).transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  CORS_ORIGIN: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

### 2. Logger Setup

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### 3. Database Connection Pool

```typescript
// src/config/database.ts
import { Pool } from 'pg';
import { env } from './env';

let pool: Pool;

export async function initDatabase(): Promise<Pool> {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20, // maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test connection
  await pool.query('SELECT NOW()');

  return pool;
}

export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}
```

### 4. Dependency Injection Container

```typescript
// src/container.ts
import { Pool } from 'pg';
import { getDatabase } from './config/database';
import { InvoiceRepository } from './repositories/invoice.repository';
import { ProductRepository } from './repositories/product.repository';
import { S3Service } from './services/storage/s3.service';
import { TextractOCRService } from './services/ocr/textract.service';
import { InvoiceParserService } from './services/parser/invoice-parser.service';
import { ProductMatcherService } from './services/matching/product-matcher.service';
import { OCROrchestratorService } from './services/ocr/ocr-orchestrator.service';

class Container {
  private instances = new Map<string, any>();

  get<T>(key: string, factory: () => T): T {
    if (!this.instances.has(key)) {
      this.instances.set(key, factory());
    }
    return this.instances.get(key);
  }

  // Repositories
  get invoiceRepo() {
    return this.get('invoiceRepo', () => new InvoiceRepository(getDatabase()));
  }

  get productRepo() {
    return this.get('productRepo', () => new ProductRepository(getDatabase()));
  }

  // Services
  get s3Service() {
    return this.get('s3Service', () => new S3Service());
  }

  get ocrService() {
    return this.get('ocrService', () => new TextractOCRService());
  }

  get parserService() {
    return this.get('parserService', () =>
      new InvoiceParserService(this.invoiceRepo, this.supplierRepo)
    );
  }

  get productMatcher() {
    return this.get('productMatcher', () =>
      new ProductMatcherService(this.productRepo)
    );
  }

  get ocrOrchestrator() {
    return this.get('ocrOrchestrator', () =>
      new OCROrchestratorService(
        this.invoiceRepo,
        this.ocrService,
        this.parserService
      )
    );
  }
}

export const container = new Container();
```

---

## Testing Examples

### Unit Test Example

```typescript
// tests/unit/services/product-matcher.test.ts
import { ProductMatcherService } from '../../../src/services/matching/product-matcher.service';
import { ProductRepository } from '../../../src/repositories/product.repository';

describe('ProductMatcherService', () => {
  let service: ProductMatcherService;
  let mockProductRepo: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockProductRepo = {
      findByNormalizedName: jest.fn(),
      findByAlias: jest.fn(),
      findAll: jest.fn(),
    } as any;

    service = new ProductMatcherService(mockProductRepo);
  });

  describe('matchProduct', () => {
    it('should return exact match when found', async () => {
      const mockProduct = { id: '123', name: 'Tomatoes', normalizedName: 'tomatoes' };
      mockProductRepo.findByNormalizedName.mockResolvedValue(mockProduct);

      const result = await service.matchProduct('TOMATOES');

      expect(result.productId).toBe('123');
      expect(result.confidence).toBe(1.0);
      expect(result.matchType).toBe('exact');
    });

    it('should return fuzzy match when exact match not found', async () => {
      mockProductRepo.findByNormalizedName.mockResolvedValue(null);
      mockProductRepo.findByAlias.mockResolvedValue(null);
      mockProductRepo.findAll.mockResolvedValue([
        { id: '123', normalizedName: 'tomatoes', packSize: '1kg' },
      ]);

      const result = await service.matchProduct('TOMATOE 1KG');

      expect(result.productId).toBe('123');
      expect(result.matchType).toBe('fuzzy');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
});
```

### Integration Test Example

```typescript
// tests/integration/invoices.test.ts
import request from 'supertest';
import app from '../../src/app';
import { initDatabase, closeDatabase } from '../../src/config/database';

describe('Invoices API', () => {
  let authToken: string;

  beforeAll(async () => {
    await initDatabase();

    // Create test user and get token
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = res.body.token;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/v1/invoices', () => {
    it('should upload invoice successfully', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', 'tests/fixtures/sample-invoice.pdf');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('PENDING');
    });

    it('should reject invalid file type', async () => {
      const res = await request(app)
        .post('/api/v1/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', 'tests/fixtures/invalid.txt');

      expect(res.status).toBe(400);
    });
  });
});
```


