/**
 * LINE Bot友達追加時のウェルカムメッセージ生成
 * 改善版通知フォーマットを使用した美しいメッセージ
 */

/**
 * テキスト形式のウェルカムメッセージを生成
 */
export function generateWelcomeTextMessage(): string {
  return `🎯 家計防衛エージェントへようこそ！

ニシカワさんのお買い物をサポートします💚

━━━━━━━━━━━━━━━━━━━━

📱 このBotの機能：

1️⃣ 📸 レシート分析
   レシート画像をアップロードすると、購入商品を自動認識

2️⃣ 🏪 チラシ連携
   トクバイ・Shufoo!の最新チラシを自動取得

3️⃣ 💰 スマートマッチング
   あなたの購買履歴とチラシ情報を比較

4️⃣ 🔔 週次通知
   毎週金曜日夜8時に、節約チャンスをお知らせ

━━━━━━━━━━━━━━━━━━━━

💡 使い方：

1. ダッシュボードでスーパーを登録
2. レシート画像をアップロード
3. 毎週のおすすめ商品を受け取る

📊 先週の実績：
   • 総節約可能額: ¥1,450
   • マッチ商品: 8件
   • 対象店舗: 4店舗

━━━━━━━━━━━━━━━━━━━━

🚀 さあ、始めましょう！
ダッシュボードにアクセスして、
最初のスーパーを登録してください。

🔗 ダッシュボード：
https://budgagent-mm8dcses.manus.space/dashboard`;
}

/**
 * Flex Message形式のウェルカムメッセージを生成
 */
export function generateWelcomeFlexMessage(): any {
  return {
    type: 'flex',
    altText: '🎯 家計防衛エージェントへようこそ！',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎯 家計防衛エージェント',
            weight: 'bold',
            size: 'xl',
            color: '#667eea',
          },
          {
            type: 'text',
            text: 'へようこそ！',
            size: 'sm',
            color: '#999999',
            margin: 'md',
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'md',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '📱 このBotの機能',
                    weight: 'bold',
                    size: 'sm',
                    color: '#333333',
                  },
                  {
                    type: 'text',
                    text: '1️⃣ レシート分析 - 購入商品を自動認識',
                    size: 'xs',
                    color: '#666666',
                    margin: 'sm',
                  },
                  {
                    type: 'text',
                    text: '2️⃣ チラシ連携 - 最新チラシを自動取得',
                    size: 'xs',
                    color: '#666666',
                    margin: 'sm',
                  },
                  {
                    type: 'text',
                    text: '3️⃣ スマートマッチング - 節約チャンスを発見',
                    size: 'xs',
                    color: '#666666',
                    margin: 'sm',
                  },
                  {
                    type: 'text',
                    text: '4️⃣ 週次通知 - 毎週金曜日夜8時にお知らせ',
                    size: 'xs',
                    color: '#666666',
                    margin: 'sm',
                  },
                ],
              },
              {
                type: 'separator',
              },
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '💡 次のステップ',
                    weight: 'bold',
                    size: 'sm',
                    color: '#333333',
                  },
                  {
                    type: 'text',
                    text: '1. ダッシュボードでスーパーを登録',
                    size: 'xs',
                    color: '#666666',
                    margin: 'sm',
                  },
                  {
                    type: 'text',
                    text: '2. レシート画像をアップロード',
                    size: 'xs',
                    color: '#666666',
                    margin: 'sm',
                  },
                  {
                    type: 'text',
                    text: '3. 毎週のおすすめ商品を受け取る',
                    size: 'xs',
                    color: '#666666',
                    margin: 'sm',
                  },
                ],
              },
            ],
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '📊 先週の実績',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 0,
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                margin: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '総節約可能額',
                    color: '#999999',
                    size: 'xs',
                    flex: 0,
                  },
                  {
                    type: 'filler',
                  },
                  {
                    type: 'text',
                    text: '¥1,450',
                    color: '#00aa00',
                    size: 'xs',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                margin: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'マッチ商品',
                    color: '#999999',
                    size: 'xs',
                    flex: 0,
                  },
                  {
                    type: 'filler',
                  },
                  {
                    type: 'text',
                    text: '8件',
                    color: '#666666',
                    size: 'xs',
                  },
                ],
              },
            ],
          },
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '🚀 ダッシュボードを開く',
              uri: 'https://budgagent-mm8dcses.manus.space/dashboard',
            },
            margin: 'lg',
          },
        ],
      },
    },
  };
}

/**
 * HTML形式のウェルカムメール用テンプレート
 */
export function generateWelcomeHtmlMessage(userName: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>家計防衛エージェント - ようこそ！</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 30px 20px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 18px;
      color: #333;
      margin: 0 0 15px 0;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .feature-list li {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .feature-list li:last-child {
      border-bottom: none;
    }
    .feature-number {
      display: inline-block;
      background-color: #667eea;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      text-align: center;
      line-height: 28px;
      margin-right: 10px;
      font-weight: bold;
      font-size: 14px;
    }
    .stats {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .stat-item:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #999;
      font-size: 14px;
    }
    .stat-value {
      color: #00aa00;
      font-weight: bold;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 20px;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 家計防衛エージェント</h1>
      <p>${userName}さん、ようこそ！</p>
    </div>

    <div class="content">
      <div class="section">
        <h2>📱 このBotの機能</h2>
        <ul class="feature-list">
          <li><span class="feature-number">1</span> 📸 <strong>レシート分析</strong> - 購入商品を自動認識</li>
          <li><span class="feature-number">2</span> 🏪 <strong>チラシ連携</strong> - 最新チラシを自動取得</li>
          <li><span class="feature-number">3</span> 💰 <strong>スマートマッチング</strong> - 節約チャンスを発見</li>
          <li><span class="feature-number">4</span> 🔔 <strong>週次通知</strong> - 毎週金曜日夜8時にお知らせ</li>
        </ul>
      </div>

      <div class="section">
        <h2>💡 使い方</h2>
        <ol style="padding-left: 20px;">
          <li>ダッシュボードでスーパーを登録</li>
          <li>レシート画像をアップロード</li>
          <li>毎週のおすすめ商品を受け取る</li>
        </ol>
      </div>

      <div class="section">
        <h2>📊 先週の実績</h2>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">総節約可能額</span>
            <span class="stat-value">¥1,450</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">マッチ商品</span>
            <span class="stat-value">8件</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">対象店舗</span>
            <span class="stat-value">4店舗</span>
          </div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://budgagent-mm8dcses.manus.space/dashboard" class="cta-button">
          🚀 ダッシュボードを開く
        </a>
      </div>
    </div>

    <div class="footer">
      <p>このメールは自動送信です。返信はしないでください。</p>
      <p>© 2026 家計防衛エージェント All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
