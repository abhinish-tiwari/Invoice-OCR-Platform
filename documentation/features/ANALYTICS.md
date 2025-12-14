# Analytics & Business Logic

## Overview

Analytics provide insights into:
- Spending patterns
- Price trends
- Cost-saving opportunities
- Supplier performance

---

## SQL Queries for Key Analytics

### 1. Total Spend Summary

```sql
-- Get total spend for a user in a date range
SELECT 
  COUNT(DISTINCT i.id) as invoice_count,
  COUNT(DISTINCT i.supplier_id) as supplier_count,
  COUNT(DISTINCT il.product_id) as product_count,
  SUM(i.total_amount) as total_spend,
  AVG(i.total_amount) as avg_invoice_amount
FROM invoices i
LEFT JOIN invoice_lines il ON il.invoice_id = i.id
WHERE i.user_id = $1
  AND i.status IN ('PARSED', 'REVIEWED')
  AND i.invoice_date BETWEEN $2 AND $3
GROUP BY i.user_id;
```

### 2. Spend Over Time

```sql
-- Monthly spend trend
SELECT 
  DATE_TRUNC('month', i.invoice_date) as period,
  SUM(i.total_amount) as spend,
  COUNT(i.id) as invoice_count
FROM invoices i
WHERE i.user_id = $1
  AND i.status IN ('PARSED', 'REVIEWED')
  AND i.invoice_date BETWEEN $2 AND $3
GROUP BY DATE_TRUNC('month', i.invoice_date)
ORDER BY period ASC;

-- Weekly spend trend
SELECT 
  DATE_TRUNC('week', i.invoice_date) as period,
  SUM(i.total_amount) as spend,
  COUNT(i.id) as invoice_count
FROM invoices i
WHERE i.user_id = $1
  AND i.status IN ('PARSED', 'REVIEWED')
  AND i.invoice_date BETWEEN $2 AND $3
GROUP BY DATE_TRUNC('week', i.invoice_date)
ORDER BY period ASC;
```

### 3. Top Products by Spend

```sql
SELECT 
  p.id,
  p.name,
  p.category,
  p.pack_size,
  SUM(il.line_total) as total_spend,
  SUM(il.quantity) as total_quantity,
  AVG(il.unit_price) as avg_unit_price,
  COUNT(DISTINCT il.invoice_id) as invoice_count,
  COUNT(DISTINCT i.supplier_id) as supplier_count
FROM invoice_lines il
JOIN invoices i ON i.id = il.invoice_id
JOIN products p ON p.id = il.product_id
WHERE i.user_id = $1
  AND i.status IN ('PARSED', 'REVIEWED')
  AND i.invoice_date BETWEEN $2 AND $3
  AND il.product_id IS NOT NULL
GROUP BY p.id, p.name, p.category, p.pack_size
ORDER BY total_spend DESC
LIMIT $4;
```

### 4. Top Suppliers by Spend

```sql
SELECT 
  s.id,
  s.name,
  SUM(i.total_amount) as total_spend,
  COUNT(i.id) as invoice_count,
  COUNT(DISTINCT il.product_id) as product_count,
  AVG(i.total_amount) as avg_invoice_amount
FROM invoices i
JOIN suppliers s ON s.id = i.supplier_id
LEFT JOIN invoice_lines il ON il.invoice_id = i.id
WHERE i.user_id = $1
  AND i.status IN ('PARSED', 'REVIEWED')
  AND i.invoice_date BETWEEN $2 AND $3
GROUP BY s.id, s.name
ORDER BY total_spend DESC
LIMIT $4;
```

### 5. Price Changes Detection

```sql
-- Find significant price increases for products
WITH price_comparison AS (
  SELECT 
    ph.product_id,
    ph.supplier_id,
    ph.unit_price as current_price,
    ph.price_date as current_date,
    LAG(ph.unit_price) OVER (
      PARTITION BY ph.product_id, ph.supplier_id 
      ORDER BY ph.price_date
    ) as previous_price,
    LAG(ph.price_date) OVER (
      PARTITION BY ph.product_id, ph.supplier_id 
      ORDER BY ph.price_date
    ) as previous_date
  FROM price_history ph
  WHERE ph.price_date BETWEEN $1 AND $2
)
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.pack_size,
  s.id as supplier_id,
  s.name as supplier_name,
  pc.previous_price,
  pc.current_price,
  pc.current_price - pc.previous_price as change_amount,
  ROUND(
    ((pc.current_price - pc.previous_price) / pc.previous_price * 100)::numeric, 
    2
  ) as change_percent,
  pc.previous_date,
  pc.current_date
FROM price_comparison pc
JOIN products p ON p.id = pc.product_id
JOIN suppliers s ON s.id = pc.supplier_id
WHERE pc.previous_price IS NOT NULL
  AND pc.current_price > pc.previous_price
  AND ((pc.current_price - pc.previous_price) / pc.previous_price) >= ($3 / 100.0)
ORDER BY change_percent DESC
LIMIT $4;
```

### 6. Cost-Saving Opportunities

