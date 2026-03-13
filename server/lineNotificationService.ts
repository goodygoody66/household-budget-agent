/**
 * LINE Messaging API統合サービス
 * 改善版の通知フォーマットを使用
 */

import { generateLineTextNotification, generateLineFlexMessage } from './improvedNotificationGenerator';
import { sendLINENotification, getUserLINEIds } from './line';

interface MatchedItem {
  productName: string;
  purchasedPrice: number;
  flyerStore: string;
  flyerPrice: number;
  savings: number;
  savingsPercent: number;
  flyerUrl: string;
  discount: string;
  receiptDate: string;
}

/**
 * マッチング結果をLINEで送信
 */
export async function sendMatchingResultsToLINE(
  userId: number,
  matches: MatchedItem[]
): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
  try {
    // ユーザーのLINE IDを取得
    const lineUserIds = await getUserLINEIds(userId);

    if (lineUserIds.length === 0) {
      console.warn(`ユーザー ${userId} のLINE IDが見つかりません`);
      return { success: false, sentCount: 0, failedCount: 0 };
    }

    let sentCount = 0;
    let failedCount = 0;

    // 各LINE IDに通知を送信
    for (const lineUserId of lineUserIds) {
      try {
        // テキスト形式の通知を生成
        const textMessage = generateLineTextNotification(matches);

        // テキスト形式で送信
        const textResult = await sendLINENotification(lineUserId, {
          type: 'text',
          text: textMessage,
        });

        if (textResult) {
          sentCount++;
          console.log(`✅ LINE通知を送信しました (ユーザーID: ${lineUserId})`);
        } else {
          failedCount++;
          console.error(`❌ LINE通知の送信に失敗しました (ユーザーID: ${lineUserId})`);
        }

        // Flex Message形式でも送信（リッチな表示用）
        try {
          const flexMessage = generateLineFlexMessage(matches);
          await sendLINENotification(lineUserId, flexMessage as any);
          console.log(`✅ Flex Message を送信しました (ユーザーID: ${lineUserId})`);
        } catch (flexError) {
          console.warn(`⚠️ Flex Message の送信に失敗しました:`, flexError);
        }
      } catch (error) {
        failedCount++;
        console.error(`LINE通知送信エラー (ユーザーID: ${lineUserId}):`, error);
      }
    }

    return {
      success: sentCount > 0,
      sentCount,
      failedCount,
    };
  } catch (error) {
    console.error('LINE通知サービスエラー:', error);
    return { success: false, sentCount: 0, failedCount: 0 };
  }
}

/**
 * テスト用：LINE通知をシミュレート
 */
export async function simulateLINENotification(matches: MatchedItem[]): Promise<void> {
  console.log('='.repeat(70));
  console.log('📱 LINE通知シミュレーション');
  console.log('='.repeat(70));

  // テキスト形式
  console.log('\n【テキスト形式】');
  console.log(generateLineTextNotification(matches));

  // Flex Message形式
  console.log('\n【Flex Message形式（JSON）】');
  const flexMessage = generateLineFlexMessage(matches);
  console.log(JSON.stringify(flexMessage, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('✅ LINE通知シミュレーション完了');
  console.log('='.repeat(70));
}

/**
 * 定期実行用：毎週金曜日夜8時にマッチング結果をLINE送信
 */
export async function scheduleWeeklyLINENotification(
  userId: number,
  matches: MatchedItem[]
): Promise<void> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();

  // 金曜日（5）かつ20時（20:00-20:59）をチェック
  if (dayOfWeek === 5 && hours === 20) {
    console.log(`📅 毎週金曜日夜8時のLINE通知を送信します`);
    await sendMatchingResultsToLINE(userId, matches);
  }
}
