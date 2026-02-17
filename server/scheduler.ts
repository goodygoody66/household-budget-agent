import { schedule } from "node-cron";
import { sendTestNotification, notifyWeeklyRecommendations } from "./line-notification";
import { getDb } from "./db";
import { matchingResults } from "../drizzle/schema";
import { desc, and, gte } from "drizzle-orm";

/**
 * スケジューラー設定
 * 定期的にチラシを監視し、LINE通知を送信
 */

/**
 * 毎週金曜日夜8時に週間推奨商品をまとめて通知
 * Cron形式: 秒 分 時 日 月 曜日
 * 毎週金曜日20時 = "0 0 20 * * 5"
 */
export function scheduleWeeklyNotification(): void {
  console.log("[Scheduler] Scheduling weekly notification for Friday 20:00 (JST)");

  // 毎週金曜日夜8時（JST）
  const job = schedule("0 0 20 * * 5", async () => {
    console.log("[Scheduler] Running weekly notification job...");
    await sendWeeklyNotificationJob();
  });

  job.start();
  console.log("[Scheduler] Weekly notification job scheduled");
}

/**
 * 毎日チラシをチェック（複数回）
 * 朝8時、昼12時、夜6時にチェック
 */
export function scheduleDailyFlyerCheck(): void {
  console.log("[Scheduler] Scheduling daily flyer checks");

  // 朝8時
  const morningJob = schedule("0 0 8 * * *", async () => {
    console.log("[Scheduler] Running morning flyer check...");
    // チラシ監視処理をここに実装
  });

  // 昼12時
  const noonJob = schedule("0 0 12 * * *", async () => {
    console.log("[Scheduler] Running noon flyer check...");
    // チラシ監視処理をここに実装
  });

  // 夜6時
  const eveningJob = schedule("0 0 18 * * *", async () => {
    console.log("[Scheduler] Running evening flyer check...");
    // チラシ監視処理をここに実装
  });

  morningJob.start();
  noonJob.start();
  eveningJob.start();

  console.log("[Scheduler] Daily flyer check jobs scheduled");
}

/**
 * 週間通知ジョブの実装
 */
async function sendWeeklyNotificationJob(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Scheduler] Database not available");
      return;
    }

    // 過去7日間のマッチング結果を取得
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const results = await db
      .select()
      .from(matchingResults)
      .where(gte(matchingResults.createdAt, sevenDaysAgo))
      .orderBy(desc(matchingResults.matchScore))
      .limit(20); // 上位20件

    if (results.length === 0) {
      console.log("[Scheduler] No matching results found for this week");
      return;
    }

    // マッチング結果を推奨商品に変換
    const recommendations = results.map((result) => ({
      storeName: result.category || "不明",
      itemName: result.itemName,
      category: result.category || "その他",
      regularPrice: Number(result.regularPrice || 0),
      salePrice: Number(result.salePrice || 0),
      discountPercentage: Number(result.discountPercentage || 0),
      userPurchaseFrequency: result.userPurchaseFrequency || 0,
      matchScore: Number(result.matchScore || 0),
    }));

    // LINE通知を送信
    const notified = await notifyWeeklyRecommendations(recommendations);

    if (notified) {
      console.log("[Scheduler] Weekly notification sent successfully");
    } else {
      console.error("[Scheduler] Failed to send weekly notification");
    }
  } catch (error) {
    console.error("[Scheduler] Error in weekly notification job:", error);
  }
}

/**
 * テスト用：即座にテスト通知を送信
 */
export async function sendTestNotificationNow(): Promise<void> {
  console.log("[Scheduler] Sending test notification...");
  const result = await sendTestNotification();
  if (result) {
    console.log("[Scheduler] Test notification sent successfully");
  } else {
    console.error("[Scheduler] Failed to send test notification");
  }
}

/**
 * スケジューラーを初期化
 */
export function initializeSchedulers(): void {
  console.log("[Scheduler] Initializing schedulers...");

  try {
    scheduleWeeklyNotification();
    scheduleDailyFlyerCheck();
    console.log("[Scheduler] All schedulers initialized successfully");
  } catch (error) {
    console.error("[Scheduler] Error initializing schedulers:", error);
  }
}
