/**
 * Real Data Analysis V2 - 複数店舗・ユニット情報対応版
 * 商品の単位情報と複数店舗のチラシに対応
 */

export interface ProductUnit {
  name: string;
  unit: string; // "個", "パック", "本", "g", "ml", "kg" など
  quantity?: number; // 例: "200g", "3個パック" など
}

export interface FlyerItem {
  name: string;
  unit: string;
  quantity?: number;
  salePrice: number;
  regularPrice: number;
  storeName: string;
  storeId: string;
  category: string;
}

export interface ReceiptItem {
  name: string;
  unit: string;
  quantity?: number;
  price: number;
  category: string;
}

export interface RealAnalysisResultV2 {
  receiptItems: ReceiptItem[];
  flyerItems: FlyerItem[];
  matchedItems: Array<{
    itemName: string;
    unit: string;
    quantity?: number;
    receiptPrice: number;
    receiptStore: string;
    flyerPrice: number;
    flyerStore: string;
    flyerStoreId: string;
    savings: number;
    savingsPercentage: number;
  }>;
  totalSavings: number;
  totalMatches: number;
  storesIncluded: Array<{ storeId: string; storeName: string }>;
}

/**
 * 複数店舗・ユニット情報対応の実データ分析を実行
 */
export function analyzeRealDataV2(): RealAnalysisResultV2 {
  // 複数店舗のチラシ情報
  const flyerItems: FlyerItem[] = [
    // バロー千音寺店
    { name: "トマト", unit: "個", quantity: 1, salePrice: 198, regularPrice: 298, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "野菜" },
    { name: "キャベツ", unit: "個", quantity: 1, salePrice: 128, regularPrice: 198, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "野菜" },
    { name: "玉ねぎ", unit: "kg", quantity: 1, salePrice: 98, regularPrice: 148, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "野菜" },
    { name: "牛肉", unit: "g", quantity: 100, salePrice: 980, regularPrice: 1280, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "肉" },
    { name: "豚肉", unit: "g", quantity: 100, salePrice: 680, regularPrice: 880, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "肉" },
    { name: "鶏肉", unit: "g", quantity: 100, salePrice: 480, regularPrice: 680, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "肉" },
    { name: "牛乳", unit: "ml", quantity: 1000, salePrice: 198, regularPrice: 248, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "乳製品" },
    { name: "ヨーグルト", unit: "個", quantity: 1, salePrice: 128, regularPrice: 178, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "乳製品" },
    { name: "チーズ", unit: "g", quantity: 200, salePrice: 298, regularPrice: 398, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "乳製品" },
    { name: "食パン", unit: "本", quantity: 1, salePrice: 198, regularPrice: 268, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "パン" },
    { name: "卵", unit: "個", quantity: 10, salePrice: 198, regularPrice: 248, storeName: "バロー千音寺店", storeId: "baro_sennonji", category: "卵" },
    
    // クスリのアオキ野田店
    { name: "トマト", unit: "個", quantity: 1, salePrice: 228, regularPrice: 298, storeName: "クスリのアオキ野田店", storeId: "aoki_noda", category: "野菜" },
    { name: "キャベツ", unit: "個", quantity: 1, salePrice: 148, regularPrice: 198, storeName: "クスリのアオキ野田店", storeId: "aoki_noda", category: "野菜" },
    { name: "牛肉", unit: "g", quantity: 100, salePrice: 1080, regularPrice: 1280, storeName: "クスリのアオキ野田店", storeId: "aoki_noda", category: "肉" },
    { name: "豚肉", unit: "g", quantity: 100, salePrice: 780, regularPrice: 880, storeName: "クスリのアオキ野田店", storeId: "aoki_noda", category: "肉" },
    { name: "牛乳", unit: "ml", quantity: 1000, salePrice: 218, regularPrice: 248, storeName: "クスリのアオキ野田店", storeId: "aoki_noda", category: "乳製品" },
    { name: "食パン", unit: "本", quantity: 1, salePrice: 218, regularPrice: 268, storeName: "クスリのアオキ野田店", storeId: "aoki_noda", category: "パン" },
  ];

  // クスリのアオキ野田店のレシート購買品目
  const receiptItems: ReceiptItem[] = [
    { name: "トマト", unit: "個", quantity: 1, price: 298, category: "野菜" },
    { name: "キャベツ", unit: "個", quantity: 1, price: 198, category: "野菜" },
    { name: "牛肉", unit: "g", quantity: 100, price: 1280, category: "肉" },
    { name: "豚肉", unit: "g", quantity: 100, price: 880, category: "肉" },
    { name: "牛乳", unit: "ml", quantity: 1000, price: 248, category: "乳製品" },
    { name: "ヨーグルト", unit: "個", quantity: 1, price: 178, category: "乳製品" },
    { name: "食パン", unit: "本", quantity: 1, price: 268, category: "パン" },
    { name: "卵", unit: "個", quantity: 10, price: 248, category: "卵" },
    { name: "バター", unit: "g", quantity: 200, price: 398, category: "乳製品" },
    { name: "ハム", unit: "g", quantity: 100, price: 480, category: "加工肉" },
  ];

  // マッチング処理
  const matchedItems: RealAnalysisResultV2["matchedItems"] = [];

  for (const receiptItem of receiptItems) {
    // 商品名とユニットが一致するチラシ商品を検索
    const matchedFlyerItems = flyerItems.filter(
      (f) =>
        f.name === receiptItem.name &&
        f.unit === receiptItem.unit &&
        f.category === receiptItem.category &&
        f.salePrice < receiptItem.price
    );

    // 最も安い店舗を選択
    if (matchedFlyerItems.length > 0) {
      const bestMatch = matchedFlyerItems.reduce((prev, current) =>
        current.salePrice < prev.salePrice ? current : prev
      );

      const savings = receiptItem.price - bestMatch.salePrice;
      const savingsPercentage = (savings / receiptItem.price) * 100;

      matchedItems.push({
        itemName: receiptItem.name,
        unit: receiptItem.unit,
        quantity: receiptItem.quantity,
        receiptPrice: receiptItem.price,
        receiptStore: "クスリのアオキ野田店",
        flyerPrice: bestMatch.salePrice,
        flyerStore: bestMatch.storeName,
        flyerStoreId: bestMatch.storeId,
        savings,
        savingsPercentage: Math.round(savingsPercentage * 10) / 10,
      });
    }
  }

  // 節約額でソート（降順）
  matchedItems.sort((a, b) => b.savings - a.savings);

  const totalSavings = matchedItems.reduce((sum, item) => sum + item.savings, 0);

  // 含まれる店舗の一覧を取得
  const storesIncluded = Array.from(
    new Map(
      matchedItems.map((item) => [
        item.flyerStoreId,
        { storeId: item.flyerStoreId, storeName: item.flyerStore },
      ])
    ).values()
  );

  return {
    receiptItems,
    flyerItems,
    matchedItems,
    totalSavings,
    totalMatches: matchedItems.length,
    storesIncluded,
  };
}
