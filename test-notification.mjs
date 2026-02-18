import { notifyOwner } from "./server/_core/notification.ts";

async function testNotification() {
  try {
    console.log("Sending test notification...");
    const result = await notifyOwner({
      title: "🧪 家計防衛エージェント - テスト通知",
      content: `
家計防衛エージェントのテスト通知です。

このメッセージが表示されていれば、Manusの通知機能が正常に動作しています。

毎週金曜日夜8時にお得な商品情報をお送りします。
      `.trim()
    });
    
    console.log("Notification result:", result);
    if (result) {
      console.log("✅ テスト通知が送信されました");
    } else {
      console.log("❌ テスト通知の送信に失敗しました");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testNotification();
