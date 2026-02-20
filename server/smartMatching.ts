/**
 * Smart Matching Logic
 * Compares flyer items with user purchase history and identifies deals
 */

export interface FlyerItem {
  name: string;
  regularPrice?: number | null;
  salePrice: number;
  discount?: number | null;
  category: string;
}

export interface PurchasedItem {
  itemName: string;
  category: string;
  averagePrice?: number | null;
  purchaseCount: number;
}

export interface SmartMatchResult {
  matchedItems: Array<{
    itemName: string;
    category: string;
    regularPrice?: number | null;
    salePrice: number;
    discount?: number | null;
    userAveragePrice?: number | null;
    savingsAmount: number;
    savingsPercentage: number;
    purchaseFrequency: number;
    matchScore: number;
  }>;
  excludedCategories: string[];
  totalSavings: number;
  matchedCount: number;
}

/**
 * Analyze flyer items against user's purchase history
 * Returns only items where:
 * 1. User has purchased the category before
 * 2. Sale price is lower than user's average purchase price
 * 3. Excludes categories user has never purchased
 */
export function analyzeSmartMatching(
  flyerItems: FlyerItem[],
  purchasedItems: PurchasedItem[],
  allChirashiCategories: string[]
): SmartMatchResult {
  // Get categories user has purchased
  const purchasedCategories = new Set(purchasedItems.map(item => item.category));

  // Get all categories in the flyer
  const flyerCategories = new Set(flyerItems.map(item => item.category));

  // Find excluded categories (in flyer but not purchased by user)
  const excludedCategories = Array.from(flyerCategories).filter(
    cat => !purchasedCategories.has(cat)
  );

  // Create a map of purchased items by category for quick lookup
  const purchaseMap = new Map<string, PurchasedItem[]>();
  purchasedItems.forEach(item => {
    const key = item.category;
    if (!purchaseMap.has(key)) {
      purchaseMap.set(key, []);
    }
    purchaseMap.get(key)!.push(item);
  });

  // Match flyer items with purchase history
  const matchedItems = [];
  let totalSavings = 0;

  for (const flyerItem of flyerItems) {
    // Skip if category not in purchase history
    if (!purchasedCategories.has(flyerItem.category)) {
      continue;
    }

    // Get purchased items in this category
    const purchasedInCategory = purchaseMap.get(flyerItem.category) || [];

    // Find best matching purchased item by name similarity
    const matchedPurchase = findBestMatch(flyerItem.name, purchasedInCategory);

    if (!matchedPurchase) {
      continue;
    }

    // Calculate savings
    const userAveragePrice = matchedPurchase.averagePrice
      ? parseFloat(matchedPurchase.averagePrice.toString())
      : flyerItem.regularPrice || flyerItem.salePrice;

    const savingsAmount = userAveragePrice - flyerItem.salePrice;

    // Only include if sale price is lower than user's average
    if (savingsAmount <= 0) {
      continue;
    }

    const savingsPercentage = (savingsAmount / userAveragePrice) * 100;

    // Calculate match score based on:
    // - Purchase frequency (higher = better match)
    // - Savings percentage (higher = better deal)
    // - Price difference (higher = more valuable)
    const frequencyScore = Math.min(100, matchedPurchase.purchaseCount * 10);
    const savingsScore = Math.min(100, savingsPercentage * 2);
    const matchScore = (frequencyScore * 0.6 + savingsScore * 0.4);

    matchedItems.push({
      itemName: flyerItem.name,
      category: flyerItem.category,
      regularPrice: flyerItem.regularPrice,
      salePrice: flyerItem.salePrice,
      discount: flyerItem.discount,
      userAveragePrice: userAveragePrice,
      savingsAmount: savingsAmount,
      savingsPercentage: savingsPercentage,
      purchaseFrequency: matchedPurchase.purchaseCount,
      matchScore: Math.round(matchScore),
    });

    totalSavings += savingsAmount;
  }

  // Sort by match score (highest first)
  matchedItems.sort((a, b) => b.matchScore - a.matchScore);

  return {
    matchedItems,
    excludedCategories: excludedCategories.sort(),
    totalSavings: Math.round(totalSavings * 100) / 100,
    matchedCount: matchedItems.length,
  };
}

/**
 * Find the best matching purchased item by name similarity
 */
function findBestMatch(
  flyerItemName: string,
  purchasedItems: PurchasedItem[]
): PurchasedItem | null {
  if (purchasedItems.length === 0) return null;

  // Normalize names for comparison
  const normalizedFlyerName = normalizeItemName(flyerItemName);

  let bestMatch: PurchasedItem | null = null;
  let bestScore = 0;

  for (const purchased of purchasedItems) {
    const normalizedPurchasedName = normalizeItemName(purchased.itemName);

    // Calculate similarity score
    const score = calculateSimilarity(normalizedFlyerName, normalizedPurchasedName);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = purchased;
    }
  }

  // Only return match if similarity is above threshold (50%)
  return bestScore >= 0.5 ? bestMatch : null;
}

/**
 * Normalize item name for comparison
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getLevenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function getLevenshteinDistance(str1: string, str2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= str1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= str2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (str1.charAt(i - 1) !== str2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[str2.length] = lastValue;
  }

  return costs[str2.length];
}
