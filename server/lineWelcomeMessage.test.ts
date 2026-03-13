import { describe, it, expect } from 'vitest';
import {
  generateWelcomeTextMessage,
  generateWelcomeFlexMessage,
  generateWelcomeHtmlMessage,
} from './lineWelcomeMessage';

describe('LINE Botウェルカムメッセージ生成', () => {
  describe('テキスト形式', () => {
    it('ウェルカムメッセージを生成できる', () => {
      const message = generateWelcomeTextMessage();
      
      expect(message).toContain('🎯 家計防衛エージェント');
      expect(message).toContain('へようこそ');
      expect(message).toContain('📱 このBotの機能');
      expect(message).toContain('💡 使い方');
    });

    it('機能説明を含む', () => {
      const message = generateWelcomeTextMessage();
      
      expect(message).toContain('📸 レシート分析');
      expect(message).toContain('🏪 チラシ連携');
      expect(message).toContain('💰 スマートマッチング');
      expect(message).toContain('🔔 週次通知');
    });

    it('ダッシュボードリンクを含む', () => {
      const message = generateWelcomeTextMessage();
      
      expect(message).toContain('https://budgagent-mm8dcses.manus.space/dashboard');
    });

    it('実績情報を含む', () => {
      const message = generateWelcomeTextMessage();
      
      expect(message).toContain('¥1,450');
      expect(message).toContain('8件');
    });
  });

  describe('Flex Message形式', () => {
    it('Flex Messageを生成できる', () => {
      const message = generateWelcomeFlexMessage();
      
      expect(message.type).toBe('flex');
      expect(message.altText).toContain('家計防衛エージェント');
      expect(message.contents).toBeDefined();
    });

    it('Flex Messageの構造が正しい', () => {
      const message = generateWelcomeFlexMessage();
      
      expect(message.contents.type).toBe('bubble');
      expect(message.contents.body).toBeDefined();
      expect(message.contents.body.type).toBe('box');
      expect(message.contents.body.layout).toBe('vertical');
    });

    it('ボタンアクションを含む', () => {
      const message = generateWelcomeFlexMessage();
      const body = message.contents.body;
      
      // ボタンを探す
      const hasButton = body.contents.some((content: any) => 
        content.type === 'button' && content.action?.type === 'uri'
      );
      
      expect(hasButton).toBe(true);
    });

    it('ダッシュボードへのリンクを含む', () => {
      const message = generateWelcomeFlexMessage();
      const messageStr = JSON.stringify(message);
      
      expect(messageStr).toContain('https://budgagent-mm8dcses.manus.space/dashboard');
    });

    it('実績情報を含む', () => {
      const message = generateWelcomeFlexMessage();
      const messageStr = JSON.stringify(message);
      
      expect(messageStr).toContain('¥1,450');
      expect(messageStr).toContain('8件');
    });
  });

  describe('HTML形式', () => {
    it('HTMLメッセージを生成できる', () => {
      const message = generateWelcomeHtmlMessage('ニシカワ');
      
      expect(message).toContain('<!DOCTYPE html>');
      expect(message).toContain('</html>');
      expect(message).toContain('ニシカワさん');
    });

    it('HTMLの基本構造を含む', () => {
      const message = generateWelcomeHtmlMessage('テスト');
      
      expect(message).toContain('<head>');
      expect(message).toContain('<body>');
      expect(message).toContain('<style>');
    });

    it('機能説明を含む', () => {
      const message = generateWelcomeHtmlMessage('テスト');
      
      // HTMLでは絵文字が数値参照に変換される可能性があるため、テキストで確認
      expect(message).toContain('レシート分析');
      expect(message).toContain('チラシ連携');
      expect(message).toContain('スマートマッチング');
      expect(message).toContain('週次通知');
    });

    it('ダッシュボードリンクを含む', () => {
      const message = generateWelcomeHtmlMessage('テスト');
      
      expect(message).toContain('https://budgagent-mm8dcses.manus.space/dashboard');
    });

    it('実績情報を含む', () => {
      const message = generateWelcomeHtmlMessage('テスト');
      
      expect(message).toContain('¥1,450');
      expect(message).toContain('8件');
      expect(message).toContain('4店舗');
    });

    it('ユーザー名をカスタマイズできる', () => {
      const message1 = generateWelcomeHtmlMessage('ニシカワ');
      const message2 = generateWelcomeHtmlMessage('太郎');
      
      expect(message1).toContain('ニシカワさん');
      expect(message2).toContain('太郎さん');
      expect(message1).not.toContain('太郎');
      expect(message2).not.toContain('ニシカワ');
    });
  });

  describe('メッセージ形式の一貫性', () => {
    it('すべての形式が同じ主要情報を含む', () => {
      const text = generateWelcomeTextMessage();
      const flex = generateWelcomeFlexMessage();
      const html = generateWelcomeHtmlMessage('テスト');
      
      const flexStr = JSON.stringify(flex);
      
      // 共通の情報
      expect(text).toContain('家計防衛エージェント');
      expect(flexStr).toContain('家計防衛エージェント');
      expect(html).toContain('家計防衛エージェント');
      
      // ダッシュボードリンク
      expect(text).toContain('dashboard');
      expect(flexStr).toContain('dashboard');
      expect(html).toContain('dashboard');
    });
  });
});
