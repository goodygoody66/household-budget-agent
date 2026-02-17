import { sendTestNotification } from "./line-notification";

/**
 * テスト用：LINE通知機能のテスト
 */
export async function testLineNotification(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log("[Test] Starting LINE notification test...");

    const result = await sendTestNotification();

    if (result) {
      console.log("[Test] LINE notification test successful");
      return {
        success: true,
        message: "✅ テスト通知が送信されました。LINEを確認してください。",
      };
    } else {
      console.error("[Test] LINE notification test failed");
      return {
        success: false,
        message: "❌ テスト通知の送信に失敗しました。",
      };
    }
  } catch (error) {
    console.error("[Test] Error in LINE notification test:", error);
    return {
      success: false,
      message: `❌ エラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
