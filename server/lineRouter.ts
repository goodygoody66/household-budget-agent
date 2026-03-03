import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { saveLINEUserId, sendLINENotification, getUserLINEIds, createMatchingFlexMessage } from "./line";
import * as db from "./db";

/**
 * LINE Webhook イベント処理
 */
export async function handleLINEWebhook(events: any[]): Promise<void> {
  for (const event of events) {
    if (event.type === "follow") {
      // ユーザーがBotに友達追加した時
      const lineUserId = event.source.userId;
      
      // テストユーザーID（実装時は認証情報から取得）
      const userId = 1;
      
      await saveLINEUserId(userId, lineUserId);
      
      // ウェルカムメッセージを送信
      await sendLINENotification(lineUserId, {
        type: "text",
        text: "🛒 家計防衛エージェントへようこそ！\n\nこのBotは、あなたの購買履歴とスーパーのチラシを自動で比較し、毎週お得な商品をお知らせします。\n\n週1回、金曜日の夜8時に最新のおすすめ商品をお送りします。",
      });
    } else if (event.type === "unfollow") {
      // ユーザーがBotをブロックした時
      const lineUserId = event.source.userId;
      
      // LINE User IDマッピングを無効化
      const database = await db.getDb();
      if (database) {
        const { lineUserMappings } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        await database
          .update(lineUserMappings)
          .set({ isActive: 0 })
          .where(eq(lineUserMappings.lineUserId, lineUserId));
      }
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
   */
  webhook: publicProcedure
    .input(z.object({
      events: z.array(z.any()),
    }))
    .mutation(async ({ input }) => {
      try {
        await handleLINEWebhook(input.events);
        return { success: true };
      } catch (error) {
        console.error("LINE Webhook処理エラー:", error);
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
        return { success: true, message: "LINE User IDを登録しました" };
      } catch (error) {
        console.error("LINE User ID登録エラー:", error);
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
      console.error("LINE ID取得エラー:", error);
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

      const testMessage = {
        type: "text" as const,
        text: "📢 テスト通知\n\nこれはテスト通知です。正常に受信できています。",
      };

      let successCount = 0;
      for (const lineId of lineIds) {
        const result = await sendLINENotification(lineId, testMessage);
        if (result) successCount++;
      }

      return {
        success: successCount > 0,
        message: `${successCount}/${lineIds.length} 件の通知を送信しました`,
      };
    } catch (error) {
      console.error("テスト通知送信エラー:", error);
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
        console.error("マッチング通知送信エラー:", error);
        return { success: false, error: "通知送信に失敗しました" };
      }
    }),
});
