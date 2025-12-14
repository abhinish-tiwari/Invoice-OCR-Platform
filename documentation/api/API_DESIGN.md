# API Design Specification

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.yourdomain.com/api/v1
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/me
Get current authenticated user details.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

---

## 2. Invoice Endpoints

### POST /invoices
Upload a new invoice file.

**Auth:** Required  
**Content-Type:** multipart/form-data

**Request:**
```
file: <binary> (PDF, JPG, PNG, max 10MB)
```

**Response (201):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "fileUrl": "https://s3.../invoice.pdf",
  "fileType": "application/pdf",
  "fileSizeBytes": 245678,
  "status": "PENDING",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### GET /invoices
List user's invoices with filtering and pagination.

**Auth:** Required

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` (PENDING, PROCESSING, PARSED, NEEDS_REVIEW, REVIEWED, FAILED)
- `supplierId` (uuid)
- `fromDate` (ISO date)
- `toDate` (ISO date)
- `sortBy` (createdAt, invoiceDate, totalAmount)
- `sortOrder` (asc, desc)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "supplier": {
        "id": "uuid",
        "name": "ABC Suppliers Ltd"
      },
      "invoiceDate": "2025-01-10",
      "invoiceNumber": "INV-2025-001",
      "status": "PARSED",
      "totalAmount": 1234.56,
      "currency": "USD",
      "lineItemCount": 15,
      "confidenceScore": 0.92,
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### GET /invoices/:id
Get detailed invoice information including line items.

**Auth:** Required

**Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "supplier": {
    "id": "uuid",
    "name": "ABC Suppliers Ltd",
    "contactEmail": "orders@abc.com"
  },
  "fileUrl": "https://s3-presigned-url...",
  "thumbnailUrl": "https://s3-presigned-url...",
  "invoiceDate": "2025-01-10",
  "invoiceNumber": "INV-2025-001",
  "status": "PARSED",
  "totalAmount": 1234.56,
  "currency": "USD",
  "confidenceScore": 0.92,
  "lineItems": [
    {
      "id": "uuid",
      "lineNumber": 1,
      "product": {
        "id": "uuid",
        "name": "Organic Tomatoes",
        "category": "Vegetables"
      },
      "rawDescription": "TOMATOES ORG 1KG",
      "packSize": "1kg",
      "quantity": 10,
      "unitPrice": 3.50,
      "lineTotal": 35.00,
      "confidenceScore": 0.95,
      "needsReview": false
    }
  ],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:35:00Z"
}
```

---

## 3. Admin Endpoints

### GET /admin/invoices
List invoices needing review (admin only).

**Auth:** Required (admin role)

**Query Parameters:**
- `status` (default: NEEDS_REVIEW)
- `page`, `limit`, `sortBy`, `sortOrder`

**Response:** Same structure as `GET /invoices`

### GET /admin/invoices/:id
Get invoice details for admin review (same as GET /invoices/:id but includes OCR raw data).

**Auth:** Required (admin role)

**Response (200):** Same as `GET /invoices/:id` plus:
```json
{
  "ocrResults": {
    "provider": "textract",
    "rawOutput": { /* Full Textract JSON */ },
    "processingTimeMs": 2340
  }
}
```

### POST /admin/invoices/:id/corrections
Submit corrections for invoice line items.

**Auth:** Required (admin role)

**Request:**
```json
{
  "supplierId": "uuid",
  "invoiceDate": "2025-01-10",
  "invoiceNumber": "INV-2025-001",
  "lineItems": [
    {
      "id": "uuid",
      "productId": "uuid",
      "rawDescription": "TOMATOES ORG 1KG",
      "packSize": "1kg",
      "quantity": 10,
      "unitPrice": 3.50,
      "lineTotal": 35.00
    }
  ],
  "status": "REVIEWED"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "REVIEWED",
  "reviewedBy": "uuid",
  "reviewedAt": "2025-01-15T11:00:00Z",
  "message": "Invoice corrections saved successfully"
}
```

### POST /admin/products/match
Manually match a raw description to a product.

**Auth:** Required (admin role)

**Request:**
```json
{
  "rawText": "TOMATOES ORG 1KG",
  "productId": "uuid"
}
```

**Response (201):**
```json
{
  "aliasId": "uuid",
  "message": "Product alias created successfully"
}
```

---

## 4. Analytics Endpoints

### GET /analytics/summary
Get high-level summary statistics.

**Auth:** Required

**Query Parameters:**
- `fromDate` (ISO date, default: 30 days ago)
- `toDate` (ISO date, default: today)

