import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { lineUserMappings } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * LINE Messaging API用の型定義
 */
export interface LineWebhookEvent {
  type: string;
  message?: {
    type: string;
    text?: string;
  };
  source: {
    type: string;
    userId: string;
  };
  replyToken?: string;
  timestamp: number;
}

/**
 * LINE User IDをデータベースに保存
 */
export async function saveLINEUserId(
  userId: number,
  lineUserId: string,
  displayName?: string
): Promise<void> {
  try {
    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // 既存のマッピングを確認
    const existing = await database
      .select()
      .from(lineUserMappings)
      .where(and(eq(lineUserMappings.userId, userId), eq(lineUserMappings.lineUserId, lineUserId)));

    if (existing && existing.length > 0) {
      // 既に存在する場合は更新
      await database
        .update(lineUserMappings)
        .set({ displayName: displayName || null, updatedAt: new Date() })
        .where(and(eq(lineUserMappings.userId, userId), eq(lineUserMappings.lineUserId, lineUserId)));
    } else {
      // 新規作成
      await database.insert(lineUserMappings).values({
        userId,
        lineUserId,
        displayName: displayName || null,
        isActive: 1,
      });
    }
  } catch (error) {
    console.error("LINE User ID保存エラー:", error);
    throw error;
  }
}

/**
 * LINE通知を送信
 */
export async function sendLINENotification(
  lineUserId: string,
  message: {
    type: "text" | "flex";
    text?: string;
    altText?: string;
    contents?: any;
  }
): Promise<boolean> {
  try {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
      return false;
    }

    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [message],
      }),
    });

    if (!response.ok) {
      console.error("LINE通知送信失敗:", response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("LINE通知送信エラー:", error);
    return false;
  }
}

/**
 * ユーザーのすべてのLINE IDを取得
 */
export async function getUserLINEIds(userId: number): Promise<string[]> {
  try {
    const database = await db.getDb();
    if (!database) {
      return [];
    }

    const results = await database
      .select({ lineUserId: lineUserMappings.lineUserId })
      .from(lineUserMappings)
      .where(and(eq(lineUserMappings.userId, userId), eq(lineUserMappings.isActive, 1)));

    return results.map((r) => r.lineUserId);
  } catch (error) {
    console.error("LINE ID取得エラー:", error);
    return [];
  }
}

/**
 * マッチング結果をLINE通知用のフレックスメッセージに変換
 */
export function createMatchingFlexMessage(matchingData: any): any {
  const { totalSavings, matchedItems, excludedCategories } = matchingData;

  return {
    type: "flex",
    altText: `今週のおすすめ商品: 合計節約額 ¥${totalSavings.toLocaleString()}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🛒 今週のおすすめ商品",
            weight: "bold",
            size: "xl",
            color: "#1DB446",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "合計節約額",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: `¥${totalSavings.toLocaleString()}`,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5,
                    weight: "bold",
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "マッチ商品数",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: `${matchedItems.length}件`,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 5,
                    weight: "bold",
                  },
                ],
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: matchedItems.slice(0, 5).map((item: any) => ({
              type: "box",
              layout: "vertical",
              margin: "md",
              padding: "md",
              backgroundColor: "#f0f0f0",
              cornerRadius: "md",
              contents: [
                {
                  type: "text",
                  text: item.itemName,
                  weight: "bold",
                  size: "sm",
                },
                {
                  type: "text",
                  text: `¥${item.regularPrice} → ¥${item.salePrice} (節約: ¥${item.savingsAmount})`,
                  size: "xs",
                  color: "#999999",
                  margin: "sm",
                },
                {
                  type: "text",
                  text: item.storeName,
                  size: "xs",
                  color: "#1DB446",
                  margin: "sm",
                },
              ],
            })),
          },
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: "詳細を見る",
              uri: "https://budgagent-mm8dcses.manus.space/dashboard",
            },
          },
        ],
      },
    },
  };
}
