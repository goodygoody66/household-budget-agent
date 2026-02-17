import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { flyers, InsertFlyer } from "../drizzle/schema";

/**
 * チラシ監視・解析機能
 * トクバイ・Shufoo!のチラシをスクレイピングして、商品情報を抽出
 */

interface FlyerData {
  storeName: string;
  storeId: string;
  flyerUrl: string;
  flyerImageUrl?: string;
  flyerDate: Date;
  source: "tokubai" | "shufoo";
}

interface ExtractedProduct {
  productName: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  description?: string;
}

/**
 * チラシ画像からLLMを使用して商品情報を抽出
 */
export async function extractProductsFromFlyerImage(
  flyerImageUrl: string,
  storeName: string
): Promise<ExtractedProduct[]> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that extracts product information from supermarket flyers and chirashi (チラシ).
Extract the following information from the flyer image:
- Product name (商品名)
- Price (価格)
- Original price if on sale (元の価格)
- Discount percentage if available (割引率)
- Product category (カテゴリ)
- Any special notes or descriptions (説明)

Return the information as a JSON array of products.
Format: [{"productName": "...", "price": 100, "originalPrice": 150, "discount": 33, "category": "...", "description": "..."}]`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please extract all products from this ${storeName} flyer image. Focus on items that are on sale or discounted.`,
            },
            {
              type: "image_url",
              image_url: {
                url: flyerImageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "flyer_products",
          strict: true,
          schema: {
            type: "object",
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    productName: { type: "string" },
                    price: { type: "number" },
                    originalPrice: { type: "number" },
                    discount: { type: "number" },
                    category: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["productName", "price", "category"],
                },
              },
            },
            required: ["products"],
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      console.error("Invalid response from LLM");
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.products || [];
  } catch (error) {
    console.error("Error extracting products from flyer image:", error);
    return [];
  }
}

/**
 * チラシ情報をデータベースに保存
 */
export async function saveFlyerToDatabase(
  supermarketId: number,
  flyerData: FlyerData,
  products: ExtractedProduct[]
): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.warn("Database not available");
    return null;
  }

  try {
    const flyerRecord: InsertFlyer = {
      supermarketId,
      flyerImageUrl: flyerData.flyerImageUrl,
      source: flyerData.source,
      validFrom: flyerData.flyerDate,
      items: JSON.stringify(products),
      rawText: JSON.stringify(products),
    };

    const result = await db.insert(flyers).values(flyerRecord);
    const insertId = (result as any)[0];
    return insertId;
  } catch (error) {
    console.error("Error saving flyer to database:", error);
    return null;
  }
}

/**
 * チラシ監視スケジューラー（トクバイ）
 */
export async function monitorTokubaiFlyers(userId: number): Promise<void> {
  console.log("[Tokubai Monitor] Starting flyer monitoring...");

  // トクバイのスーパー情報
  const stores = [
    {
      name: "バロー千音寺店",
      id: "237321",
      url: "https://tokubai.co.jp/%E3%83%9B%E3%83%BC%E3%83%A0%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC%E3%83%90%E3%83%AD%E3%83%BC/237321",
    },
  ];

  for (const store of stores) {
    try {
      console.log(`[Tokubai Monitor] Checking ${store.name}...`);
      // チラシ情報の取得と解析はブラウザ操作で実施
      // ここではスケジューラーの構造を示す
    } catch (error) {
      console.error(`[Tokubai Monitor] Error checking ${store.name}:`, error);
    }
  }
}

/**
 * チラシ監視スケジューラー（Shufoo!）
 */
export async function monitorShufooFlyers(userId: number): Promise<void> {
  console.log("[Shufoo Monitor] Starting flyer monitoring...");

  // Shufoo!のスーパー情報
  const stores = [
    {
      name: "薬のアオキ野田店",
      id: "shufoo-aoki",
      url: "https://www.shufoo.net/",
    },
    {
      name: "フィール野田店",
      id: "shufoo-feel",
      url: "https://www.shufoo.net/",
    },
  ];

  for (const store of stores) {
    try {
      console.log(`[Shufoo Monitor] Checking ${store.name}...`);
      // チラシ情報の取得と解析はブラウザ操作で実施
    } catch (error) {
      console.error(`[Shufoo Monitor] Error checking ${store.name}:`, error);
    }
  }
}

/**
 * 購買履歴とチラシ情報のマッチング
 */
export async function matchProductsWithPurchaseHistory(
  userId: number,
  products: ExtractedProduct[]
): Promise<ExtractedProduct[]> {
  const db = await getDb();
  if (!db) {
    console.warn("Database not available");
    return products;
  }

  try {
    // ユーザーの購買傾向を取得
    // TODO: 購買傾向テーブルから該当商品を抽出
    // ここでは全商品を返す（後で最適化）
    return products;
  } catch (error) {
    console.error("Error matching products with purchase history:", error);
    return products;
  }
}
