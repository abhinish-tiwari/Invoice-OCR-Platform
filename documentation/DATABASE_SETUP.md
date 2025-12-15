# Database Setup Guide

## Prerequisites
- PostgreSQL installed on your system
- Access to PostgreSQL (either through pgAdmin or command line)

## Setup Instructions

### Option 1: Using pgAdmin (Recommended for Windows)

1. **Open pgAdmin** and connect to your PostgreSQL server

2. **Open Query Tool**:
   - Right-click on "PostgreSQL" server
   - Select "Query Tool"

3. **Run the setup script**:
   - Open the file `setup-database.sql`
   - Copy all the content
   - Paste it into the Query Tool
   - Click the "Execute" button (▶️)

4. **Verify the setup**:
   - Refresh the database list
   - You should see `invoice_ocr` database
   - Expand it to see the tables: `users`, `invoices`, `invoice_items`

### Option 2: Using Command Line (psql)

1. **Open Command Prompt or PowerShell**

2. **Navigate to the backend directory**:
   ```bash
   cd "D:\01.learnings\05. React-Learning\Invoice-OCR-Platform\backend"
   ```

3. **Run the setup script**:
   ```bash
   psql -U postgres -f setup-database.sql
   ```
   
   You'll be prompted for the postgres user password.

### Option 3: Using existing postgres user

If you prefer to use the default `postgres` user:

1. **Update the `.env` file** with your actual postgres password:
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_actual_postgres_password
   ```

2. **Create the database manually**:
   - Open pgAdmin or psql
   - Run: `CREATE DATABASE invoice_ocr;`

3. **Run migrations** (if you have them) or create tables manually

## Database Credentials

The setup script creates:
- **Database**: `invoice_ocr`
- **User**: `invoice_ocr_user`
- **Password**: `invoice_ocr_password_123`

These credentials are already configured in your `.env` file.

## Verify Connection

After setup, start your backend server:

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Database connection test successful
```

## Troubleshooting

### Error: "password authentication failed"
- Make sure PostgreSQL is running
- Verify the password in `.env` matches your PostgreSQL password
- If using the setup script, ensure it ran successfully

### Error: "database does not exist"
- Run the `setup-database.sql` script
- Or create the database manually in pgAdmin

### Error: "connection refused"
- Check if PostgreSQL service is running
- Verify the port (default: 5432) in `.env`
- Check if `DB_HOST` is correct (usually `localhost`)

## Next Steps

Once the database is set up and connected:
1. The server will start successfully
2. You can test the API endpoints
3. Register a new user via `/api/auth/register`
4. Login and start using the application

