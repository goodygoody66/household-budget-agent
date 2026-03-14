import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';

describe('LINE認証情報の検証', () => {
  let channelSecret: string;
  let channelAccessToken: string;

  beforeAll(() => {
    channelSecret = process.env.LINE_CHANNEL_SECRET || '';
    channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
  });

  it('LINE_CHANNEL_SECRETが設定されている', () => {
    expect(channelSecret).toBeTruthy();
    expect(channelSecret.length).toBeGreaterThan(0);
  });

  it('LINE_CHANNEL_ACCESS_TOKENが設定されている', () => {
    expect(channelAccessToken).toBeTruthy();
    expect(channelAccessToken.length).toBeGreaterThan(0);
  });

  it('Channel Secretは32文字の16進数', () => {
    expect(channelSecret).toMatch(/^[a-f0-9]{32}$/i);
  });

  it('Channel Access Tokenは有効な形式', () => {
    // Channel Access TokenはBase64エンコードされた長い文字列
    expect(channelAccessToken.length).toBeGreaterThan(100);
    // Base64文字を含む
    expect(channelAccessToken).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('Webhook署名検証に使用できる', () => {
    const body = '{"events":[{"type":"follow"}]}';
    
    // Channel Secretを使用してHMAC-SHA256署名を生成
    const signature = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');
    
    // 署名が生成されていることを確認
    expect(signature).toBeTruthy();
    expect(signature.length).toBeGreaterThan(0);
  });

  it('Channel Access Tokenが正しく設定されている', () => {
    // トークンが提供されているか確認
    expect(channelAccessToken).not.toContain('undefined');
    expect(channelAccessToken).not.toContain('null');
    
    // 最小限の長さを確認（通常は150文字以上）
    expect(channelAccessToken.length).toBeGreaterThan(100);
  });
});
