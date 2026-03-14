/**
 * LINE通知の定期実行スケジュール
 * 毎週金曜日夜8時（JST）に自動実行
 */

import * as db from "./db";
import { users } from "../drizzle/schema";
import { sendLINENotification, getUserLINEIds } from "./line";
import { generateLineTextNotification } from "./improvedNotificationGenerator";

/**
 * 全ユーザーに対して週次通知を送信
 */
export async function sendWeeklyNotifications(): Promise<void> {
  try {
    console.log("[ScheduledNotification] 週次通知を開始します");

    const database = await db.getDb();
    if (!database) {
      console.error("[ScheduledNotification] データベース接続失敗");
      return;
    }

    // 全ユーザーを取得
    const allUsers = await database.select().from(users);

    for (const user of allUsers) {
      try {
        console.log(`[ScheduledNotification] ユーザー ${user.id} の通知を処理中...`);

        // ユーザーのLINE IDを取得
        const lineIds = await getUserLINEIds(user.id);
        if (lineIds.length === 0) {
          console.log(`[ScheduledNotification] ユーザー ${user.id} のLINE IDが登録されていません`);
          continue;
        }

        // マッチング結果を取得（実装時は実際のマッチング関数を呼び出す）
        // 仮のマッチング結果
        const matchingResults = [
          {
            productName: "いちご",
            purchasedPrice: 1780,
            flyerStore: "フィール野田店",
            flyerPrice: 1280,
            savings: 500,
            savingsPercent: 28,
            flyerUrl: "",
            discount: "28%OFF",
            receiptDate: new Date().toISOString().split('T')[0],
          },
        ];

        if (!matchingResults || matchingResults.length === 0) {
          console.log(`[ScheduledNotification] ユーザー ${user.id} のマッチング結果がありません`);
          continue;
        }

        // 通知メッセージを生成
        const notificationText = generateLineTextNotification(matchingResults);

        // 各LINE IDに通知を送信
        for (const lineId of lineIds) {
          const message = {
            type: "text" as const,
            text: notificationText,
          };

          const success = await sendLINENotification(lineId, message);
          if (success) {
            console.log(`[ScheduledNotification] ✓ ユーザー ${user.id} に通知を送信しました`);
          } else {
            console.error(`[ScheduledNotification] ✗ ユーザー ${user.id} への通知送信失敗`);
          }
        }
      } catch (error) {
        console.error(`[ScheduledNotification] ユーザー ${user.id} の処理中にエラー:`, error);
      }
    }

    console.log("[ScheduledNotification] 週次通知が完了しました");
  } catch (error) {
    console.error("[ScheduledNotification] エラー:", error);
  }
}

/**
 * スケジュール実行の初期化
 * サーバー起動時に呼び出す
 */
export function initializeScheduledNotifications(): void {
  console.log("[ScheduledNotification] スケジュール初期化を開始します");

  // 毎週金曜日夜8時（JST）に実行
  // Cron表現: 0 20 * * 5 (UTC時間で20時 = JST朝5時)
  // JST夜8時 = UTC朝11時 = 0 11 * * 5

  // Node.jsでのスケジュール実装例（node-cronを使用する場合）
  // import cron from 'node-cron';
  // cron.schedule('0 11 * * 5', () => {
  //   console.log('[ScheduledNotification] 週次通知を実行します');
  //   sendWeeklyNotifications();
  // }, {
  //   timezone: 'UTC'
  // });

  // Manus組み込みスケジューラーを使用する場合は、
  // server/_core/scheduler.ts を参照してください

  console.log("[ScheduledNotification] スケジュール初期化完了");
  console.log("[ScheduledNotification] 毎週金曜日夜8時（JST）に実行予定");
}
