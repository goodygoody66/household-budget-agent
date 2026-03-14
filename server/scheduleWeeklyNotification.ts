/**
 * LINE通知の定期実行スケジュール設定
 * 毎週金曜日夜8時（JST）に自動実行
 */

import { schedule } from "node-cron";
import { sendWeeklyNotifications } from "./scheduledNotifications";

/**
 * 週次通知スケジュールを初期化
 * サーバー起動時に呼び出す
 */
export function initializeWeeklyNotificationSchedule(): void {
  console.log("[WeeklyNotificationSchedule] スケジュール初期化を開始します");

  // 毎週金曜日夜8時（JST）に実行
  // Cron表現: 秒 分 時 日 月 曜日
  // 金曜日夜8時 = 毎週金曜日の20時
  // node-cronではUTC時間を使用するため、JST夜8時 = UTC朝11時
  // 0 11 * * 5 = 毎週金曜日UTC朝11時（JST夜8時）

  const cronJob = schedule("0 11 * * 5", () => {
    console.log("[WeeklyNotificationSchedule] 週次通知を実行します");
    sendWeeklyNotifications().catch((error) => {
      console.error("[WeeklyNotificationSchedule] エラー:", error);
    });
  });

  console.log("[WeeklyNotificationSchedule] スケジュール初期化完了");
  console.log("[WeeklyNotificationSchedule] 毎週金曜日夜8時（JST）に実行予定");

  return;
}

/**
 * スケジュールを停止（テスト用）
 */
export function stopWeeklyNotificationSchedule(): void {
  console.log("[WeeklyNotificationSchedule] スケジュールを停止します");
  // node-cronのジョブを停止する場合はcronJob.stop()を呼び出す
}
