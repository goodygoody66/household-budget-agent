/**
 * Receipt Analysis Test Script
 * Analyzes receipt images and extracts purchase data for smart matching testing
 */

import { invokeLLM } from "./_core/llm";

export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

export interface ReceiptAnalysisResult {
  storeName: string;
  purchaseDate: string;
  items: ReceiptItem[];
  totalAmount: number;
  rawText: string;
}

/**
 * Analyze receipt image and extract purchase data
 */
export async function analyzeReceiptImage(
  imageUrl: string
): Promise<ReceiptAnalysisResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a receipt analyzer. Extract the following information from the receipt image:
1. Store name
2. Purchase date
3. All items purchased with:
   - Item name
   - Price (individual price, not total)
   - Category (e.g., 野菜, 肉, 魚, 乳製品, 調味料, etc.)
   - Quantity (if shown)
4. Total amount

Return the response in JSON format with this structure:
{
  "storeName": "store name",
  "purchaseDate": "YYYY-MM-DD",
  "items": [
    {
      "name": "item name",
      "price": price_number,
      "category": "category",
      "quantity": quantity_number
    }
  ],
  "totalAmount": total_number,
  "rawText": "raw extracted text from receipt"
}

Important:
- Extract ALL items from the receipt
- Use Japanese category names
- Price should be a number without currency symbol
- Be accurate with prices and categories`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ] as any,
        },
      ],
    });

    // Parse the response
    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    // Extract JSON from the response
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const result = JSON.parse(jsonMatch[0]) as ReceiptAnalysisResult;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Receipt analysis failed: ${errorMessage}`);
  }
}

/**
 * Normalize category names for consistency
 */
export function normalizeCategory(category: string): string {
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
 * Convert receipt items to purchase trend format
 */
export function convertReceiptItemsToPurchaseTrends(
  items: ReceiptItem[]
): Array<{
  itemName: string;
  category: string;
  averagePrice: number;
  purchaseCount: number;
}> {
  const trends: Record<
    string,
    {
      itemName: string;
      category: string;
      prices: number[];
      count: number;
    }
  > = {};

  for (const item of items) {
    const key = `${item.name}|${item.category}`;
    if (!trends[key]) {
      trends[key] = {
        itemName: item.name,
        category: normalizeCategory(item.category),
        prices: [],
        count: 0,
      };
    }
    trends[key].prices.push(item.price);
    trends[key].count++;
  }

  return Object.values(trends).map(trend => ({
    itemName: trend.itemName,
    category: trend.category,
    averagePrice:
      trend.prices.reduce((a, b) => a + b, 0) / trend.prices.length,
    purchaseCount: trend.count,
  }));
}
