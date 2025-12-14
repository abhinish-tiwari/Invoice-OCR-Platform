# Invoice OCR Platform - Backend API

Node.js + Express + TypeScript backend for Invoice OCR Platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- AWS Account (for S3 and Textract)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run database migrations
psql invoice_ocr < ../database/schema.sql

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Database access
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utilities (logger, database)
│   ├── types/             # TypeScript types
│   └── index.ts           # Entry point
├── tests/                 # Test files
├── logs/                  # Log files (auto-generated)
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

## 🛠 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (TODO)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### Invoices (TODO)
- `POST /api/v1/invoices` - Upload invoice
- `GET /api/v1/invoices` - List invoices
- `GET /api/v1/invoices/:id` - Get invoice details

### Analytics (TODO)
- `GET /api/v1/analytics/summary` - Get spend summary
- `GET /api/v1/analytics/spend-over-time` - Get spend trends
- `GET /api/v1/analytics/top-products` - Top products
- `GET /api/v1/analytics/top-suppliers` - Top suppliers

### Admin (TODO)
- `GET /api/v1/admin/invoices` - List invoices needing review
- `POST /api/v1/admin/invoices/:id/corrections` - Submit corrections

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `S3_BUCKET_NAME` - S3 bucket for invoice uploads

## 🐳 Docker

Build and run with Docker:

```bash
# Build image
docker build -t invoice-ocr-api .

# Run container
docker run -p 3000:3000 --env-file .env invoice-ocr-api
```

## 📚 Documentation

See the main project documentation in `../documentation/` for:
- API Design: `../documentation/api/API_DESIGN.md`
- Implementation Guide: `../documentation/development/IMPLEMENTATION_GUIDE.md`
- Deployment: `../documentation/deployment/DEPLOYMENT.md`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📝 Next Steps

1. Implement authentication endpoints
2. Implement invoice upload and OCR processing
3. Implement analytics endpoints
4. Implement admin panel endpoints
5. Add comprehensive tests
6. Set up CI/CD pipeline

See `../documentation/IMPLEMENTATION_CHECKLIST.md` for detailed tasks.

