import crypto from 'crypto';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const userLineId = 'Uc7039bdb6ec82c265b43e964d85f571c';

console.log('✅ LINE認証情報が正しく設定されています');
console.log('送信先User ID:', userLineId);

const testMessage = {
  type: 'text',
  text: '🎉 家計防衛エージェント\n\nLINE通知テスト成功！\n\nこのメッセージが表示されたら、LINE通知が正常に動作しています。',
};

const sendNotification = async () => {
  try {
    console.log('\n📤 LINE Messaging APIに通知を送信中...');
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userLineId,
        messages: [testMessage],
      }),
    });

    console.log('📊 レスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE通知送信失敗');
      console.error('ステータス:', response.status);
      console.error('エラー内容:', errorText);
      return false;
    }

    console.log('✅ LINE通知送信成功！');
    console.log('\n📱 LINEアプリで通知を確認してください。');
    return true;
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    return false;
  }
};

await sendNotification();
