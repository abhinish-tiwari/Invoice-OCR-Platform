# 🚀 Getting Started with Invoice OCR Platform

Welcome! This guide will help you get the Invoice OCR Platform up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **PostgreSQL 15+** installed ([Download](https://www.postgresql.org/download/))
- ✅ **AWS Account** (for S3 and Textract)
- ✅ **Git** installed

## 🎯 Quick Start (5 Minutes)

### 1. Navigate to the Project

```bash
cd Invoice-OCR-Platform
```

### 2. Set Up the Database

```bash
# Create database
createdb invoice_ocr

# Run schema
psql invoice_ocr < database/schema.sql
```

### 3. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

### 4. Set Up Frontend (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 5. Verify Installation

Open your browser:
- Frontend: http://localhost:5173
- Backend Health: http://localhost:3000/health

## 🐳 Quick Start with Docker (Alternative)

```bash
# Copy environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your AWS credentials
nano backend/.env

# Start all services
docker-compose up
```

This will start:
- PostgreSQL on port 5432
- Backend API on port 3000
- Frontend on port 5173

## 📚 What to Read Next

1. **[README.md](README.md)** - Complete documentation (2,000+ lines)
2. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Understand the folder structure
3. **[documentation/START_HERE.md](documentation/START_HERE.md)** - Quick navigation guide
4. **[documentation/IMPLEMENTATION_CHECKLIST.md](documentation/IMPLEMENTATION_CHECKLIST.md)** - 150+ tasks to implement

## 🛠 Development Workflow

### Backend Development

```bash
cd backend
npm run dev          # Start with hot reload
npm test             # Run tests
npm run lint         # Lint code
```

### Frontend Development

```bash
cd frontend
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run lint         # Lint code
```

## 🔑 Required Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_ocr

# JWT
JWT_SECRET=your_super_secret_key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your-bucket
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📝 Next Steps

Follow the implementation checklist:

```bash
open documentation/IMPLEMENTATION_CHECKLIST.md
```

Key tasks:
1. ✅ Project structure (DONE!)
2. ⏳ Implement authentication endpoints
3. ⏳ Implement invoice upload & OCR
4. ⏳ Build frontend pages
5. ⏳ Add analytics dashboard
6. ⏳ Deploy to AWS

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
pg_isready

# Check if database exists
psql -l | grep invoice_ocr
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### AWS Credentials Error
- Verify your AWS credentials in `.env`
- Ensure your AWS user has permissions for S3 and Textract
- Check AWS region is correct

## 📞 Need Help?

- 📖 Read the [complete documentation](README.md)
- 🔍 Check [API documentation](documentation/api/API_DESIGN.md)
- 🏗️ Review [implementation guide](documentation/development/IMPLEMENTATION_GUIDE.md)

## 🎉 You're Ready!

Your development environment is set up! Start building by following the implementation checklist.

**Happy coding!** 🚀

