import crypto from "crypto";
import { invokeLLM } from "./_core/llm";
import { sendLINENotification, getUserLINEIds } from "./line";
import * as db from "./db";

/**
 * LINE から受信した画像をダウンロード
 */
async function downloadLINEImage(messageId: string): Promise<Buffer> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN not configured");
  }

  const response = await fetch(`https://obs.line-scdn.net/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * レシート画像を LLM で分析
 */
async function analyzeReceiptImage(imageUrl: string): Promise<{
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
  storeName?: string;
  date?: string;
  totalAmount?: number;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a receipt analysis AI. Analyze the receipt image and extract:
1. Store name
2. Purchase date
3. List of items with prices and quantities
4. Total amount
5. Item categories (食品, 日用品, 医薬品, etc.)

Return the result as JSON with the following structure:
{
  "storeName": "store name",
  "date": "YYYY-MM-DD",
  "items": [
    {"name": "item name", "price": 100, "quantity": 1, "category": "category"}
  ],
  "totalAmount": 1000
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Please analyze this receipt image and extract all the information.",
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
              storeName: { type: "string" },
              date: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    quantity: { type: "number" },
                    category: { type: "string" },
                  },
                  required: ["name", "price", "quantity"],
                },
              },
              totalAmount: { type: "number" },
            },
            required: ["items"],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return content as any;
  } catch (error) {
    console.error("[Receipt Analysis] Error:", error);
    throw error;
  }
}

/**
 * 分析結果を購買データとして保存
 */
async function savePurchaseData(
  userId: number,
  analysisResult: any,
  imageUrl: string
): Promise<void> {
  try {
    // レシートを保存
    const receiptDate = analysisResult.date
      ? new Date(analysisResult.date)
      : new Date();

    const receipt = await db.createReceipt({
      userId,
      imageUrl,
      imageKey: `receipts/${Date.now()}-line-image`,
      storeName: analysisResult.storeName || "Unknown Store",
      totalAmount: analysisResult.totalAmount || 0,
      purchaseDate: receiptDate,
      items: analysisResult.items || [],
      rawText: JSON.stringify(analysisResult),
    });

    console.log("[Purchase Data] Saved receipt:", receipt.id);
  } catch (error) {
    console.error("[Purchase Data] Error:", error);
    throw error;
  }
}

/**
 * 分析結果を LINE で返信
 */
async function replyAnalysisResult(
  replyToken: string,
  analysisResult: any
): Promise<void> {
  try {
    const itemsText = (analysisResult.items || [])
      .map((item: any) => `• ${item.name} ¥${item.price} × ${item.quantity || 1}`)
      .join("\n");

    const message = {
      type: "text",
      text: `📊 レシート分析完了\n\n🏪 店舗: ${analysisResult.storeName || "不明"}\n📅 日付: ${analysisResult.date || "不明"}\n\n商品:\n${itemsText}\n\n💰 合計: ¥${analysisResult.totalAmount || 0}`,
    };

    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("LINE_CHANNEL_ACCESS_TOKEN not configured");
    }

    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [message],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to reply: ${response.statusText}`);
    }

    console.log("[LINE Reply] Analysis result sent");
  } catch (error) {
    console.error("[LINE Reply] Error:", error);
    throw error;
  }
}

/**
 * LINE メッセージイベント（画像）を処理
 */
export async function handleLineImageMessage(
  userId: number,
  messageId: string,
  replyToken: string,
  imageUrl: string
): Promise<void> {
  try {
    console.log("[LINE Image] Processing image:", messageId);

    // 画像を分析
    const analysisResult = await analyzeReceiptImage(imageUrl);
    console.log("[LINE Image] Analysis result:", analysisResult);

    // 購買データとして保存
    await savePurchaseData(userId, analysisResult, imageUrl);

    // 分析結果を LINE で返信
    await replyAnalysisResult(replyToken, analysisResult);
  } catch (error) {
    console.error("[LINE Image] Error:", error);

    // エラーメッセージを返信
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (accessToken) {
      try {
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            replyToken,
            messages: [
              {
                type: "text",
                text: "申し訳ありません。画像の分析に失敗しました。別の画像をお試しください。",
              },
            ],
          }),
        });
      } catch (replyError) {
        console.error("[LINE Image] Failed to send error reply:", replyError);
      }
    }
  }
}
