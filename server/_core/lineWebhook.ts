import crypto from 'crypto';

/**
 * LINE Webhook署名検証
 * LINE Messaging APIからのリクエストが正当なものか確認
 * 
 * @param body リクエストボディ（JSON文字列）
 * @param signature X-Line-Signature ヘッダー値
 * @param channelSecret LINE チャネルシークレット
 * @returns 署名が正当な場合true
 */
export function validateLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  } catch (error) {
    console.error('LINE署名検証エラー:', error);
    return false;
  }
}

/**
 * LINE Webhook イベント型定義
 */
export interface LineWebhookEvent {
  type: 'message' | 'follow' | 'unfollow' | 'join' | 'leave' | 'postback' | 'beacon';
  message?: {
    type: string;
    text?: string;
    id?: string;
  };
  source: {
    type: 'user' | 'group' | 'room';
    userId: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken?: string;
  timestamp: number;
}

/**
 * LINE Webhook リクエスト型定義
 */
export interface LineWebhookRequest {
  events: LineWebhookEvent[];
}

/**
 * LINE Webhook署名検証ミドルウェア用ヘルパー
 */
export function createLineWebhookValidator(channelSecret: string) {
  return (body: string, signature: string): boolean => {
    return validateLineSignature(body, signature, channelSecret);
  };
}
