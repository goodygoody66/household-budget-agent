import * as db from "./db";
import { getUserLINEIds, sendLINENotification, createMatchingFlexMessage } from "./line";
import { invokeLLM } from "./_core/llm";

/**
 * ユーザーの購買傾向とチラシをマッチング
 */
export async function matchPurchasesWithFlyers(userId: number): Promise<any[]> {
  try {
    // ユーザーの購買傾向を取得
    const trends = await db.getUserPurchaseTrends(userId);
    
    if (trends.length === 0) {
      return [];
    }

    // ユーザーの店舗を取得
    const supermarkets = await db.getUserSupermarkets(userId);
    
    const matchingResults: any[] = [];

    for (const supermarket of supermarkets) {
      // 店舗の最新チラシを取得
      const flyers = await db.getSupermarketFlyers(supermarket.id);
      
      if (flyers.length === 0) {
        continue;
      }

      const latestFlyer = flyers[0];
      const flyerItems = JSON.parse(latestFlyer.items as any);

      // 購買傾向とチラシをマッチング
      for (const trend of trends) {
        for (const flyerItem of flyerItems) {
          // 商品名が類似しているかチェック
          if (isSimilarProduct(trend.itemName, flyerItem.name)) {
            const savingsAmount = flyerItem.regularPrice - flyerItem.salePrice;
              const matchScore = calculateMatchScore(
                trend.purchaseCount || 0,
              savingsAmount,
              flyerItem.discount
            );

            if (matchScore >= 50) {
              // マッチング結果を保存
              const result = await db.createMatchingResult({
                userId,
                flyerId: latestFlyer.id,
                purchaseTrendId: trend.id,
                itemName: flyerItem.name,
                category: flyerItem.category,
                regularPrice: flyerItem.regularPrice.toString(),
                salePrice: flyerItem.salePrice.toString(),
                savingsAmount: savingsAmount.toString(),
                discountPercentage: flyerItem.discount.toString(),
                userPurchaseFrequency: trend.purchaseCount || 0,
                matchScore: matchScore.toString(),
                isRecommended: 1,
              });

              matchingResults.push({
                ...result,
                storeName: supermarket.name,
              });
            }
          }
        }
      }
    }

    return matchingResults;
  } catch (error) {
    console.error("マッチング処理エラー:", error);
    return [];
  }
}

/**
 * 商品名の類似度をチェック
 */
function isSimilarProduct(name1: string, name2: string): boolean {
  // 簡易的な類似度チェック
  const n1 = name1.toLowerCase();
  const n2 = name2.toLowerCase();

  // 完全一致
  if (n1 === n2) return true;

  // 部分一致
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // 最初の3文字が同じ
  if (n1.substring(0, 3) === n2.substring(0, 3)) return true;

  return false;
}

/**
 * マッチスコアを計算
 */
function calculateMatchScore(
  purchaseFrequency: number,
  savingsAmount: number,
  discountPercentage: number
): number {
  // 購買頻度（0-30点）
  const frequencyScore = Math.min(purchaseFrequency * 3, 30);

  // 節約額（0-40点）
  const savingsScore = Math.min(savingsAmount / 10, 40);

  // 割引率（0-30点）
  const discountScore = Math.min(discountPercentage, 30);

  return frequencyScore + savingsScore + discountScore;
}

/**
 * 毎週金曜日夜8時にマッチング結果を通知
 */
export async function sendWeeklyNotifications(): Promise<void> {
  try {
    console.log("[NotificationScheduler] Starting weekly notification...");

    // すべてのユーザーを取得
    const database = await db.getDb();
    if (!database) {
      console.error("Database not available");
      return;
    }

    const { users } = await import("../drizzle/schema");
    const allUsers = await database.select().from(users);

    for (const user of allUsers) {
      try {
        // ユーザーのマッチング結果を取得
        const matchingResults = await matchPurchasesWithFlyers(user.id);

        if (matchingResults.length === 0) {
          console.log(`[NotificationScheduler] No matching results for user ${user.id}`);
          continue;
        }

        // マッチング結果を集計
        const totalSavings = matchingResults.reduce(
          (sum, result) => sum + parseFloat(result.savingsAmount),
          0
        );

        const matchingData = {
          totalSavings,
          matchedItems: matchingResults.slice(0, 10), // 上位10件
          excludedCategories: [],
        };

        // LINE通知を送信
        const lineIds = await getUserLINEIds(user.id);
        if (lineIds.length > 0) {
          const flexMessage = createMatchingFlexMessage(matchingData);

          for (const lineId of lineIds) {
            await sendLINENotification(lineId, flexMessage);
          }

          console.log(
            `[NotificationScheduler] Sent notification to user ${user.id} (${lineIds.length} devices)`
          );
        }
      } catch (error) {
        console.error(`[NotificationScheduler] Error processing user ${user.id}:`, error);
      }
    }

    console.log("[NotificationScheduler] Weekly notification completed");
  } catch (error) {
    console.error("[NotificationScheduler] Error:", error);
  }
}

/**
 * スケジューラーを開始（毎週金曜日夜8時に実行）
 */
export function startNotificationScheduler(): void {
  // 毎週金曜日夜8時に実行
  const now = new Date();
  const nextFriday = getNextFriday(now);
  nextFriday.setHours(20, 0, 0, 0); // 夜8時

  const msUntilNextFriday = nextFriday.getTime() - now.getTime();

  setTimeout(() => {
    sendWeeklyNotifications();
    // 1週間ごとに実行
    setInterval(sendWeeklyNotifications, 7 * 24 * 60 * 60 * 1000);
  }, msUntilNextFriday);

  console.log(`[NotificationScheduler] Scheduler started (next run: ${nextFriday})`);
}

/**
 * 次の金曜日を取得
 */
function getNextFriday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7; // 5 = Friday
  d.setDate(d.getDate() + daysUntilFriday);
  return d;
}
