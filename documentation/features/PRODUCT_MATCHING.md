# Product Matching & Normalization

## Overview

Product matching is critical for:
- Tracking price history across invoices
- Identifying cost-saving opportunities
- Generating accurate analytics

**Challenge:** Same product appears with variations:
- "TOMATOES ORG 1KG" vs "Organic Tomatoes 1kg" vs "TOM ORG 1KG"

---

## Matching Strategy

### Three-Tier Approach

```
1. Exact Match (normalized)
   ↓ (if no match)
2. Fuzzy Match (similarity threshold)
   ↓ (if no match)
3. Manual Review / Create New Product
```

---

## Implementation

### Product Matching Service

```typescript
// src/services/matching/product-matcher.service.ts
import { ProductRepository } from '../../repositories/product.repository';
import { normalizeText, extractPackSize, normalizeUnit } from '../../utils/text-utils';
import { levenshteinDistance } from '../../utils/string-similarity';

export class ProductMatcherService {
  private similarityThreshold = 0.80; // 80% similarity required

  constructor(
    private productRepo: ProductRepository
  ) {}

  /**
   * Match a raw invoice line description to a product
   */
  async matchProduct(rawDescription: string): Promise<{
    productId: string | null;
    confidence: number;
    matchType: 'exact' | 'fuzzy' | 'alias' | 'none';
  }> {
    const normalized = normalizeText(rawDescription);
    const packSize = extractPackSize(rawDescription);

    // 1. Try exact match on normalized name
    const exactMatch = await this.productRepo.findByNormalizedName(normalized);
    if (exactMatch) {
      return {
        productId: exactMatch.id,
        confidence: 1.0,
        matchType: 'exact',
      };
    }

    // 2. Try alias lookup (learned from previous corrections)
    const aliasMatch = await this.productRepo.findByAlias(normalized);
    if (aliasMatch) {
      // Increment match count for this alias
      await this.productRepo.incrementAliasCount(normalized);
      
      return {
        productId: aliasMatch.id,
        confidence: 0.95,
        matchType: 'alias',
      };
    }

    // 3. Try fuzzy matching
    const fuzzyMatch = await this.fuzzyMatch(normalized, packSize);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // 4. No match found
    return {
      productId: null,
      confidence: 0,
      matchType: 'none',
    };
  }

  /**
   * Fuzzy match against existing products
   */
  private async fuzzyMatch(
    normalized: string,
    packSize: string | null
  ): Promise<{
    productId: string;
    confidence: number;
    matchType: 'fuzzy';
  } | null> {
    // Get all products (with caching in production)
    const allProducts = await this.productRepo.findAll();

    let bestMatch: { product: any; similarity: number } | null = null;

    for (const product of allProducts) {
      const similarity = this.calculateSimilarity(
        normalized,
        product.normalizedName
      );

      // Boost similarity if pack sizes match
      let adjustedSimilarity = similarity;
      if (packSize && product.packSize) {
        const packSizeMatch = this.comparePackSizes(packSize, product.packSize);
        if (packSizeMatch) {
          adjustedSimilarity = Math.min(1.0, similarity + 0.1);
        }
      }

      if (adjustedSimilarity >= this.similarityThreshold) {
        if (!bestMatch || adjustedSimilarity > bestMatch.similarity) {
          bestMatch = { product, similarity: adjustedSimilarity };
        }
      }
    }

    if (bestMatch) {
      return {
        productId: bestMatch.product.id,
        confidence: bestMatch.similarity,
        matchType: 'fuzzy',
      };
    }

    return null;
  }

  /**
   * Calculate string similarity (0-1)
   * Uses Levenshtein distance normalized by length
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1.0;
    
    return 1 - (distance / maxLength);
  }

  /**
   * Compare pack sizes (handle unit conversions)
   */
  private comparePackSizes(size1: string, size2: string): boolean {
    const norm1 = normalizeUnit(size1);
    const norm2 = normalizeUnit(size2);

    if (!norm1 || !norm2) return false;
    if (norm1.unit !== norm2.unit) return false;

    // Allow 5% tolerance
    const diff = Math.abs(norm1.value - norm2.value);
    const tolerance = Math.max(norm1.value, norm2.value) * 0.05;

    return diff <= tolerance;
  }

  /**
   * Create product alias after manual correction
   */
  async learnFromCorrection(
    rawText: string,
    productId: string
  ): Promise<void> {
    const normalized = normalizeText(rawText);
    
    await this.productRepo.createOrUpdateAlias({
      productId,
      rawText,
      normalizedText: normalized,
    });
  }
}
```

---

## String Similarity Utility

```typescript
// src/utils/string-similarity.ts

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create 2D array
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Alternative: Jaro-Winkler similarity (better for short strings)
 */
export function jaroWinklerSimilarity(str1: string, str2: string): number {
  // Implementation omitted for brevity
  // Use library like 'string-similarity' or 'natural' in production
  return 0;
}
```

---

## Product Catalog Management

### Auto-Creation Strategy

