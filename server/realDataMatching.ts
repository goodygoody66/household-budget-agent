/**
 * Real Data Matching - レシート・チラシマッチング統合機能
 */

export interface RealPurchaseItem {
  name: string;
  category: string;
  purchasePrice: number;
  purchaseDate: string;
  quantity: number;
}

export interface RealFlyerItem {
  name: string;
  category: string;
  salePrice: number;
  regularPrice?: number;
  discountPercent?: number;
  storeName: string;
  flyerDate: string;
}

export interface RealMatchingResult {
  purchaseItem: RealPurchaseItem;
  flyerItem: RealFlyerItem;
  savingsAmount: number;
  savingsPercent: number;
  matchScore: number;
}

export interface RealMatchingReport {
  userId: string;
  generatedAt: string;
  totalSavings: number;
  matchedItems: RealMatchingResult[];
  excludedCategories: string[];
  reportSummary: string;
}

// テストデータ：実際のレシート購買情報
export const TEST_PURCHASE_DATA: RealPurchaseItem[] = [
  { name: "牛乳", category: "乳製品", purchasePrice: 198, purchaseDate: "2026-02-20", quantity: 1 },
  { name: "食パン", category: "パン", purchasePrice: 258, purchaseDate: "2026-02-20", quantity: 1 },
  { name: "卵", category: "卵", purchasePrice: 168, purchaseDate: "2026-02-20", quantity: 1 },
  { name: "チーズ", category: "乳製品", purchasePrice: 278, purchaseDate: "2026-02-20", quantity: 1 },
  { name: "ハム", category: "加工肉", purchasePrice: 198, purchaseDate: "2026-02-20", quantity: 1 },
  { name: "バター", category: "乳製品", purchasePrice: 238, purchaseDate: "2026-02-20", quantity: 1 },
  { name: "キャベツ", category: "野菜", purchasePrice: 168, purchaseDate: "2026-02-18", quantity: 1 },
  { name: "トマト", category: "野菜", purchasePrice: 198, purchaseDate: "2026-02-18", quantity: 1 },
  { name: "玉ねぎ", category: "野菜", purchasePrice: 128, purchaseDate: "2026-02-18", quantity: 1 },
  { name: "豚肉", category: "肉", purchasePrice: 598, purchaseDate: "2026-02-18", quantity: 1 },
  { name: "ビタミンC", category: "医薬品", purchasePrice: 880, purchaseDate: "2026-02-15", quantity: 1 },
  { name: "風邪薬", category: "医薬品", purchasePrice: 1280, purchaseDate: "2026-02-15", quantity: 1 },
  { name: "シャンプー", category: "日用品", purchasePrice: 598, purchaseDate: "2026-02-15", quantity: 1 },
  { name: "歯磨き粉", category: "日用品", purchasePrice: 298, purchaseDate: "2026-02-11", quantity: 1 },
  { name: "ティッシュ", category: "日用品", purchasePrice: 228, purchaseDate: "2026-02-11", quantity: 1 },
];

// テストデータ：チラシ掲載商品
export const TEST_FLYER_DATA: RealFlyerItem[] = [
  { name: "牛乳", category: "乳製品", salePrice: 148, regularPrice: 198, discountPercent: 25, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "食パン", category: "パン", salePrice: 198, regularPrice: 258, discountPercent: 23, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "チーズ", category: "乳製品", salePrice: 228, regularPrice: 278, discountPercent: 18, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "ハム", category: "加工肉", salePrice: 158, regularPrice: 198, discountPercent: 20, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "キャベツ", category: "野菜", salePrice: 98, regularPrice: 168, discountPercent: 42, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "トマト", category: "野菜", salePrice: 148, regularPrice: 198, discountPercent: 25, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "玉ねぎ", category: "野菜", salePrice: 78, regularPrice: 128, discountPercent: 39, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "豚肉", category: "肉", salePrice: 398, regularPrice: 598, discountPercent: 33, storeName: "バロー千音寺店", flyerDate: "2026-02-14" },
  { name: "ビタミンC", category: "医薬品", salePrice: 680, regularPrice: 880, discountPercent: 23, storeName: "クスリのアオキ野田店", flyerDate: "2026-02-11" },
  { name: "シャンプー", category: "日用品", salePrice: 398, regularPrice: 598, discountPercent: 33, storeName: "クスリのアオキ野田店", flyerDate: "2026-02-11" },
  { name: "歯磨き粉", category: "日用品", salePrice: 198, regularPrice: 298, discountPercent: 34, storeName: "クスリのアオキ野田店", flyerDate: "2026-02-11" },
  { name: "ティッシュ", category: "日用品", salePrice: 178, regularPrice: 228, discountPercent: 22, storeName: "クスリのアオキ野田店", flyerDate: "2026-02-11" },
];

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  const editDistance = getEditDistance(longer, shorter);
  return 1 - editDistance / longer.length;
}

function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  
  return costs[s2.length];
}

export function generateRealMatchingReport(): RealMatchingReport {
  const matchedItems: RealMatchingResult[] = [];
  const purchasedCategories = new Set<string>();
  
  TEST_PURCHASE_DATA.forEach(item => {
    purchasedCategories.add(item.category);
  });
  
  TEST_PURCHASE_DATA.forEach((purchaseItem) => {
    let bestMatch: RealFlyerItem | null = null;
    let bestSimilarity: number = 0;
    
    TEST_FLYER_DATA.forEach(flyerItem => {
      if (purchaseItem.category !== flyerItem.category) return;
      
      const similarity = calculateSimilarity(purchaseItem.name, flyerItem.name);
      
      if (similarity >= 0.7 && similarity > bestSimilarity) {
        bestMatch = flyerItem;
        bestSimilarity = similarity;
      }
    });
    
    if (bestMatch !== null) {
      const savingsAmount = purchaseItem.purchasePrice - (bestMatch as RealFlyerItem).salePrice;
      
      if (savingsAmount > 0) {
        matchedItems.push({
          purchaseItem,
          flyerItem: bestMatch,
          savingsAmount,
          savingsPercent: Math.round((savingsAmount / purchaseItem.purchasePrice) * 100),
          matchScore: bestSimilarity,
        });
      }
    }
  });
  
  const allCategories = new Set<string>();
  TEST_FLYER_DATA.forEach(item => allCategories.add(item.category));
  const excludedCategories = Array.from(allCategories).filter(
    cat => !purchasedCategories.has(cat)
  );
  
  const totalSavings = matchedItems.reduce((sum, item) => sum + item.savingsAmount, 0);
  
  const topItems = matchedItems
    .sort((a, b) => b.savingsAmount - a.savingsAmount)
    .slice(0, 5);
  
  const reportSummary = `
【家計防衛エージェント - リアルマッチング分析結果】

購買データとチラシ情報のマッチング分析が完了しました。

【マッチング結果】
- マッチ商品数: ${matchedItems.length}件
- 総節約可能額: ¥${totalSavings}

【安くなっている商品 TOP 5】
${topItems
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.purchaseItem.name}
   購買価格: ¥${item.purchaseItem.purchasePrice} → セール価格: ¥${item.flyerItem.salePrice}
   節約額: ¥${item.savingsAmount} (${item.savingsPercent}%割引)
   店舗: ${item.flyerItem.storeName}`
  )
  .join("\n\n")}

【除外カテゴリー】
購買実績がないため除外: ${excludedCategories.join(", ") || "なし"}
  `.trim();
  
  return {
    userId: "test-user",
    generatedAt: new Date().toISOString(),
    totalSavings,
    matchedItems,
    excludedCategories,
    reportSummary,
  };
}
