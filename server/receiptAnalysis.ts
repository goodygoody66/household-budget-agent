import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import * as db from "./db";

/**
 * レシート分析結果の型定義
 */
export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  quantity?: number;
}

export interface ReceiptAnalysisResult {
  success: boolean;
  purchaseDate: Date;
  storeName: string;
  totalAmount: number;
  items: ReceiptItem[];
  rawText?: string;
  error?: string;
}

/**
 * レシート画像をLLMで分析
 */
export async function analyzeReceiptImage(
  imageUrl: string
): Promise<ReceiptAnalysisResult> {
  try {
    // LLMにレシート画像を分析させる
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `あなたはレシート分析の専門家です。提供されたレシート画像から以下の情報を抽出してください：
1. 購入日時（YYYY-MM-DD形式）
2. 店舗名
3. 合計金額（数字のみ）
4. 購入した商品のリスト（各商品について：商品名、侣格、カテゴリー、数量）

以下のJSON形式で応答してください：
{
  "purchaseDate": "YYYY-MM-DD",
  "storeName": "店舗名",
  "totalAmount": 数字,
  "items": [
    {
      "name": "商品名",
      "price": 侣格,
      "category": "カテゴリー",
      "quantity": 数量
    }
  ]
}

カテゴリーは以下から選択してください：
- 野菜・果物
- 肉・魚
- 乳製品・卵
- 穀類・パン
- 調味料・油
- 饮料
- お菖子・デザート
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
          name: "receipt_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              purchaseDate: { type: "string" },
              storeName: { type: "string" },
              totalAmount: { type: "number" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    category: { type: "string" },
                    quantity: { type: "number" },
                  },
                  required: ["name", "price", "category"],
                  additionalProperties: false,
                },
              },
            },
            required: ["purchaseDate", "storeName", "totalAmount", "items"],
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
      purchaseDate: new Date(parsed.purchaseDate),
      storeName: parsed.storeName,
      totalAmount: parsed.totalAmount,
      items: parsed.items,
      rawText: content,
    };
  } catch (error) {
    console.error("レシート分析エラー:", error);
    return {
      success: false,
      purchaseDate: new Date(),
      storeName: "",
      totalAmount: 0,
      items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * レシート画像をアップロードして分析
 */
export async function uploadAndAnalyzeReceipt(
  userId: number,
  imageBuffer: Buffer,
  fileName: string
): Promise<ReceiptAnalysisResult & { receiptId?: number }> {
  try {
    // S3にアップロード
    const fileKey = `receipts/${userId}/${Date.now()}-${fileName}`;
    const uploadResult = await storagePut(fileKey, imageBuffer, "image/jpeg");

    if (!uploadResult.url) {
      throw new Error("Failed to upload image to S3");
    }

    // LLMで分析
    const analysisResult = await analyzeReceiptImage(uploadResult.url);

    if (!analysisResult.success) {
      throw new Error(analysisResult.error || "Analysis failed");
    }

    // データベースに保存
    const receipt = await db.createReceipt({
      userId,
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key,
      purchaseDate: analysisResult.purchaseDate,
      totalAmount: analysisResult.totalAmount.toString(),
      storeName: analysisResult.storeName,
      items: JSON.stringify(analysisResult.items),
      rawText: analysisResult.rawText,
    });

    const receiptId = receipt.id;

    // 購買傾向を更新
    for (const item of analysisResult.items) {
      await updatePurchaseTrend(userId, item);
    }

    return {
      ...analysisResult,
      receiptId,
    };
  } catch (error) {
    console.error("レシートアップロード・分析エラー:", error);
    return {
      success: false,
      purchaseDate: new Date(),
      storeName: "",
      totalAmount: 0,
      items: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 購買傾向を更新
 */
async function updatePurchaseTrend(userId: number, item: ReceiptItem): Promise<void> {
  try {
    await db.upsertPurchaseTrend({
      userId,
      itemName: item.name,
      category: item.category,
      purchaseCount: item.quantity || 1,
      averagePrice: item.price.toString(),
      lastPurchaseDate: new Date(),
    });
  } catch (error) {
    console.error("購買傾向更新エラー:", error);
  }
}

/**
 * ユーザーの週間レシート数をカウント
 */
export async function getWeeklyReceiptCount(userId: number): Promise<number> {
  try {
    const receipts = await db.getUserReceipts(userId, 100);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return receipts.filter(r => r.createdAt >= oneWeekAgo).length;
  } catch (error) {
    console.error("週間レシート数取得エラー:", error);
    return 0;
  }
}
