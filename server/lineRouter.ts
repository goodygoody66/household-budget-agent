import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { saveLINEUserId, sendLINENotification, getUserLINEIds, createMatchingFlexMessage } from "./line";
import * as db from "./db";
import { validateLineSignature, LineWebhookEvent } from "./_core/lineWebhook";
import { generateWelcomeFlexMessage, generateWelcomeTextMessage } from "./lineWelcomeMessage";

/**
 * LINE Webhook イベント処理
 * 友達追加・ブロック・メッセージ受信などのイベントを処理
 */
export async function handleLINEWebhook(events: LineWebhookEvent[]): Promise<void> {
  for (const event of events) {
    if (event.type === "follow") {
      // ユーザーがBotに友達追加した時
      const lineUserId = event.source.userId;
      
      // 注意: 実装時は認証情報から取得する必要があります
      // 現在はテストユーザーID（1）を使用
      const userId = 1;
      
      try {
        // LINE User IDをデータベースに保存
        await saveLINEUserId(userId, lineUserId);
        
        // 改善版フォーマットのウェルカムメッセージを送信
        // 1. Flex Message形式（リッチな見た目）
        const flexMessage = generateWelcomeFlexMessage();
        await sendLINENotification(lineUserId, flexMessage);
        
        // 2. テキスト形式（フォールバック用）
        const textMessage = {
          type: "text" as const,
          text: generateWelcomeTextMessage(),
        };
        // 少し遅延させて送信（複数メッセージの場合）
        setTimeout(() => {
          sendLINENotification(lineUserId, textMessage);
        }, 1000);
        
        console.log(`[LINE] ユーザー ${lineUserId} が友達追加しました`);
      } catch (error) {
        console.error(`[LINE] 友達追加処理エラー (${lineUserId}):`, error);
      }
    } else if (event.type === "unfollow") {
      // ユーザーがBotをブロックした時
      const lineUserId = event.source.userId;
      
      try {
        // LINE User IDマッピングを無効化
        const database = await db.getDb();
        if (database) {
          const { lineUserMappings } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          
          await database
            .update(lineUserMappings)
            .set({ isActive: 0 })
            .where(eq(lineUserMappings.lineUserId, lineUserId));
          
          console.log(`[LINE] ユーザー ${lineUserId} がブロックしました`);
        }
      } catch (error) {
        console.error(`[LINE] ブロック処理エラー (${lineUserId}):`, error);
      }
    } else if (event.type === "message" && event.message?.type === "text") {
      // テキストメッセージ受信時の処理
      const lineUserId = event.source.userId;
      const text = event.message.text || "";
      
      console.log(`[LINE] メッセージ受信 (${lineUserId}): ${text}`);
      
      // 今後のメッセージ処理はここに追加
    }
  }
}

/**
 * LINE通知機能用のRouter
 */
export const lineRouter = router({
  /**
   * LINE Webhook エンドポイント（公開）
   * LINE Messaging APIからのイベント受信
   * 
   * 注意: 本番環境ではHTTPヘッダーの署名検証が必須です
   * X-Line-Signature ヘッダーを確認してください
   */
  webhook: publicProcedure
    .input(z.object({
      events: z.array(z.any()),
      signature: z.string().optional(),
      body: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // 署名検証（本番環境では必須）
        if (input.signature && input.body) {
          const channelSecret = process.env.LINE_CHANNEL_SECRET;
          if (!channelSecret) {
            console.warn("[LINE] LINE_CHANNEL_SECRET が設定されていません");
          } else {
            const isValid = validateLineSignature(input.body, input.signature, channelSecret);
            if (!isValid) {
              console.error("[LINE] 署名検証失敗");
              return { success: false, error: "署名検証に失敗しました" };
            }
          }
        }
        
        await handleLINEWebhook(input.events);
        return { success: true };
      } catch (error) {
        console.error("[LINE] Webhook処理エラー:", error);
        return { success: false, error: "Webhook処理に失敗しました" };
      }
    }),

  /**
   * LINE User IDを保存（保護）
   * ユーザーが手動でLINE User IDを登録する場合
   */
  registerUserId: protectedProcedure
    .input(z.object({
      lineUserId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await saveLINEUserId(ctx.user.id, input.lineUserId);
        
        // 登録完了の確認メッセージを送信
        const welcomeMessage = generateWelcomeFlexMessage();
        await sendLINENotification(input.lineUserId, welcomeMessage);
        
        return { success: true, message: "LINE User IDを登録しました" };
      } catch (error) {
        console.error("[LINE] LINE User ID登録エラー:", error);
        return { success: false, error: "LINE User IDの登録に失敗しました" };
      }
    }),

  /**
   * ユーザーのLINE IDを取得（保護）
   */
  getRegisteredIds: protectedProcedure.query(async ({ ctx }) => {
    try {
      const lineIds = await getUserLINEIds(ctx.user.id);
      return { success: true, lineIds };
    } catch (error) {
      console.error("[LINE] LINE ID取得エラー:", error);
      return { success: false, lineIds: [] };
    }
  }),

  /**
   * テスト通知を送信（保護）
   */
  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const lineIds = await getUserLINEIds(ctx.user.id);
      
      if (lineIds.length === 0) {
        return { success: false, error: "LINE User IDが登録されていません" };
      }

      // 改善版フォーマットのテスト通知を送信
      const flexMessage = generateWelcomeFlexMessage();

      let successCount = 0;
      for (const lineId of lineIds) {
        const result = await sendLINENotification(lineId, flexMessage);
        if (result) successCount++;
      }

      return {
        success: successCount > 0,
        message: `${successCount}/${lineIds.length} 件の通知を送信しました`,
      };
    } catch (error) {
      console.error("[LINE] テスト通知送信エラー:", error);
      return { success: false, error: "通知送信に失敗しました" };
    }
  }),

  /**
   * マッチング結果をLINE通知で送信（保護）
   */
  sendMatchingNotification: protectedProcedure
    .input(z.object({
      matchingData: z.any(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const lineIds = await getUserLINEIds(ctx.user.id);
        
        if (lineIds.length === 0) {
          return { success: false, error: "LINE User IDが登録されていません" };
        }

        const flexMessage = createMatchingFlexMessage(input.matchingData);

        let successCount = 0;
        for (const lineId of lineIds) {
          const result = await sendLINENotification(lineId, flexMessage);
          if (result) successCount++;
        }

        return {
          success: successCount > 0,
          message: `${successCount}/${lineIds.length} 件の通知を送信しました`,
        };
      } catch (error) {
        console.error("[LINE] マッチング通知送信エラー:", error);
        return { success: false, error: "通知送信に失敗しました" };
      }
    }),
});
