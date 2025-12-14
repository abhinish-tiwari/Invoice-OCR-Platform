# ⚡ Quick Start Guide - Invoice OCR Platform

## 🎯 What You'll Build

A complete **Invoice OCR Platform** that:
- 📸 Uploads invoices (PDF/images)
- 🤖 Extracts data using AWS Textract
- 📊 Tracks spending and price trends
- 💰 Identifies cost-saving opportunities
- ✅ Enables admin review and corrections

---

## 📋 Prerequisites (5 minutes)

Install these before starting:

```bash
# 1. Node.js 18+ (check version)
node --version  # Should be v18.x or higher

# 2. PostgreSQL 15+ (check version)
psql --version  # Should be 15.x or higher

# 3. Git
git --version
```

**Don't have them?**
- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/
- Git: https://git-scm.com/downloads

---

## 🚀 Setup (10 minutes)

### Step 1: Database Setup

```bash
# Create database
createdb invoice_ocr

# Run schema
psql invoice_ocr < database/schema.sql

# Verify (should show 9 tables)
psql invoice_ocr -c "\dt"
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file (use your favorite editor)
nano .env
```

**Edit `.env` with these values:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/invoice_ocr
JWT_SECRET=your_super_secret_key_change_this_in_production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your-s3-bucket-name
PORT=3000
NODE_ENV=development
```

```bash
# Start backend server
npm run dev
```

✅ Backend should be running on **http://localhost:3000**

### Step 3: Frontend Setup (New Terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Edit `.env` with:**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

```bash
# Start frontend server
npm run dev
```

✅ Frontend should be running on **http://localhost:5173**

### Step 4: Verify Installation

Open your browser:
- **Frontend:** http://localhost:5173
- **Backend Health:** http://localhost:3000/health

You should see the login page! 🎉

---

## 📚 Project Structure Overview

```
Invoice-OCR-Platform/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── controllers/  # HTTP request handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Database access
│   │   ├── middleware/   # Auth, validation, etc.
│   │   └── utils/        # Helper functions
│   └── package.json
│
├── frontend/             # React + TypeScript
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── api/          # API client
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── database/
│   └── schema.sql        # PostgreSQL schema
│
└── documentation/        # All project docs
    ├── START_HERE.md
    ├── IMPLEMENTATION_CHECKLIST.md
    └── development/
        └── FEATURE_DEVELOPMENT_GUIDE.md  # ⭐ Read this!
```

---

## 🎓 Learning Path

### For Beginners (Start Here)

1. **Understand the Project** (30 min)
   - Read: [README.md](README.md) - Sections 1-4
   - Review: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

2. **Explore the Code** (1 hour)
   - Backend: `backend/src/index.ts`
   - Frontend: `frontend/src/App.tsx`
   - Database: `database/schema.sql`

3. **Follow a Tutorial** (2 hours)
   - Read: [FEATURE_DEVELOPMENT_GUIDE.md](documentation/development/FEATURE_DEVELOPMENT_GUIDE.md)
   - Build a simple feature following the guide

### For Experienced Developers

1. **Quick Overview** (15 min)
   - Skim: [README.md](README.md)
   - Review: [IMPLEMENTATION_CHECKLIST.md](documentation/IMPLEMENTATION_CHECKLIST.md)

2. **Start Building** (Immediately)
   - Pick a task from the checklist
   - Follow: [FEATURE_DEVELOPMENT_GUIDE.md](documentation/development/FEATURE_DEVELOPMENT_GUIDE.md)

---

## 🔨 Development Workflow

### Daily Workflow

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Database (when needed)
psql invoice_ocr
```

### Making Changes

1. **Backend Changes:**
   - Edit files in `backend/src/`
   - Server auto-restarts (nodemon)
   - Test: http://localhost:3000/api/v1/...

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Browser auto-refreshes (Vite HMR)
   - View: http://localhost:5173

3. **Database Changes:**
   - Edit `database/schema.sql`
   - Re-run: `psql invoice_ocr < database/schema.sql`

---

## 📖 Key Documentation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [README.md](README.md) | Complete project documentation | First time setup |
| [FEATURE_DEVELOPMENT_GUIDE.md](documentation/development/FEATURE_DEVELOPMENT_GUIDE.md) | How to build features | Before coding |
| [IMPLEMENTATION_CHECKLIST.md](documentation/IMPLEMENTATION_CHECKLIST.md) | Task tracking | Daily |
| [API_DESIGN.md](documentation/api/API_DESIGN.md) | API specifications | When building APIs |

---

## 🆘 Common Issues & Solutions

### Issue: Database connection error
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux
```

### Issue: Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in backend/.env
PORT=3001
```

### Issue: AWS credentials error
- Check `backend/.env` has correct AWS credentials
- Verify AWS account has S3 and Textract permissions

---

## 🎯 Next Steps

Choose your path:

### Path 1: Follow the Implementation Checklist
```bash
open documentation/IMPLEMENTATION_CHECKLIST.md
```
Work through tasks phase by phase.

### Path 2: Build a Specific Feature
```bash
open documentation/development/FEATURE_DEVELOPMENT_GUIDE.md
```
Follow the step-by-step guide to add a new feature.

### Path 3: Explore Existing Code
- Backend: Start with `backend/src/index.ts`
- Frontend: Start with `frontend/src/App.tsx`
- Database: Review `database/schema.sql`

---

## 💡 Pro Tips

1. **Use the Feature Development Guide** - It has complete code examples
2. **Test as you go** - Don't wait until the end
3. **Follow naming conventions** - Use kebab-case for files
4. **Read error messages** - They usually tell you what's wrong
5. **Use TypeScript** - It catches errors before runtime

---

## 🎉 You're Ready!

Your development environment is set up. Now:

1. ✅ Backend running on port 3000
2. ✅ Frontend running on port 5173
3. ✅ Database created and schema loaded

**Start building!** 🚀

For detailed feature development guidance, read:
👉 [FEATURE_DEVELOPMENT_GUIDE.md](documentation/development/FEATURE_DEVELOPMENT_GUIDE.md)

---

*Last updated: 2025-12-13*