```sql
-- Find products where user could save by switching suppliers
WITH current_prices AS (
  -- Get most recent price per product per supplier
  SELECT DISTINCT ON (product_id, supplier_id)
    product_id,
    supplier_id,
    unit_price,
    price_date
  FROM price_history
  WHERE price_date >= NOW() - INTERVAL '90 days'
  ORDER BY product_id, supplier_id, price_date DESC
),
user_recent_purchases AS (
  -- Get user's recent purchases
  SELECT 
    il.product_id,
    i.supplier_id,
    AVG(il.unit_price) as avg_price,
    SUM(il.quantity) as total_quantity,
    MAX(i.invoice_date) as last_order_date
  FROM invoice_lines il
  JOIN invoices i ON i.id = il.invoice_id
  WHERE i.user_id = $1
    AND i.invoice_date >= NOW() - INTERVAL '90 days'
    AND i.status IN ('PARSED', 'REVIEWED')
    AND il.product_id IS NOT NULL
  GROUP BY il.product_id, i.supplier_id
),
better_prices AS (
  -- Find cheaper alternatives
  SELECT 
    urp.product_id,
    urp.supplier_id as current_supplier_id,
    urp.avg_price as current_price,
    urp.last_order_date,
    urp.total_quantity,
    cp.supplier_id as better_supplier_id,
    cp.unit_price as better_price,
    urp.avg_price - cp.unit_price as savings_per_unit,
    (urp.avg_price - cp.unit_price) * urp.total_quantity as estimated_savings
  FROM user_recent_purchases urp
  JOIN current_prices cp ON cp.product_id = urp.product_id
  WHERE cp.supplier_id != urp.supplier_id
    AND cp.unit_price < urp.avg_price
)
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.pack_size,
  cs.id as current_supplier_id,
  cs.name as current_supplier_name,
  bp.current_price,
  bp.last_order_date,
  bs.id as better_supplier_id,
  bs.name as better_supplier_name,
  bp.better_price,
  bp.savings_per_unit,
  ROUND(
    ((bp.current_price - bp.better_price) / bp.current_price * 100)::numeric,
    2
  ) as savings_percent,
  bp.estimated_savings,
  bp.total_quantity as based_on_quantity
FROM better_prices bp
JOIN products p ON p.id = bp.product_id
JOIN suppliers cs ON cs.id = bp.current_supplier_id
JOIN suppliers bs ON bs.id = bp.better_supplier_id
WHERE bp.estimated_savings >= $2
ORDER BY bp.estimated_savings DESC
LIMIT $3;
```

---

## Analytics Service Implementation

```typescript
// src/services/analytics/analytics.service.ts
export class AnalyticsService {
  constructor(
    private db: Database
  ) {}

  async getSummary(
    userId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<AnalyticsSummary> {
    const result = await this.db.query(
      `SELECT 
        COUNT(DISTINCT i.id) as invoice_count,
        COUNT(DISTINCT i.supplier_id) as supplier_count,
        COUNT(DISTINCT il.product_id) as product_count,
        COALESCE(SUM(i.total_amount), 0) as total_spend,
        COALESCE(AVG(i.total_amount), 0) as avg_invoice_amount
      FROM invoices i
      LEFT JOIN invoice_lines il ON il.invoice_id = i.id
      WHERE i.user_id = $1
        AND i.status IN ('PARSED', 'REVIEWED')
        AND i.invoice_date BETWEEN $2 AND $3`,
      [userId, fromDate, toDate]
    );

    const row = result.rows[0];

    // Get top supplier
    const topSupplier = await this.getTopSuppliers(userId, fromDate, toDate, 1);
    
    // Get top product
    const topProduct = await this.getTopProducts(userId, fromDate, toDate, 1);

    return {
      period: { from: fromDate, to: toDate },
      totalSpend: parseFloat(row.total_spend),
      invoiceCount: parseInt(row.invoice_count),
      supplierCount: parseInt(row.supplier_count),
      productCount: parseInt(row.product_count),
      averageInvoiceAmount: parseFloat(row.avg_invoice_amount),
      topSupplier: topSupplier[0] || null,
      topProduct: topProduct[0] || null,
    };
  }

  async getSpendOverTime(
    userId: string,
    fromDate: Date,
    toDate: Date,
    interval: 'day' | 'week' | 'month'
  ): Promise<Array<{ period: string; spend: number; invoiceCount: number }>> {
    const result = await this.db.query(
      `SELECT 
        DATE_TRUNC($4, i.invoice_date) as period,
        COALESCE(SUM(i.total_amount), 0) as spend,
        COUNT(i.id) as invoice_count
      FROM invoices i
      WHERE i.user_id = $1
        AND i.status IN ('PARSED', 'REVIEWED')
        AND i.invoice_date BETWEEN $2 AND $3
      GROUP BY DATE_TRUNC($4, i.invoice_date)
      ORDER BY period ASC`,
      [userId, fromDate, toDate, interval]
    );

    return result.rows.map(row => ({
      period: row.period.toISOString().split('T')[0],
      spend: parseFloat(row.spend),
      invoiceCount: parseInt(row.invoice_count),
    }));
  }

  // Additional methods: getTopProducts, getTopSuppliers, getPriceChanges, getOpportunities
  // (Implementation follows SQL queries above)
}
```