When no match is found:

```typescript
async handleUnmatchedProduct(
  invoiceLineId: string,
  rawDescription: string,
  packSize: string | null
): Promise<void> {
  // Mark line item as needing review
  await this.invoiceLineRepo.update(invoiceLineId, {
    needsReview: true,
    productId: null,
  });

  // Optionally: Create a "pending" product for admin to review
  const normalized = normalizeText(rawDescription);
  
  const pendingProduct = await this.productRepo.create({
    name: rawDescription,
    normalizedName: normalized,
    packSize,
    category: 'UNCATEGORIZED',
    metadata: {
      status: 'PENDING_REVIEW',
      firstSeenInvoiceLineId: invoiceLineId,
    },
  });

  // Link to invoice line
  await this.invoiceLineRepo.update(invoiceLineId, {
    productId: pendingProduct.id,
  });
}
```

---

## Admin Correction Workflow

### API Endpoint: POST /admin/invoices/:id/corrections

```typescript
// src/controllers/admin.controller.ts
async submitCorrections(req: Request, res: Response) {
  const { id: invoiceId } = req.params;
  const { lineItems } = req.body;

  for (const lineItem of lineItems) {
    // Update line item with corrected product mapping
    await this.invoiceLineRepo.update(lineItem.id, {
      productId: lineItem.productId,
      quantity: lineItem.quantity,
      unitPrice: lineItem.unitPrice,
      lineTotal: lineItem.lineTotal,
      reviewed: true,
      needsReview: false,
    });

    // Learn from correction: create alias
    if (lineItem.productId) {
      const line = await this.invoiceLineRepo.findById(lineItem.id);
      await this.productMatcher.learnFromCorrection(
        line.rawDescription,
        lineItem.productId
      );
    }

    // Update price history
    await this.priceHistoryService.recordPrice({
      productId: lineItem.productId,
      supplierId: invoice.supplierId,
      unitPrice: lineItem.unitPrice,
      packSize: lineItem.packSize,
      priceDate: invoice.invoiceDate,
      invoiceLineId: lineItem.id,
    });
  }

  // Mark invoice as reviewed
  await this.invoiceRepo.update(invoiceId, {
    status: 'REVIEWED',
    reviewedBy: req.user.id,
    reviewedAt: new Date(),
  });

  res.json({ message: 'Corrections saved successfully' });
}
```

---

## Price History Tracking

### Recording Prices

```typescript
// src/services/price-history.service.ts
export class PriceHistoryService {
  async recordPrice(data: {
    productId: string;
    supplierId: string;
    unitPrice: number;
    packSize: string | null;
    priceDate: Date;
    invoiceLineId: string;
  }): Promise<void> {
    // Check if price already exists for this date
    const existing = await this.priceHistoryRepo.findByProductSupplierDate(
      data.productId,
      data.supplierId,
      data.priceDate,
      data.packSize
    );

    if (existing) {
      // Update if different
      if (existing.unitPrice !== data.unitPrice) {
        await this.priceHistoryRepo.update(existing.id, {
          unitPrice: data.unitPrice,
          invoiceLineId: data.invoiceLineId,
        });
      }
    } else {
      // Create new price record
      await this.priceHistoryRepo.create(data);
    }
  }

  /**
   * Get price trend for a product from a supplier
   */
  async getPriceTrend(
    productId: string,
    supplierId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<Array<{ date: Date; price: number }>> {
    return this.priceHistoryRepo.findPricesByDateRange(
      productId,
      supplierId,
      fromDate,
      toDate
    );
  }
}
```

---

## Optimization: Caching

For production, cache product catalog in memory:

```typescript
// src/services/matching/product-cache.service.ts
export class ProductCacheService {
  private cache: Map<string, any> = new Map();
  private aliasCache: Map<string, string> = new Map(); // normalized -> productId
  private lastRefresh: Date | null = null;
  private refreshIntervalMs = 5 * 60 * 1000; // 5 minutes

  async getProduct(normalizedName: string): Promise<any | null> {
    await this.ensureFresh();
    return this.cache.get(normalizedName) || null;
  }

  async getProductByAlias(normalized: string): Promise<any | null> {
    await this.ensureFresh();
    const productId = this.aliasCache.get(normalized);
    if (!productId) return null;
    
    return Array.from(this.cache.values()).find(p => p.id === productId) || null;
  }

  private async ensureFresh(): Promise<void> {
    if (
      !this.lastRefresh ||
      Date.now() - this.lastRefresh.getTime() > this.refreshIntervalMs
    ) {
      await this.refresh();
    }
  }

  private async refresh(): Promise<void> {
    const products = await this.productRepo.findAll();
    const aliases = await this.productRepo.findAllAliases();

    this.cache.clear();
    this.aliasCache.clear();

    for (const product of products) {
      this.cache.set(product.normalizedName, product);
    }

    for (const alias of aliases) {
      this.aliasCache.set(alias.normalizedText, alias.productId);
    }

    this.lastRefresh = new Date();
  }
}
```
