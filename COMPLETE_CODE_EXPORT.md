# 家計防衛エージェント - 完全コード・設定エクスポート

**作成日**: 2026年3月14日  
**プロジェクト**: household-budget-agent  
**バージョン**: 23bc1430

---

## 📋 目次

1. [環境変数・設定](#環境変数設定)
2. [LINE通知関連コード](#line通知関連コード)
3. [改善版通知生成](#改善版通知生成)
4. [データベース・型定義](#データベース型定義)
5. [テストコード](#テストコード)
6. [その他の重要ファイル](#その他の重要ファイル)

---

## 環境変数・設定

### 必要な環境変数

```bash
# LINE Messaging API
LINE_CHANNEL_SECRET=1701f41317e46bfc75c9fbdb71be9fc3
LINE_CHANNEL_ACCESS_TOKEN=ZvF+r/lq7tkin130vMoe681RdgfgWF3F19vFph5w5u2rTyjqUprZbQwmDX6/lb5UFNXJvnI0NHEOpCmSmdnvcKJPtqK7Y6DmXbzFZU/KtWb76iQcXeoYAO6M6y5Esnrrnh3IOFWKv21gL2VDzgrQ4QdB04t89/1O/w1cDnyilFU=

# ユーザーLINE ID
USER_LINE_ID=Uc7039bdb6ec82c265b43e964d85f571c

# その他（既存）
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
```

### LINE Developers Console設定

**Webhook URL**:
```
https://budgagent-mm8dcses.manus.space/api/trpc/line.webhook
```

**Channel ID**: 2009300281  
**Bot Basic ID**: @254nfpwk

---

## LINE通知関連コード

### 1. server/line.ts - LINE通知送信の基本機能

```typescript
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
      throw new Error("Database not available");
    }

    const mappings = await database
      .select()
      .from(lineUserMappings)
      .where(and(eq(lineUserMappings.userId, userId), eq(lineUserMappings.isActive, 1)));

    return mappings.map((m) => m.lineUserId);
  } catch (error) {
    console.error("LINE ID取得エラー:", error);
    return [];
  }
}
```

### 2. server/_core/lineWebhook.ts - Webhook署名検証

```typescript
import crypto from "crypto";

/**
 * LINE Webhook署名を検証
 */
export function verifyLineWebhookSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  try {
    const hash = crypto
      .createHmac("sha256", channelSecret)
      .update(body)
      .digest("base64");

    return hash === signature;
  } catch (error) {
    console.error("Webhook署名検証エラー:", error);
    return false;
  }
}

/**
 * LINE Webhookイベントの型定義
 */
export interface LineWebhookBody {
  events: Array<{
    type: "message" | "follow" | "unfollow" | "join" | "leave" | "postback" | "beacon";
    message?: {
      type: string;
      id: string;
      text?: string;
    };
    source: {
      type: "user" | "group" | "room";
      userId: string;
    };
    replyToken?: string;
    timestamp: number;
  }>;
}
```

### 3. server/lineWelcomeMessage.ts - ウェルカムメッセージ生成

```typescript
/**
 * LINE Bot友達追加時のウェルカムメッセージを生成
 */

export function generateWelcomeTextMessage(userName: string): string {
  return `🎉 ${userName}さん、はじめまして！

お得に買い物BOTへようこそ！

このBotは、あなたの購買履歴とチラシ情報を組み合わせて、
最適な節約商品をお知らせします。

📸 レシート分析
レシート画像をアップロードして、購買履歴を自動分析

🏪 チラシ連携
トクバイやShufooの特売情報を自動取得

💰 スマートマッチング
あなたの買い物パターンに最適な商品を提案

📧 週次通知
毎週金曜日夜8時に節約チャンスをお知らせ

━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 さっそく始めましょう！

1️⃣ ダッシュボードにアクセス
2️⃣ レシートをアップロード
3️⃣ 毎週の節約チャンスを受け取る

ご質問やご不明な点は、いつでもお気軽にお問い合わせください。`;
}

export function generateWelcomeFlexMessage(userName: string): any {
  return {
    type: "flex",
    altText: `${userName}さん、お得に買い物BOTへようこそ！`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `${userName}さんへ`,
            weight: "bold",
            size: "xl",
            color: "#1DB446",
          },
          {
            type: "text",
            text: "お得に買い物BOTへようこそ！",
            size: "lg",
            weight: "bold",
            wrap: true,
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "md",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "📸",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "レシート分析",
                    size: "sm",
                    flex: 5,
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "🏪",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "チラシ連携",
                    size: "sm",
                    flex: 5,
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "💰",
                    size: "sm",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: "スマートマッチング",
                    size: "sm",
                    flex: 5,
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: "ダッシュボードを開く",
              uri: "https://budgagent-mm8dcses.manus.space/dashboard",
            },
          },
        ],
      },
    },
  };
}

export function generateWelcomeHtmlMessage(userName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .header {
      background: linear-gradient(135deg, #1DB446 0%, #17a938 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .feature {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .feature-icon {
      font-size: 32px;
      margin-right: 15px;
    }
    .feature-text h3 {
      margin: 0 0 5px 0;
      color: #333;
    }
    .feature-text p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #1DB446 0%, #17a938 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 5px;
      text-decoration: none;
      text-align: center;
      margin-top: 20px;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>お得に買い物BOT</h1>
      <p>${userName}さん、ようこそ！</p>
    </div>
    <div class="content">
      <div class="feature">
        <div class="feature-icon">📸</div>
        <div class="feature-text">
          <h3>レシート分析</h3>
          <p>レシート画像から購買履歴を自動分析</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">🏪</div>
        <div class="feature-text">
          <h3>チラシ連携</h3>
          <p>トクバイ・Shufooの特売情報を自動取得</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">💰</div>
        <div class="feature-text">
          <h3>スマートマッチング</h3>
          <p>あなたの買い物パターンに最適な商品を提案</p>
        </div>
      </div>
      <div class="feature">
        <div class="feature-icon">📧</div>
        <div class="feature-text">
          <h3>週次通知</h3>
          <p>毎週金曜日夜8時に節約チャンスをお知らせ</p>
        </div>
      </div>
      <a href="https://budgagent-mm8dcses.manus.space/dashboard" class="button">ダッシュボードを開く</a>
    </div>
    <div class="footer">
      <p>© 2026 家計防衛エージェント. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
```

### 4. server/lineRouter.ts - LINE Webhook処理

```typescript
import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { saveLINEUserId, sendLINENotification } from "./line";
import { verifyLineWebhookSignature } from "./_core/lineWebhook";
import {
  generateWelcomeTextMessage,
  generateWelcomeFlexMessage,
} from "./lineWelcomeMessage";

export const lineRouter = router({
  webhook: publicProcedure
    .input(
      z.object({
        body: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const channelSecret = process.env.LINE_CHANNEL_SECRET;
      if (!channelSecret) {
        console.error("LINE_CHANNEL_SECRET が設定されていません");
        return { ok: false };
      }

      // Webhook署名を検証
      if (!verifyLineWebhookSignature(input.body, input.signature, channelSecret)) {
        console.error("Webhook署名検証失敗");
        return { ok: false };
      }

      try {
        const events = JSON.parse(input.body).events || [];

        for (const event of events) {
          if (event.type === "follow") {
            // 友達追加イベント
            const lineUserId = event.source.userId;
            console.log("友達追加:", lineUserId);

            // User IDをデータベースに保存（userId=1は実装時に認証情報から取得）
            await saveLINEUserId(1, lineUserId);

            // ウェルカムメッセージを送信
            const textMessage = {
              type: "text" as const,
              text: generateWelcomeTextMessage("ニシカワ"),
            };

            const flexMessage = generateWelcomeFlexMessage("ニシカワ");

            await sendLINENotification(lineUserId, textMessage);
            await sendLINENotification(lineUserId, flexMessage);
          } else if (event.type === "unfollow") {
            // ブロックイベント
            console.log("ブロック:", event.source.userId);
          } else if (event.type === "message") {
            // メッセージ受信イベント
            console.log("メッセージ受信:", event.message?.text);
          }
        }

        return { ok: true };
      } catch (error) {
        console.error("Webhook処理エラー:", error);
        return { ok: false };
      }
    }),
});
```

---

## 改善版通知生成

### server/improvedNotificationGenerator.ts

```typescript
/**
 * 改善版通知メッセージを生成
 */

export interface MatchingResult {
  storeName: string;
  totalSavings: number;
  products: Array<{
    name: string;
    regularPrice: number;
    salePrice: number;
    savings: number;
    savingsPercent: number;
  }>;
}

export function generateImprovedTextNotification(
  results: MatchingResult[]
): string {
  let message = `🎯 家計防衛エージェント - 週次通知\n\n`;
  message += `💰 今週の節約チャンス\n`;

  const totalSavings = results.reduce((sum, r) => sum + r.totalSavings, 0);
  const totalProducts = results.reduce((sum, r) => sum + r.products.length, 0);

  message += `📊 総節約可能額: ¥${totalSavings.toLocaleString()}\n`;
  message += `🛍️ マッチ商品: ${totalProducts}件\n`;
  message += `🏪 対象店舗: ${results.length}店舗\n\n`;

  for (const result of results) {
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `🏪 ${result.storeName}\n`;
    message += `💚 節約額: ¥${result.totalSavings.toLocaleString()}\n`;
    message += `📦 マッチ商品:\n`;

    for (const product of result.products) {
      message += `  ${product.name}\n`;
      message += `  定価: ¥${product.regularPrice.toLocaleString()} → 特価: ¥${product.salePrice.toLocaleString()}\n`;
      message += `  💚 ¥${product.savings.toLocaleString()}節約 (${product.savingsPercent}%OFF)\n\n`;
    }
  }

  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📌 ご利用方法:\n`;
  message += `1️⃣ ダッシュボードで詳細を確認\n`;
  message += `2️⃣ 店舗に行く前にチェック\n`;
  message += `3️⃣ 節約商品をカゴに入れる\n\n`;
  message += `🔗 ダッシュボード: https://budgagent-mm8dcses.manus.space/dashboard`;

  return message;
}

export function generateImprovedFlexMessage(results: MatchingResult[]): any {
  const totalSavings = results.reduce((sum, r) => sum + r.totalSavings, 0);
  const totalProducts = results.reduce((sum, r) => sum + r.products.length, 0);

  const storeBoxes = results.map((result) => ({
    type: "box",
    layout: "vertical",
    spacing: "sm",
    margin: "md",
    contents: [
      {
        type: "text",
        text: `🏪 ${result.storeName}`,
        weight: "bold",
        size: "md",
      },
      {
        type: "text",
        text: `💚 ¥${result.totalSavings.toLocaleString()}節約`,
        size: "sm",
        color: "#17a938",
      },
      ...result.products.map((p) => ({
        type: "text",
        text: `${p.name}: ¥${p.regularPrice} → ¥${p.salePrice} (${p.savingsPercent}%OFF)`,
        size: "xs",
        color: "#999999",
        wrap: true,
      })),
    ],
  }));

  return {
    type: "flex",
    altText: `今週の節約チャンス: 総¥${totalSavings}節約`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "今週の節約チャンス",
            weight: "bold",
            size: "xl",
            color: "#1DB446",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: `総節約額: ¥${totalSavings.toLocaleString()}`,
                size: "lg",
                weight: "bold",
              },
              {
                type: "text",
                text: `${totalProducts}件の商品 × ${results.length}店舗`,
                size: "sm",
                color: "#999999",
              },
            ],
          },
          ...storeBoxes,
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
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
```

---

## データベース・型定義

### drizzle/schema.ts - LINE User Mappings テーブル

```typescript
import { mysqlTable, varchar, int, timestamp, tinyint } from "drizzle-orm/mysql-core";

export const lineUserMappings = mysqlTable("line_user_mappings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  lineUserId: varchar("line_user_id", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  isActive: tinyint("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});
```

---

## テストコード

### server/_core/lineWebhook.test.ts

```typescript
import { describe, it, expect } from "vitest";
import { verifyLineWebhookSignature } from "./lineWebhook";
import crypto from "crypto";

describe("LINE Webhook署名検証", () => {
  const channelSecret = "test-channel-secret";
  const body = '{"events":[{"type":"follow"}]}';

  it("正しい署名を検証できる", () => {
    const signature = crypto
      .createHmac("sha256", channelSecret)
      .update(body)
      .digest("base64");

    const result = verifyLineWebhookSignature(body, signature, channelSecret);
    expect(result).toBe(true);
  });

  it("間違った署名を拒否する", () => {
    const wrongSignature = "wrong-signature";
    const result = verifyLineWebhookSignature(body, wrongSignature, channelSecret);
    expect(result).toBe(false);
  });

  it("改ざんされたボディを検出する", () => {
    const signature = crypto
      .createHmac("sha256", channelSecret)
      .update(body)
      .digest("base64");

    const tamperedBody = '{"events":[{"type":"message"}]}';
    const result = verifyLineWebhookSignature(tamperedBody, signature, channelSecret);
    expect(result).toBe(false);
  });

  it("空のボディを処理できる", () => {
    const emptyBody = "";
    const signature = crypto
      .createHmac("sha256", channelSecret)
      .update(emptyBody)
      .digest("base64");

    const result = verifyLineWebhookSignature(emptyBody, signature, channelSecret);
    expect(result).toBe(true);
  });

  it("大きなボディを処理できる", () => {
    const largeBody = JSON.stringify({
      events: Array(100)
        .fill(null)
        .map((_, i) => ({
          type: "message",
          message: { type: "text", text: `Message ${i}` },
        })),
    });

    const signature = crypto
      .createHmac("sha256", channelSecret)
      .update(largeBody)
      .digest("base64");

    const result = verifyLineWebhookSignature(largeBody, signature, channelSecret);
    expect(result).toBe(true);
  });
});
```

### server/lineWelcomeMessage.test.ts

```typescript
import { describe, it, expect } from "vitest";
import {
  generateWelcomeTextMessage,
  generateWelcomeFlexMessage,
  generateWelcomeHtmlMessage,
} from "./lineWelcomeMessage";

describe("LINE Botウェルカムメッセージ", () => {
  describe("テキスト形式", () => {
    it("ユーザー名を含む", () => {
      const message = generateWelcomeTextMessage("テスト");
      expect(message).toContain("テストさん");
    });

    it("主要機能を説明している", () => {
      const message = generateWelcomeTextMessage("テスト");
      expect(message).toContain("レシート分析");
      expect(message).toContain("チラシ連携");
      expect(message).toContain("スマートマッチング");
      expect(message).toContain("週次通知");
    });

    it("ダッシュボードリンクを含む", () => {
      const message = generateWelcomeTextMessage("テスト");
      expect(message).toContain("https://budgagent-mm8dcses.manus.space/dashboard");
    });
  });

  describe("Flex Message形式", () => {
    it("有効なJSON構造を返す", () => {
      const message = generateWelcomeFlexMessage("テスト");
      expect(message).toBeDefined();
      expect(message.type).toBe("flex");
      expect(message.contents).toBeDefined();
    });

    it("altTextを含む", () => {
      const message = generateWelcomeFlexMessage("テスト");
      expect(message.altText).toContain("テストさん");
    });

    it("ボタンを含む", () => {
      const message = generateWelcomeFlexMessage("テスト");
      const footer = message.contents.footer;
      expect(footer).toBeDefined();
      expect(footer.contents[0].action.type).toBe("uri");
    });
  });

  describe("HTML形式", () => {
    it("有効なHTML構造を返す", () => {
      const message = generateWelcomeHtmlMessage("テスト");
      expect(message).toContain("<html>");
      expect(message).toContain("</html>");
      expect(message).toContain("<body>");
      expect(message).toContain("</body>");
      expect(message).toContain("<style>");
    });

    it("ユーザー名をカスタマイズできる", () => {
      const message1 = generateWelcomeHtmlMessage("ニシカワ");
      const message2 = generateWelcomeHtmlMessage("太郎");

      expect(message1).toContain("ニシカワさん");
      expect(message2).toContain("太郎さん");
      expect(message1).not.toContain("太郎");
      expect(message2).not.toContain("ニシカワ");
    });
  });
});
```

---

## その他の重要ファイル

### LINE通知送信テストスクリプト

```javascript
// test-line-send-real.mjs
import crypto from 'crypto';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const userLineId = 'Uc7039bdb6ec82c265b43e964d85f571c';

const testMessage = {
  type: 'text',
  text: '🎉 家計防衛エージェント\n\nLINE通知テスト成功！\n\nこのメッセージが表示されたら、LINE通知が正常に動作しています。',
};

const sendNotification = async () => {
  try {
    console.log('\n📤 LINE Messaging APIに通知を送信中...');
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userLineId,
        messages: [testMessage],
      }),
    });

    console.log('📊 レスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE通知送信失敗');
      console.error('ステータス:', response.status);
      console.error('エラー内容:', errorText);
      return false;
    }

    console.log('✅ LINE通知送信成功！');
    console.log('\n📱 LINEアプリで通知を確認してください。');
    return true;
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return false;
  }
};