**Response (200):**
```json
{
  "period": {
    "from": "2024-12-15",
    "to": "2025-01-15"
  },
  "totalSpend": 45678.90,
  "invoiceCount": 42,
  "supplierCount": 8,
  "productCount": 156,
  "averageInvoiceAmount": 1087.59,
  "topSupplier": {
    "id": "uuid",
    "name": "ABC Suppliers Ltd",
    "spend": 12345.67
  },
  "topProduct": {
    "id": "uuid",
    "name": "Organic Tomatoes",
    "spend": 2345.00
  }
}
```

### GET /analytics/spend-over-time
Get spend trends over time.

**Auth:** Required

**Query Parameters:**
- `fromDate`, `toDate`
- `interval` (day, week, month - default: month)
- `groupBy` (supplier, category - optional)

**Response (200):**
```json
{
  "interval": "month",
  "data": [
    {
      "period": "2024-11",
      "spend": 38900.50,
      "invoiceCount": 35
    },
    {
      "period": "2024-12",
      "spend": 42100.75,
      "invoiceCount": 38
    },
    {
      "period": "2025-01",
      "spend": 45678.90,
      "invoiceCount": 42
    }
  ]
}
```

### GET /analytics/top-products
Get top products by spend.

**Auth:** Required

**Query Parameters:**
- `fromDate`, `toDate`
- `limit` (default: 10, max: 50)
- `category` (optional filter)

**Response (200):**
```json
{
  "data": [
    {
      "product": {
        "id": "uuid",
        "name": "Organic Tomatoes",
        "category": "Vegetables",
        "packSize": "1kg"
      },
      "totalSpend": 2345.00,
      "totalQuantity": 670,
      "averageUnitPrice": 3.50,
      "invoiceCount": 15,
      "supplierCount": 3
    }
  ]
}
```

### GET /analytics/top-suppliers
Get top suppliers by spend.

**Auth:** Required

**Query Parameters:**
- `fromDate`, `toDate`
- `limit` (default: 10, max: 50)

**Response (200):**
```json
{
  "data": [
    {
      "supplier": {
        "id": "uuid",
        "name": "ABC Suppliers Ltd"
      },
      "totalSpend": 12345.67,
      "invoiceCount": 15,
      "productCount": 45,
      "averageInvoiceAmount": 823.04
    }
  ]
}
```

### GET /analytics/price-changes
Get significant price changes for products.

**Auth:** Required

**Query Parameters:**
- `fromDate`, `toDate`
- `threshold` (percentage, default: 10)
- `limit` (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "product": {
        "id": "uuid",
        "name": "Organic Tomatoes",
        "packSize": "1kg"
      },
      "supplier": {
        "id": "uuid",
        "name": "ABC Suppliers Ltd"
      },
      "previousPrice": 3.50,
      "currentPrice": 4.20,
      "changePercent": 20.0,
      "changeAmount": 0.70,
      "previousDate": "2024-12-01",
      "currentDate": "2025-01-10"
    }
  ]
}
```

### GET /analytics/opportunities
Get cost-saving opportunities.

**Auth:** Required

**Query Parameters:**
- `limit` (default: 20)
- `minSavings` (minimum savings amount, default: 10)

**Response (200):**
```json
{
  "data": [
    {
      "product": {
        "id": "uuid",
        "name": "Organic Tomatoes",
        "packSize": "1kg"
      },
      "currentSupplier": {
        "id": "uuid",
        "name": "ABC Suppliers Ltd",
        "price": 4.20,
        "lastOrderDate": "2025-01-10"
      },
      "betterSupplier": {
        "id": "uuid",
        "name": "XYZ Wholesale",
        "price": 3.50,
        "lastOrderDate": "2024-11-15"
      },
      "potentialSavings": 0.70,
      "potentialSavingsPercent": 16.67,
      "estimatedMonthlySavings": 47.00,
      "basedOnQuantity": 67
    }
  ]
}
```

---

## 5. Product & Supplier Endpoints

### GET /products
Search and list products.

**Auth:** Required

**Query Parameters:**
- `search` (text search)
- `category`
- `page`, `limit`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Organic Tomatoes",
      "normalizedName": "organic_tomatoes",
      "packSize": "1kg",
      "category": "Vegetables",
      "unit": "kg"
    }
  ],
  "pagination": { /* ... */ }
}
```

### GET /suppliers
List suppliers.

**Auth:** Required

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ABC Suppliers Ltd",
      "contactEmail": "orders@abc.com",
      "invoiceCount": 15,
      "totalSpend": 12345.67
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error format:

**400 Bad Request:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "NOT_FOUND",
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "uuid"
}
```


