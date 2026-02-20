/**
 * Receipt and Flyer Matching Integration
 * Matches receipt purchase data with flyer sale items to identify savings opportunities
 */

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix: number[][] = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(0));

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

export interface FlyerItem {
  name: string;
  regularPrice?: number;
  salePrice: number;
  discountPercentage?: number;
  category: string;
  storeName: string;
  salePeriod?: string;
}

export interface MatchedItem {
  receiptItem: ReceiptItem;
  flyerItem: FlyerItem;
  similarity: number;
  savingsAmount: number;
  savingsPercentage: number;
}

export interface MatchingResult {
  matchedItems: MatchedItem[];
  excludedCategories: string[];
  totalSavings: number;
  totalItems: number;
}

/**
 * Normalize category names for consistent matching
 */
function normalizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    "野菜": "野菜",
    "肉": "肉",
    "魚": "魚",
    "シーフード": "魚",
    "乳製品": "乳製品",
    "チーズ": "乳製品",
    "ヨーグルト": "乳製品",
    "調味料": "調味料",
    "油": "調味料",
    "塩": "調味料",
    "醤油": "調味料",
    "パン": "パン",
    "米": "穀類",
    "麺": "穀類",
    "パスタ": "穀類",
    "飲料": "飲料",
    "お茶": "飲料",
    "コーヒー": "飲料",
    "ジュース": "飲料",
    "水": "飲料",
    "お菓子": "お菓子",
    "スナック": "お菓子",
    "チョコレート": "お菓子",
    "冷凍食品": "冷凍食品",
    "デザート": "デザート",
    "アイスクリーム": "デザート",
  };

  const normalized = category.trim().toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key.toLowerCase())) {
      return value;
    }
  }

  return category;
}

/**
 * Match receipt items with flyer items
 * Returns matched items where savings are possible
 */
export function matchReceiptWithFlyer(
  receiptItems: ReceiptItem[],
  flyerItems: FlyerItem[],
  similarityThreshold: number = 0.6
): MatchingResult {
  const matchedItems: MatchedItem[] = [];
  const purchasedCategories = new Set(
    receiptItems.map(item => normalizeCategory(item.category))
  );

  // Get all flyer categories
  const flyerCategories = new Set(
    flyerItems.map(item => normalizeCategory(item.category))
  );

  // Find excluded categories (in flyer but not purchased)
  const excludedCategories = Array.from(flyerCategories).filter(
    cat => !purchasedCategories.has(cat)
  );

  // Match items
  for (const receiptItem of receiptItems) {
    const normalizedReceiptCategory = normalizeCategory(receiptItem.category);

    for (const flyerItem of flyerItems) {
      const normalizedFlyerCategory = normalizeCategory(flyerItem.category);

      // Only match items in same category
      if (normalizedReceiptCategory !== normalizedFlyerCategory) {
        continue;
      }

      // Calculate name similarity
      const similarity = calculateStringSimilarity(
        receiptItem.name,
        flyerItem.name
      );

      if (similarity < similarityThreshold) {
        continue;
      }

      // Calculate savings
      const savingsAmount = receiptItem.price - flyerItem.salePrice;
      const savingsPercentage =
        (savingsAmount / receiptItem.price) * 100;

      // Only include if there's actual savings
      if (savingsAmount > 0) {
        matchedItems.push({
          receiptItem,
          flyerItem,
          similarity,
          savingsAmount,
          savingsPercentage,
        });
      }
    }
  }

  // Sort by savings amount (descending)
  matchedItems.sort((a, b) => b.savingsAmount - a.savingsAmount);

  // Calculate total savings
  const totalSavings = matchedItems.reduce(
    (sum, item) => sum + item.savingsAmount,
    0
  );

  return {
    matchedItems,
    excludedCategories,
    totalSavings,
    totalItems: matchedItems.length,
  };
}

/**
 * Generate matching report
 */
export function generateMatchingReport(
  result: MatchingResult
): {
  summary: string;
  details: string;
  recommendations: string[];
} {
  const summary = `
マッチング分析結果：
- マッチした商品数：${result.totalItems}件
- 合計節約額：¥${result.totalSavings.toLocaleString()}
- 除外カテゴリー数：${result.excludedCategories.length}件
  `;

  const details = result.matchedItems
    .map(
      item =>
        `${item.receiptItem.name}: ¥${item.receiptItem.price} → ¥${item.flyerItem.salePrice} (節約額: ¥${item.savingsAmount.toFixed(0)})`
    )
    .join("\n");

  const recommendations: string[] = [];

  if (result.excludedCategories.length > 0) {
    recommendations.push(
      `以下のカテゴリーは購買実績がないため分析から除外しました: ${result.excludedCategories.join(", ")}`
    );
  }

  if (result.totalSavings > 0) {
    recommendations.push(
      `合計¥${result.totalSavings.toLocaleString()}の節約が可能です`
    );
  }

  if (result.matchedItems.length === 0) {
    recommendations.push("現在、マッチした商品はありません");
  }

  return {
    summary: summary.trim(),
    details,
    recommendations,
  };
}
