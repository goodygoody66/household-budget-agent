/**
 * Auto Notification Service - 自動通知機能
 * サーバー起動時にリアルなマッチング分析結果を自動送信
 */

import { notifyOwner } from "./_core/notification";
import { analyzeRealDataV2 } from "./realDataAnalysisV2";
import { generateDetailedTextNotification } from "./notificationTemplate";

let notificationSent = false;

export async function initializeAutoNotification(): Promise<void> {
  if (notificationSent) {
    return;
  }

  try {
    console.log("[AutoNotification] Starting automatic notification service...");
    
    // 複数店舗・ユニット情報対応の実データ分析を実行
    const analysisResult = analyzeRealDataV2();
    
    console.log(`[AutoNotification] Generated analysis with ${analysisResult.matchedItems.length} matched items`);
    console.log(`[AutoNotification] Total savings: ¥${analysisResult.totalSavings}`);
    console.log(`[AutoNotification] Stores included: ${analysisResult.storesIncluded.map((s) => s.storeName).join(", ")}`);
    
    // 詳細な通知テンプレートを生成
    const detailedItems = analysisResult.matchedItems.map((item) => ({
      itemName: `${item.itemName} (${item.quantity}${item.unit})`,
      receiptPrice: item.receiptPrice,
      receiptStore: item.receiptStore,
      flyerPrice: item.flyerPrice,
      flyerStore: item.flyerStore,
      savings: item.savings,
      savingsPercentage: item.savingsPercentage,
    }));
    
    const textContent = generateDetailedTextNotification(detailedItems, analysisResult.totalSavings);
    
    // 通知を送信
    const result = await notifyOwner({
      title: `【自動分析】購買データとチラシのマッチング結果 - 総節約額¥${analysisResult.totalSavings}`,
      content: textContent,
    });
    
    if (result) {
      console.log("[AutoNotification] ✓ Notification sent successfully");
      notificationSent = true;
    } else {
      console.log("[AutoNotification] ✗ Failed to send notification");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[AutoNotification] Error: ${errorMessage}`);
  }
}

export function isNotificationSent(): boolean {
  return notificationSent;
}

export function resetNotificationStatus(): void {
  notificationSent = false;
}
