import crypto from 'crypto';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const userLineId = 'Uc7039bdb6ec82c265b43e964d85f571c';

console.log('📤 実際のマッチング通知を送信中...\n');

// 実際のマッチング通知メッセージ（改善版フォーマット）
const actualMessage = {
  type: 'text',
  text: `🎯 家計防衛エージェント - 週次通知

💰 今週の節約チャンス
📊 総節約可能額: ¥1,450
🛍️ マッチ商品: 8件
🏪 対象店舗: 4店舗

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏪 フィール野田店
💚 節約額: ¥530
📦 マッチ商品:
  1. いちご
     定価: ¥1,780 → 特価: ¥1,280
     💚 ¥500節約 (28%OFF)
  
  2. 豚肉（国産）
     定価: ¥980 → 特価: ¥680
     💚 ¥300節約 (31%OFF)

━━━━━━━━━━━━━━━━━━━━━━━━━━

🏪 バロー千音寺店
💚 節約額: ¥420
📦 マッチ商品:
  1. トマト
     定価: ¥380 → 特価: ¥280
     💚 ¥100節約 (26%OFF)

━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 ご利用方法:
1️⃣ ダッシュボードで詳細を確認
2️⃣ 店舗に行く前にチェック
3️⃣ 節約商品をカゴに入れる

🔗 ダッシュボード: https://budgagent-mm8dcses.manus.space/dashboard

質問や設定変更は、このBotに「ヘルプ」と送信してください。`
};

const sendNotification = async () => {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userLineId,
        messages: [actualMessage],
      }),
    });

    console.log('📊 レスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 送信失敗');
      console.error('エラー:', errorText);
      return false;
    }

    console.log('✅ 実際のマッチング通知を送信しました！');
    console.log('\n📱 LINEアプリで確認してください。');
    return true;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return false;
  }
};

await sendNotification();
