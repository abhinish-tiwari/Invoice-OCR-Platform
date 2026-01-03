/**
 * Product Matching Service
 * Matches invoice line items to products using fuzzy matching
 */

import ProductRepository, { Product } from './product.repository';
import ProductAliasRepository from './product-alias.repository';
import { normalizeText, extractPackSize, calculateSimilarity } from '../../utils/text-utils';
import { logger } from '../../utils/logger';

export interface MatchResult {
  productId: string | null;
  productName: string | null;
  confidence: number;
  matchType: 'exact' | 'alias' | 'fuzzy' | 'none';
}

export interface MatchOptions {
  similarityThreshold?: number;
  boostPackSizeMatch?: boolean;
}

const DEFAULT_SIMILARITY_THRESHOLD = 0.7;

export default class ProductMatchingService {
  /**
   * Match a raw invoice line description to a product
   */
  static async matchProduct(
    rawDescription: string,
    options: MatchOptions = {}
  ): Promise<MatchResult> {
    const { 
      similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
      boostPackSizeMatch = true 
    } = options;

    const normalized = normalizeText(rawDescription);
    const packSize = extractPackSize(rawDescription);

    // 1. Try exact match on normalized name
    const exactMatch = await ProductRepository.findByNormalizedName(normalized);
    if (exactMatch) {
      logger.debug('Exact match found', { rawDescription, productId: exactMatch.id });
      return {
        productId: exactMatch.id,
        productName: exactMatch.name,
        confidence: 1.0,
        matchType: 'exact',
      };
    }

    // 2. Try alias lookup (learned from previous corrections)
    const aliasMatch = await ProductAliasRepository.findByNormalizedText(normalized);
    if (aliasMatch) {
      await ProductAliasRepository.incrementMatchCount(aliasMatch.id);
      const product = await ProductRepository.findById(aliasMatch.product_id);
      
      if (product) {
        logger.debug('Alias match found', { rawDescription, productId: product.id });
        return {
          productId: product.id,
          productName: product.name,
          confidence: 0.95,
          matchType: 'alias',
        };
      }
    }

    // 3. Try fuzzy matching
    const fuzzyMatch = await this.fuzzyMatch(normalized, packSize, {
      similarityThreshold,
      boostPackSizeMatch,
    });

    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // 4. No match found
    logger.debug('No match found', { rawDescription });
    return {
      productId: null,
      productName: null,
      confidence: 0,
      matchType: 'none',
    };
  }

  /**
   * Fuzzy match against existing products
   */
  private static async fuzzyMatch(
    normalizedDescription: string,
    packSize: string | null,
    options: MatchOptions
  ): Promise<MatchResult | null> {
    const { 
      similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
      boostPackSizeMatch = true 
    } = options;

    // Get all products
    const { products } = await ProductRepository.findAll({ limit: 1000 });

    let bestMatch: { product: Product; similarity: number } | null = null;

    for (const product of products) {
      const similarity = calculateSimilarity(normalizedDescription, product.normalized_name);

      // Boost similarity if pack sizes match
      let adjustedSimilarity = similarity;
      if (boostPackSizeMatch && packSize && product.pack_size) {
        if (this.comparePackSizes(packSize, product.pack_size)) {
          adjustedSimilarity = Math.min(1.0, similarity + 0.1);
        }
      }

      if (adjustedSimilarity >= similarityThreshold) {
        if (!bestMatch || adjustedSimilarity > bestMatch.similarity) {
          bestMatch = { product, similarity: adjustedSimilarity };
        }
      }
    }

    if (bestMatch) {
      logger.debug('Fuzzy match found', { 
        description: normalizedDescription, 
        productId: bestMatch.product.id,
        similarity: bestMatch.similarity 
      });

      return {
        productId: bestMatch.product.id,
        productName: bestMatch.product.name,
        confidence: bestMatch.similarity,
        matchType: 'fuzzy',
      };
    }

    return null;
  }

  /**
   * Compare pack sizes for equality
   */
  private static comparePackSizes(packSize1: string, packSize2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');
    return normalize(packSize1) === normalize(packSize2);
  }

  /**
   * Learn from a manual correction
   * Creates an alias so future matching is automatic
   */
  static async learnCorrection(
    rawDescription: string,
    productId: string
  ): Promise<void> {
    const normalized = normalizeText(rawDescription);

    // Verify product exists
    const product = await ProductRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create or update alias
    await ProductAliasRepository.findOrCreate({
      productId,
      rawText: rawDescription,
      normalizedText: normalized,
    });

    logger.info('Learned product correction', { rawDescription, productId });
  }

  /**
   * Match multiple descriptions in batch
   */
  static async matchBatch(
    descriptions: string[],
    options: MatchOptions = {}
  ): Promise<Map<string, MatchResult>> {
    const results = new Map<string, MatchResult>();

    for (const description of descriptions) {
      const result = await this.matchProduct(description, options);
      results.set(description, result);
    }

    return results;
  }

  /**
   * Get match suggestions for a description
   * Returns top N matches above threshold
   */
  static async getSuggestions(
    rawDescription: string,
    limit: number = 5,
    minConfidence: number = 0.5
  ): Promise<Array<{ product: Product; confidence: number }>> {
    const normalized = normalizeText(rawDescription);
    const packSize = extractPackSize(rawDescription);

    const { products } = await ProductRepository.findAll({ limit: 500 });
    const suggestions: Array<{ product: Product; confidence: number }> = [];

    for (const product of products) {
      let similarity = calculateSimilarity(normalized, product.normalized_name);

      // Boost if pack sizes match
      if (packSize && product.pack_size && this.comparePackSizes(packSize, product.pack_size)) {
        similarity = Math.min(1.0, similarity + 0.1);
      }

      if (similarity >= minConfidence) {
        suggestions.push({ product, confidence: similarity });
      }
    }

    // Sort by confidence descending and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }
}

