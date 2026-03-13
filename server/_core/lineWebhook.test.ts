import { describe, it, expect } from 'vitest';
import { validateLineSignature } from './lineWebhook';
import crypto from 'crypto';

describe('LINE Webhook署名検証', () => {
  it('正当な署名を検証できる', () => {
    const channelSecret = 'test-channel-secret';
    const body = '{"events":[{"type":"follow","source":{"userId":"U1234567890abcdef1234567890abcdef"}}]}';
    
    // 正当な署名を生成
    const signature = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');
    
    // 検証
    const result = validateLineSignature(body, signature, channelSecret);
    expect(result).toBe(true);
  });

  it('不正な署名を拒否する', () => {
    const channelSecret = 'test-channel-secret';
    const body = '{"events":[{"type":"follow"}]}';
    const invalidSignature = 'invalid-signature-string';
    
    // 検証
    const result = validateLineSignature(body, invalidSignature, channelSecret);
    expect(result).toBe(false);
  });

  it('異なるボディで署名検証に失敗する', () => {
    const channelSecret = 'test-channel-secret';
    const body1 = '{"events":[{"type":"follow"}]}';
    const body2 = '{"events":[{"type":"message"}]}';
    
    // body1の署名を生成
    const signature = crypto
      .createHmac('sha256', channelSecret)
      .update(body1)
      .digest('base64');
    
    // body2で検証（失敗するはず）
    const result = validateLineSignature(body2, signature, channelSecret);
    expect(result).toBe(false);
  });

  it('空の署名を拒否する', () => {
    const channelSecret = 'test-channel-secret';
    const body = '{"events":[]}';
    const emptySignature = '';
    
    const result = validateLineSignature(body, emptySignature, channelSecret);
    expect(result).toBe(false);
  });

  it('複数のイベントを含むボディで署名検証できる', () => {
    const channelSecret = 'test-channel-secret';
    const body = JSON.stringify({
      events: [
        {
          type: 'follow',
          source: { userId: 'U1234567890abcdef1234567890abcdef' },
          timestamp: 1462629479859,
        },
        {
          type: 'message',
          source: { userId: 'U1234567890abcdef1234567890abcdef' },
          message: { type: 'text', text: 'Hello' },
          timestamp: 1462629479859,
        },
      ],
    });
    
    // 正当な署名を生成
    const signature = crypto
      .createHmac('sha256', channelSecret)
      .update(body)
      .digest('base64');
    
    // 検証
    const result = validateLineSignature(body, signature, channelSecret);
    expect(result).toBe(true);
  });
});
