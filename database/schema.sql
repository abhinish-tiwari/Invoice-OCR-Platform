-- =====================================================
-- Enable UUID extension
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Common updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_expires_at TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_normalized_name ON suppliers(normalized_name);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_suppliers_updated_at') THEN
        CREATE TRIGGER trg_suppliers_updated_at
        BEFORE UPDATE ON suppliers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) UNIQUE NOT NULL,
    pack_size VARCHAR(100),
    category VARCHAR(100),
    unit VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_normalized_name ON products(normalized_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at') THEN
        CREATE TRIGGER trg_products_updated_at
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_bytes BIGINT,
    thumbnail_url VARCHAR(500),
    invoice_date DATE,
    invoice_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'PROCESSING',
            'PARSED',
            'NEEDS_REVIEW',
            'REVIEWED',
            'FAILED'
        )),
    total_amount DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_reviewed_by ON invoices(reviewed_by);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_invoices_updated_at') THEN
        CREATE TRIGGER trg_invoices_updated_at
        BEFORE UPDATE ON invoices
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- INVOICE LINES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    line_number INTEGER NOT NULL,
    raw_description TEXT NOT NULL,
    normalized_description VARCHAR(255),
    pack_size VARCHAR(100),
    quantity DECIMAL(10, 3),
    unit_price DECIMAL(12, 2),
    line_total DECIMAL(12, 2),
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
    needs_review BOOLEAN DEFAULT FALSE,
    reviewed BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (invoice_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_product_id ON invoice_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_needs_review ON invoice_lines(needs_review);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_invoice_lines_updated_at') THEN
        CREATE TRIGGER trg_invoice_lines_updated_at
        BEFORE UPDATE ON invoice_lines
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- PRICE HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    invoice_line_id UUID REFERENCES invoice_lines(id) ON DELETE SET NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    pack_size VARCHAR(100),
    price_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_supplier_id ON price_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_price_history_price_date ON price_history(price_date);
CREATE INDEX IF NOT EXISTS idx_price_history_invoice_line_id ON price_history(invoice_line_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_unique
ON price_history(product_id, supplier_id, price_date, pack_size);

-- =====================================================
-- OCR RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ocr_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    raw_output JSONB NOT NULL,
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ocr_results_invoice_id ON ocr_results(invoice_id);

-- =====================================================
-- PRODUCT ALIASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    raw_text VARCHAR(255) UNIQUE NOT NULL,
    normalized_text VARCHAR(255) NOT NULL,
    match_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_aliases_product_id ON product_aliases(product_id);
CREATE INDEX IF NOT EXISTS idx_product_aliases_normalized_text ON product_aliases(normalized_text);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_aliases_updated_at') THEN
        CREATE TRIGGER trg_product_aliases_updated_at
        BEFORE UPDATE ON product_aliases
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- PROCESSING LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL
        CHECK (stage IN ('UPLOAD', 'OCR', 'PARSING', 'MATCHING', 'COMPLETE')),
    status VARCHAR(50) NOT NULL
        CHECK (status IN ('STARTED', 'SUCCESS', 'FAILED', 'RETRY')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processing_logs_invoice_id ON processing_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at);
