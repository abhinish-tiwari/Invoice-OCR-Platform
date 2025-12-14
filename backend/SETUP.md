# Invoice OCR Backend - Setup Guide

## 📁 Project Structure

```
backend/
│
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server startup and initialization
│   ├── index.ts               # Main entry point
│
│   ├── config/
│   │   ├── db.ts              # PostgreSQL connection pool
│   │   ├── env.ts             # Environment variables configuration
│   │   └── jwt.ts             # JWT configuration
│
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.routes.ts        # Route definitions
│   │       ├── auth.controller.ts    # Request handlers
│   │       ├── auth.service.ts       # Business logic
│   │       ├── auth.repository.ts    # Database operations
│   │       ├── auth.validation.ts    # Zod validation schemas
│   │       └── auth.middleware.ts    # Auth-specific middleware
│
│   ├── middleware/
│   │   ├── error.middleware.ts       # Global error handling
│   │   └── rateLimit.middleware.ts   # Rate limiting
│
│   ├── utils/
│   │   ├── hash.util.ts       # Password hashing (bcrypt)
│   │   ├── jwt.util.ts        # JWT token operations
│   │   ├── logger.ts          # Winston logger
│   │   └── database.ts        # Database utilities (legacy)
│
│   ├── routes/
│   │   └── index.ts           # Route aggregator
│
│   ├── constants/
│   │   └── messages.ts        # Application messages
│
│   └── db/
│       └── migrations/
│           └── 001_create_users_table.sql
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the following:
   - `DB_PASSWORD`: Your PostgreSQL password
   - `JWT_SECRET`: A strong secret key for JWT tokens
   - `JWT_REFRESH_SECRET`: A different strong secret for refresh tokens
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `AWS_S3_BUCKET`: Your S3 bucket name

4. **Create PostgreSQL database**
   ```bash
   createdb invoice_ocr
   ```
   
   Or using psql:
   ```sql
   CREATE DATABASE invoice_ocr;
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```
   
   Or manually:
   ```bash
   psql -U postgres -d invoice_ocr -f src/db/migrations/001_create_users_table.sql
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The server should now be running on `http://localhost:3000`

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run db:migrate` - Run database migrations

## 🔐 Authentication Endpoints

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Inc" // optional
}
```

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Get Profile (Protected)
```http
GET /api/v1/auth/profile
Authorization: Bearer your_access_token
```

### Logout (Protected)
```http
POST /api/v1/auth/logout
Authorization: Bearer your_access_token
```

## 🏗️ Architecture

This backend follows a **modular architecture** with clear separation of concerns:

- **Routes**: Define API endpoints and apply middleware
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle database operations
- **Middleware**: Process requests before they reach controllers
- **Validation**: Validate request data using Zod schemas

## 🔒 Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting on API endpoints
- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection prevention with parameterized queries

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `company` (VARCHAR, Optional)
- `role` (VARCHAR, Default: 'user')
- `is_verified` (BOOLEAN, Default: false)
- `last_login` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

