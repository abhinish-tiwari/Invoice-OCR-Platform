# 📊 Database Commands & Schema Reference

## Table of Contents
- [NPM Scripts](#npm-scripts)
- [Connection Details](#connection-details)
- [PostgreSQL Commands](#postgresql-commands)
- [Database Schema](#database-schema)
- [Common SQL Queries](#common-sql-queries)
- [Database Maintenance](#database-maintenance)
- [psql Meta-Commands](#psql-meta-commands)

---

## NPM Scripts

```bash
# Setup database (create tables, indexes, triggers)
npm run db:setup

# Test database connection and list tables
npm run db:test
```

---

## Connection Details

| Parameter | Value |
|-----------|-------|
| **Host** | localhost |
| **Port** | 5433 |
| **Database** | invoice_ocr |
| **User** | postgres |
| **Password** | postgres |

---

## PostgreSQL Commands

### Connect to Database
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr
```

### List All Tables
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr -c "\dt"
```

### List All Indexes
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr -c "\di"
```

### Describe a Specific Table
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr -c "\d TABLE_NAME"
```

### Run SQL File
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -f backend/scripts/setup-database.sql
```

### Execute SQL Query
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr -c "SELECT * FROM users;"
```

---

## Database Schema

### Tables Overview (10 total)

1. **users** - User accounts and authentication
2. **invoices** - Invoice documents and metadata
3. **invoice_items** - Line items from invoices (legacy)
4. **invoice_lines** - Detailed line items with product matching
5. **suppliers** - Supplier/vendor information
6. **products** - Product catalog
7. **price_history** - Historical pricing data
8. **ocr_results** - Raw OCR processing results
9. **product_aliases** - Product name variations for matching
10. **processing_logs** - Invoice processing audit trail

---

### 1. users

**Purpose:** Store user accounts and authentication information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'user' | User role (user/admin) |
| first_name | VARCHAR(100) | | User's first name |
| last_name | VARCHAR(100) | | User's last name |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_users_email` on email

**Triggers:**
- `update_users_updated_at` - Auto-update updated_at on row update

---

### 2. invoices

**Purpose:** Store invoice documents and their metadata

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique invoice identifier |
| user_id | UUID | NOT NULL, FK -> users(id) | Owner of the invoice |
| supplier_id | UUID | FK -> suppliers(id) | Associated supplier |
| file_url | VARCHAR(500) | NOT NULL | S3 URL of invoice file |
| file_type | VARCHAR(50) | NOT NULL | File MIME type |
| file_size_bytes | INTEGER | | File size in bytes |
| thumbnail_url | VARCHAR(500) | | Thumbnail image URL |
| invoice_date | DATE | | Date on the invoice |
| invoice_number | VARCHAR(100) | | Invoice number |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'PENDING' | Processing status |
| total_amount | DECIMAL(12,2) | | Total invoice amount |
| currency | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| confidence_score | FLOAT | | OCR confidence score |
| reviewed_by | UUID | FK -> users(id) | User who reviewed |
| reviewed_at | TIMESTAMP | | Review timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Status Values:**
- `PENDING` - Uploaded, waiting for processing
- `PROCESSING` - Currently being processed
- `PARSED` - OCR completed successfully
- `NEEDS_REVIEW` - Requires manual review
- `REVIEWED` - Review completed
- `FAILED` - Processing failed

**Indexes:**
- `idx_invoices_user_id` on user_id
- `idx_invoices_supplier_id` on supplier_id
- `idx_invoices_status` on status
- `idx_invoices_invoice_date` on invoice_date
- `idx_invoices_created_at` on created_at

**Triggers:**
- `update_invoices_updated_at` - Auto-update updated_at on row update

---

### 3. invoice_lines

**Purpose:** Store individual line items from invoices with product matching

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique line item identifier |
| invoice_id | UUID | NOT NULL, FK -> invoices(id) | Parent invoice |
| product_id | UUID | FK -> products(id) | Matched product |
| line_number | INTEGER | NOT NULL | Line number on invoice |
| raw_description | TEXT | NOT NULL | Original OCR text |
| normalized_description | VARCHAR(255) | | Cleaned description |
| pack_size | VARCHAR(100) | | Package size |
| quantity | DECIMAL(10,3) | | Quantity ordered |
| unit_price | DECIMAL(12,2) | | Price per unit |
| line_total | DECIMAL(12,2) | | Total line amount |
| confidence_score | FLOAT | | OCR confidence |
| needs_review | BOOLEAN | DEFAULT FALSE | Requires review flag |
| reviewed | BOOLEAN | DEFAULT FALSE | Review completed flag |
| metadata | JSONB | DEFAULT '{}' | Additional data |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_invoice_lines_invoice_id` on invoice_id
- `idx_invoice_lines_product_id` on product_id
- `idx_invoice_lines_needs_review` on needs_review

---

### 4. suppliers

**Purpose:** Store supplier/vendor information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique supplier identifier |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Supplier name |
| normalized_name | VARCHAR(255) | NOT NULL | Normalized name for matching |
| contact_email | VARCHAR(255) | | Contact email |
| contact_phone | VARCHAR(50) | | Contact phone |
| metadata | JSONB | DEFAULT '{}' | Additional data |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_suppliers_normalized_name` on normalized_name

---

### 5. products

**Purpose:** Store product catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique product identifier |
| name | VARCHAR(255) | NOT NULL | Product name |
| normalized_name | VARCHAR(255) | UNIQUE, NOT NULL | Normalized name for matching |
| pack_size | VARCHAR(100) | | Package size |
| category | VARCHAR(100) | | Product category |
| unit | VARCHAR(50) | | Unit of measure |
| metadata | JSONB | DEFAULT '{}' | Additional data |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_products_normalized_name` on normalized_name
- `idx_products_category` on category

---

### 6. price_history

**Purpose:** Track historical pricing data for products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique record identifier |
| product_id | UUID | NOT NULL, FK -> products(id) | Product reference |
| supplier_id | UUID | NOT NULL, FK -> suppliers(id) | Supplier reference |
| invoice_line_id | UUID | FK -> invoice_lines(id) | Source line item |
| unit_price | DECIMAL(12,2) | NOT NULL | Price per unit |
| pack_size | VARCHAR(100) | | Package size |
| price_date | DATE | NOT NULL | Date of price |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Indexes:**
- `idx_price_history_product_id` on product_id
- `idx_price_history_supplier_id` on supplier_id
- `idx_price_history_price_date` on price_date
- `idx_price_history_unique` UNIQUE on (product_id, supplier_id, price_date, pack_size)

---

### 7. ocr_results

**Purpose:** Store raw OCR processing results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique result identifier |
| invoice_id | UUID | NOT NULL, FK -> invoices(id) | Parent invoice |
| provider | VARCHAR(50) | NOT NULL | OCR provider name |
| raw_output | JSONB | NOT NULL | Raw OCR response |
| processing_time_ms | INTEGER | | Processing duration |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Processing time |

**Indexes:**
- `idx_ocr_results_invoice_id` on invoice_id

---

### 8. product_aliases

**Purpose:** Store product name variations for better matching

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique alias identifier |
| product_id | UUID | NOT NULL, FK -> products(id) | Product reference |
| raw_text | VARCHAR(255) | UNIQUE, NOT NULL | Original text variation |
| normalized_text | VARCHAR(255) | NOT NULL | Normalized version |
| match_count | INTEGER | DEFAULT 1 | Times this alias matched |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_product_aliases_product_id` on product_id
- `idx_product_aliases_normalized_text` on normalized_text

---

### 9. processing_logs

**Purpose:** Audit trail for invoice processing

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique log identifier |
| invoice_id | UUID | NOT NULL, FK -> invoices(id) | Parent invoice |
| stage | VARCHAR(50) | NOT NULL | Processing stage |
| status | VARCHAR(50) | NOT NULL | Stage status |
| error_message | TEXT | | Error details if failed |
| metadata | JSONB | DEFAULT '{}' | Additional data |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Log time |

**Stage Values:**
- `UPLOAD` - File upload stage
- `OCR` - OCR processing stage
- `PARSING` - Data parsing stage
- `MATCHING` - Product matching stage
- `COMPLETE` - Processing complete

**Status Values:**
- `STARTED` - Stage started
- `SUCCESS` - Stage completed successfully
- `FAILED` - Stage failed
- `RETRY` - Retrying stage

**Indexes:**
- `idx_processing_logs_invoice_id` on invoice_id
- `idx_processing_logs_created_at` on created_at

---

### 10. invoice_items (Legacy)

**Purpose:** Legacy line items table (kept for backward compatibility)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique item identifier |
| invoice_id | UUID | NOT NULL, FK -> invoices(id) | Parent invoice |
| description | TEXT | | Item description |
| quantity | DECIMAL(10,2) | | Quantity |
| unit_price | DECIMAL(10,2) | | Price per unit |
| amount | DECIMAL(10,2) | | Total amount |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes:**
- `idx_invoice_items_invoice_id` on invoice_id

---

## Common SQL Queries

### User Queries

```sql
-- Count all users
SELECT COUNT(*) FROM users;

-- Get all users with their role
SELECT id, email, first_name, last_name, role, created_at
FROM users
ORDER BY created_at DESC;

-- Find user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Get admin users
SELECT * FROM users WHERE role = 'admin';
```

### Invoice Queries

```sql
-- List all invoices with user info
SELECT i.*, u.email, u.first_name, u.last_name
FROM invoices i
JOIN users u ON i.user_id = u.id
ORDER BY i.created_at DESC;

-- Get invoices by status
SELECT * FROM invoices WHERE status = 'PENDING';

-- Get invoices needing review
SELECT * FROM invoices WHERE status = 'NEEDS_REVIEW';

-- Get invoice with all line items
SELECT i.*, il.*
FROM invoices i
LEFT JOIN invoice_lines il ON i.id = il.invoice_id
WHERE i.id = 'YOUR_INVOICE_ID';

-- Get invoices by date range
SELECT * FROM invoices
WHERE invoice_date BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY invoice_date DESC;

-- Get total invoice amount by user
SELECT u.email, COUNT(i.id) as invoice_count, SUM(i.total_amount) as total_amount
FROM users u
LEFT JOIN invoices i ON u.id = i.user_id
GROUP BY u.id, u.email;
```

### Product & Supplier Queries

```sql
-- Get all products with their category
SELECT * FROM products ORDER BY category, name;

-- Get products with price history
SELECT p.name, ph.unit_price, ph.price_date, s.name as supplier_name
FROM products p
JOIN price_history ph ON p.id = ph.product_id
JOIN suppliers s ON ph.supplier_id = s.id
ORDER BY ph.price_date DESC;

-- Get latest price for each product
SELECT DISTINCT ON (p.id)
    p.name,
    ph.unit_price,
    ph.price_date,
    s.name as supplier_name
FROM products p
JOIN price_history ph ON p.id = ph.product_id
JOIN suppliers s ON ph.supplier_id = s.id
ORDER BY p.id, ph.price_date DESC;

-- Get all suppliers
SELECT * FROM suppliers ORDER BY name;
```

### Processing & Logs Queries

```sql
-- Get processing logs for an invoice
SELECT * FROM processing_logs
WHERE invoice_id = 'YOUR_INVOICE_ID'
ORDER BY created_at DESC;

-- Get failed processing stages
SELECT pl.*, i.invoice_number, i.file_url
FROM processing_logs pl
JOIN invoices i ON pl.invoice_id = i.id
WHERE pl.status = 'FAILED'
ORDER BY pl.created_at DESC;

-- Get OCR results for an invoice
SELECT * FROM ocr_results
WHERE invoice_id = 'YOUR_INVOICE_ID';
```

---

## Database Maintenance

### Backup Database
```powershell
$env:PGPASSWORD='postgres'; pg_dump -U postgres -p 5433 invoice_ocr > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### Restore Database
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 invoice_ocr < backup.sql
```

### Drop All Tables (⚠️ CAREFUL!)
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Vacuum Database (Optimize)
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr -c "VACUUM ANALYZE;"
```

### Check Database Size
```powershell
$env:PGPASSWORD='postgres'; psql -U postgres -p 5433 -d invoice_ocr -c "SELECT pg_size_pretty(pg_database_size('invoice_ocr'));"
```

### Check Table Sizes
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## psql Meta-Commands

When connected to the database via psql, you can use these commands:

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\di` | List all indexes |
| `\df` | List all functions |
| `\dv` | List all views |
| `\du` | List all users/roles |
| `\l` | List all databases |
| `\d TABLE_NAME` | Describe table structure |
| `\d+ TABLE_NAME` | Describe table with more details |
| `\x` | Toggle expanded display (useful for wide tables) |
| `\timing` | Toggle query execution time display |
| `\q` | Quit psql |
| `\h COMMAND` | Help on SQL command |
| `\?` | Help on psql commands |
| `\i FILE` | Execute commands from file |
| `\o FILE` | Send query results to file |
| `\! COMMAND` | Execute shell command |

---

## Quick Reference

### Database Setup Flow
1. Install PostgreSQL
2. Run `npm run db:setup` to create database and tables
3. Run `npm run db:test` to verify connection
4. Start backend server with `npm run dev`

### Common Tasks

**Add a new user:**
```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('user@example.com', 'hashed_password', 'John', 'Doe', 'user');
```

**Update invoice status:**
```sql
UPDATE invoices
SET status = 'REVIEWED', reviewed_by = 'USER_ID', reviewed_at = NOW()
WHERE id = 'INVOICE_ID';
```

**Delete an invoice (cascades to line items):**
```sql
DELETE FROM invoices WHERE id = 'INVOICE_ID';
```

**Get statistics:**
```sql
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM invoices) as total_invoices,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM suppliers) as total_suppliers;
```

---

## Related Documentation

- [Database Setup Guide](./DATABASE_SETUP.md)
- [Project Setup](./SETUP.md)
- [Getting Started](./GETTING_STARTED.md)

---

**Last Updated:** 2025-12-16