await sendNotification();
```

---

## 実装チェックリスト

- [x] LINE認証情報の設定
- [x] Webhook署名検証（HMAC-SHA256）
- [x] LINE User ID自動保存
- [x] ウェルカムメッセージ（3形式）
- [x] 改善版通知メッセージ生成
- [x] LINE通知送信機能
- [x] ユニットテスト（31テスト）
- [x] 統合テスト（テスト通知送信）
- [x] エラーハンドリング
- [x] ドキュメント作成

---

## トラブルシューティング

### LINE通知が来ない場合

1. **LINE_CHANNEL_ACCESS_TOKENが設定されているか確認**
   ```bash
   echo $LINE_CHANNEL_ACCESS_TOKEN
   ```

2. **LINE_CHANNEL_SECRETが設定されているか確認**
   ```bash
   echo $LINE_CHANNEL_SECRET
   ```

3. **User IDが正しいか確認**
   - ダッシュボードで確認: https://budgagent-mm8dcses.manus.space/dashboard

4. **Webhook URLが正しく設定されているか確認**
   - LINE Developers Console → Messaging API → Webhook URL
   - `https://budgagent-mm8dcses.manus.space/api/trpc/line.webhook`

5. **サーバーログを確認**
   ```bash
   tail -f .manus-logs/devserver.log
   ```

---

**最終更新**: 2026年3月14日  
**バージョン**: 23bc1430
