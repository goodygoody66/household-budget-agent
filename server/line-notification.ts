import { notifyOwner } from "./_core/notification";

/**
 * LINE通知機能
 * Manusの内蔵LINE通知APIを使用してユーザーに通知を送信
 */

interface LineNotificationPayload {
  title: string;
  content: string;
  type: "flyer_update" | "weekly_recommendation" | "deal_alert";
}

/**
 * チラシ更新時の即座通知
 */
export async function notifyFlyerUpdate(
  storeName: string,
  flyerTitle: string,
  flyerUrl: string
): Promise<boolean> {
  const title = `📢 ${storeName}のチラシが更新されました`;
  const content = `
【${storeName}】
${flyerTitle}

詳細はこちら: ${flyerUrl}
  `.trim();

  try {
    const result = await notifyOwner({ title, content });
    console.log("[LINE Notification] Flyer update notification sent:", result);
    return result;
  } catch (error) {
    console.error("[LINE Notification] Error sending flyer update notification:", error);
    return false;
  }
}

/**
 * 毎週金曜日夜のまとめ通知
 */
export async function notifyWeeklyRecommendations(
  recommendations: WeeklyRecommendation[]
): Promise<boolean> {
  if (recommendations.length === 0) {
    console.log("[LINE Notification] No recommendations to send");
    return true;
  }

  const title = "🛒 今週のお得な商品情報";
  let content = "今週見つかったお得な商品をまとめました！\n\n";

  // スーパーごとにグループ化
  const groupedByStore = recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.storeName]) {
        acc[rec.storeName] = [];
      }
      acc[rec.storeName].push(rec);
      return acc;
    },
    {} as Record<string, WeeklyRecommendation[]>
  );

  // スーパーごとに推奨商品を表示
  for (const [storeName, items] of Object.entries(groupedByStore)) {
    content += `\n【${storeName}】\n`;
    for (const item of items.slice(0, 3)) {
      // 上位3件まで表示
      const savings = item.regularPrice - item.salePrice;
      const savingsPercent = ((savings / item.regularPrice) * 100).toFixed(0);
      content += `  • ${item.itemName}\n`;
      content += `    通常: ¥${item.regularPrice} → セール: ¥${item.salePrice}\n`;
      content += `    節約: ¥${savings} (${savingsPercent}%OFF)\n`;
    }
    if (items.length > 3) {
      content += `  ... 他${items.length - 3}件\n`;
    }
  }

  content += "\n家計防衛エージェントより";

  try {
    const result = await notifyOwner({ title, content });
    console.log("[LINE Notification] Weekly recommendations sent:", result);
    return result;
  } catch (error) {
    console.error("[LINE Notification] Error sending weekly recommendations:", error);
    return false;
  }
}

/**
 * 特別なセール情報の即座通知
 */
export async function notifyDealAlert(
  storeName: string,
  itemName: string,
  regularPrice: number,
  salePrice: number
): Promise<boolean> {
  const savings = regularPrice - salePrice;
  const savingsPercent = ((savings / regularPrice) * 100).toFixed(0);

  const title = `🔥 ${storeName}で大特価！`;
  const content = `
${itemName}
通常価格: ¥${regularPrice}
セール価格: ¥${salePrice}
節約額: ¥${savings} (${savingsPercent}%OFF)

今がお買い得です！
  `.trim();

  try {
    const result = await notifyOwner({ title, content });
    console.log("[LINE Notification] Deal alert sent:", result);
    return result;
  } catch (error) {
    console.error("[LINE Notification] Error sending deal alert:", error);
    return false;
  }
}

/**
 * テスト通知を送信
 */
export async function sendTestNotification(): Promise<boolean> {
  const title = "🧪 テスト通知";
  const content = `
家計防衛エージェントのLINE通知が正常に動作しています。

このメッセージが届いていれば、セットアップは完了です！

毎週金曜日夜8時にお得な商品情報をお送りします。
  `.trim();

  try {
    const result = await notifyOwner({ title, content });
    console.log("[LINE Notification] Test notification sent:", result);
    return result;
  } catch (error) {
    console.error("[LINE Notification] Error sending test notification:", error);
    return false;
  }
}

/**
 * 推奨商品の型定義
 */
export interface WeeklyRecommendation {
  storeName: string;
  itemName: string;
  category: string;
  regularPrice: number;
  salePrice: number;
  discountPercentage: number;
  userPurchaseFrequency: number;
  matchScore: number;
}
