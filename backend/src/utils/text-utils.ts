/**
 * Text Utility Functions
 * For normalizing and processing text from OCR results
 */

/**
 * Normalize text for matching purposes
 * - Lowercase
 * - Remove extra whitespace
 * - Remove special characters
 * - Trim
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim();
}

/**
 * Extract pack size from product description
 * Examples: "12x500ml", "6 pack", "24/CS", "1 kg"
 */
export function extractPackSize(text: string): string | null {
  if (!text) return null;

  // Common pack size patterns
  const patterns = [
    /(\d+)\s*[xX]\s*(\d+)\s*(ml|l|g|kg|oz|lb)/i,  // 12x500ml
    /(\d+)\s*(pack|pk|case|cs|box|ct|count)/i,     // 6 pack, 24 case
    /(\d+)\s*\/\s*(cs|case|pk|pack)/i,             // 24/CS
    /(\d+)\s*(ml|l|g|kg|oz|lb|gal|gallon)/i,       // 1 kg, 500ml
    /(\d+)\s*-\s*(pack|pk)/i,                       // 12-pack
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].toLowerCase().replace(/\s+/g, '');
    }
  }

  return null;
}

/**
 * Parse quantity from text
 * Handles various formats: "12", "12.5", "1 1/2", etc.
 */
export function parseQuantity(text: string): number | null {
  if (!text) return null;

  // Clean the text
  const cleaned = text.replace(/,/g, '').trim();

  // Try simple number
  const simple = parseFloat(cleaned);
  if (!isNaN(simple)) {
    return simple;
  }

  // Try fraction format (e.g., "1 1/2")
  const fractionMatch = cleaned.match(/^(\d+)?\s*(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const whole = fractionMatch[1] ? parseInt(fractionMatch[1], 10) : 0;
    const numerator = parseInt(fractionMatch[2], 10);
    const denominator = parseInt(fractionMatch[3], 10);
    if (denominator !== 0) {
      return whole + numerator / denominator;
    }
  }

  return null;
}

/**
 * Parse currency amount from text
 * Handles: "$12.99", "12.99", "$1,234.56", etc.
 */
export function parseAmount(text: string): number | null {
  if (!text) return null;

  // Remove currency symbols and commas
  const cleaned = text.replace(/[$€£¥,]/g, '').trim();

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns value between 0 (no match) and 1 (perfect match)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Clean and standardize unit strings
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return '';
  
  const unitMap: Record<string, string> = {
    'ea': 'each',
    'pc': 'piece',
    'pcs': 'piece',
    'cs': 'case',
    'bx': 'box',
    'pk': 'pack',
    'dz': 'dozen',
    'lb': 'pound',
    'oz': 'ounce',
    'gal': 'gallon',
    'qt': 'quart',
    'pt': 'pint',
    'l': 'liter',
    'ml': 'milliliter',
    'kg': 'kilogram',
    'g': 'gram',
  };

  const normalized = unit.toLowerCase().trim();
  return unitMap[normalized] || normalized;
}

