import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * チラシ情報の型定義
 */
export interface FlyerItem {
  name: string;
  regularPrice: number;
  salePrice: number;
  discount: number;
  category: string;
}

/**
 * トクバイからチラシを取得して分析
 */
export async function fetchAndAnalyzeFlyerFromTokubai(
  supermarketId: number,
  tokubaiUrl: string
): Promise<{ success: boolean; items: FlyerItem[]; error?: string }> {
  try {
    // トクバイのURLからチラシ画像を取得
    // 注：実装時にはスクレイピングまたはAPI連携が必要
    // ここではモック実装
    
    console.log(`Fetching flyer from Tokubai: ${tokubaiUrl}`);
    
    // 実装例：Puppeteerなどでスクレイピング
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto(tokubaiUrl);
    // const flyerImageUrl = await page.$eval('img.flyer', el => el.src);
    
    return {
      success: true,
      items: [],
    };
  } catch (error) {
    console.error("チラシ取得エラー:", error);
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * チラシ画像をLLMで分析
 */
export async function analyzeFlyerImage(
  imageUrl: string
): Promise<{ success: boolean; items: FlyerItem[]; rawText?: string; error?: string }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `このチラシ画像から特売商品情報を抽出してください。以下の情報を JSON 形式で返してください：
{
  "items": [
    {
      "name": "商品名",
      "regularPrice": 通常価格,
      "salePrice": セール価格,
      "discount": 割引率（%）,
      "category": "カテゴリー"
    }
  ]
}

カテゴリーは以下から選択：
- 野菜・果物
- 肉・魚
- 乳製品・卵
- 穀類・パン
- 調味料・油
- 飲料
- お菓子・デザート
- 日用品
- その他`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "flyer_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    regularPrice: { type: "number" },
                    salePrice: { type: "number" },
                    discount: { type: "number" },
                    category: { type: "string" },
                  },
                  required: ["name", "regularPrice", "salePrice", "discount", "category"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("LLM response is not a string");
    }

    const parsed = JSON.parse(content);

    return {
      success: true,
      items: parsed.items,
      rawText: content,
    };
  } catch (error) {
    console.error("チラシ分析エラー:", error);
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * すべての店舗のチラシを更新
 */
export async function updateAllFlyersScheduled(): Promise<void> {
  try {
    console.log("[FlyerScheduler] Starting flyer update...");

    // すべての有効な店舗を取得
    const database = await db.getDb();
    if (!database) {
      console.error("Database not available");
      return;
    }

    const { supermarkets } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const allSupermarkets = await database
      .select()
      .from(supermarkets)
      .where(eq(supermarkets.isActive, 1));

    for (const supermarket of allSupermarkets) {
      if (supermarket.tokubaiUrl) {
        console.log(`[FlyerScheduler] Processing ${supermarket.name}...`);
        
        // トクバイからチラシを取得
        const result = await fetchAndAnalyzeFlyerFromTokubai(
          supermarket.id,
          supermarket.tokubaiUrl
        );

        if (result.success && result.items.length > 0) {
          // チラシ情報をデータベースに保存
          await db.createFlyer({
            supermarketId: supermarket.id,
            source: "tokubai",
            validFrom: new Date(),
            validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日間有効
            items: JSON.stringify(result.items),
          });

          console.log(
            `[FlyerScheduler] Updated ${supermarket.name} with ${result.items.length} items`
          );
        }
      }
    }

    console.log("[FlyerScheduler] Flyer update completed");
  } catch (error) {
    console.error("[FlyerScheduler] Error:", error);
  }
}

/**
 * スケジューラーを開始（毎日午前1時に実行）
 */
export function startFlyerScheduler(): void {
  // 毎日午前1時に実行
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(1, 0, 0, 0);

  const msUntilTomorrow = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    updateAllFlyersScheduled();
    // 24時間ごとに実行
    setInterval(updateAllFlyersScheduled, 24 * 60 * 60 * 1000);
  }, msUntilTomorrow);

  console.log("[FlyerScheduler] Scheduler started");
}
