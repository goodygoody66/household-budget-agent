import crypto from 'crypto';

// 環境変数から認証情報を取得
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

if (!channelAccessToken || !channelSecret) {
  console.error('❌ LINE認証情報が設定されていません');
  console.error('LINE_CHANNEL_ACCESS_TOKEN:', channelAccessToken ? '✅ 設定済み' : '❌ 未設定');
  console.error('LINE_CHANNEL_SECRET:', channelSecret ? '✅ 設定済み' : '❌ 未設定');
  process.exit(1);
}

console.log('✅ LINE認証情報が正しく設定されています');
console.log('Channel Access Token:', channelAccessToken.substring(0, 20) + '...');
console.log('Channel Secret:', channelSecret.substring(0, 20) + '...');

// テスト用のLINE User ID（実装時は実際のユーザーIDに置き換え）
// 注意: 実際には、ダッシュボードから取得したユーザーのLINE IDを使用する必要があります
const testLineUserId = 'U1234567890abcdef1234567890abcdef';

console.log('\n📱 LINE通知テストを実行します...');
console.log('送信先:', testLineUserId);

// テスト用のメッセージ
const testMessage = {
  type: 'text',
  text: '🎉 家計防衛エージェント\n\nLINE通知テスト\n\nこのメッセージが表示されたら、LINE通知が正常に動作しています！',
};

// LINE Messaging APIに通知を送信
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
        to: testLineUserId,
        messages: [testMessage],
      }),
    });

    console.log('📊 レスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE通知送信失敗');
      console.error('ステータス:', response.status);
      console.error('エラー内容:', errorText);
      
      // 404エラーの場合は、User IDが存在しないことを示す
      if (response.status === 404) {
        console.log('\n💡 注意: テスト用のUser IDが存在しません。');
        console.log('実際のLINE User IDを使用してテストしてください。');
      }
      
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

// 実行
await sendNotification();
