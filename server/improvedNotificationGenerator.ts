/**
 * 改善版通知メッセージ生成エンジン
 * より直感的でわかりやすいフォーマット
 * 「どの店に行けばどうお得か」が一目瞭然
 */

interface MatchedItem {
  productName: string;
  purchasedPrice: number;
  flyerStore: string;
  flyerPrice: number;
  savings: number;
  savingsPercent: number;
  flyerUrl: string;
  discount: string;
  receiptDate: string;
}

interface StoreGroupedMatches {
  [storeName: string]: MatchedItem[];
}

/**
 * マッチング結果を店舗ごとにグループ化
 */
function groupMatchesByStore(matches: MatchedItem[]): StoreGroupedMatches {
  return matches.reduce((acc, match) => {
    if (!acc[match.flyerStore]) {
      acc[match.flyerStore] = [];
    }
    acc[match.flyerStore].push(match);
    return acc;
  }, {} as StoreGroupedMatches);
}

/**
 * LINE向けのテキスト形式通知を生成（コンパクト版）
 */
export function generateLineTextNotification(matches: MatchedItem[]): string {
  const grouped = groupMatchesByStore(matches);
  const totalSavings = matches.reduce((sum, m) => sum + m.savings, 0);

  let message = `🎯 家計防衛エージェント\n`;
  message += `💰 今週の節約チャンス\n\n`;
  message += `📊 総節約可能額: ¥${totalSavings.toLocaleString()}\n`;
  message += `🛍️ マッチ商品: ${matches.length}件\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 店舗ごとの推奨を表示
  Object.entries(grouped).forEach(([store, items]) => {
    const storeTotalSavings = items.reduce((sum, item) => sum + item.savings, 0);
    message += `🏪 ${store}\n`;
    message += `💚 節約額: ¥${storeTotalSavings.toLocaleString()}\n\n`;

    // 各店舗の上位3商品を表示
    items.slice(0, 3).forEach((item, index) => {
      message += `${index + 1}. ${item.productName}\n`;
      message += `   ¥${item.purchasedPrice} → ¥${item.flyerPrice}\n`;
      message += `   💚 ¥${item.savings}節約 (${item.savingsPercent}%OFF)\n\n`;
    });

    if (items.length > 3) {
      message += `   他${items.length - 3}件の節約商品あり\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  });

  message += `📅 マッチング対象: 2/25～3/8\n`;
  message += `🔗 詳細はダッシュボードで確認\n`;

  return message;
}

/**
 * LINE Flex Message用のJSON構造を生成
 */
export function generateLineFlexMessage(matches: MatchedItem[]) {
  const grouped = groupMatchesByStore(matches);
  const totalSavings = matches.reduce((sum, m) => sum + m.savings, 0);

  // 店舗ごとのセクションを生成
  const storeBlocks = Object.entries(grouped).map(([store, items]) => {
    const storeTotalSavings = items.reduce((sum, item) => sum + item.savings, 0);
    const topItems = items.slice(0, 3);

    return {
      type: 'box',
      layout: 'vertical',
      margin: 'md',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: `🏪 ${store}`,
              weight: 'bold',
              size: 'sm',
              flex: 0,
            },
            {
              type: 'filler',
            },
            {
              type: 'text',
              text: `💚 ¥${storeTotalSavings.toLocaleString()}`,
              size: 'sm',
              color: '#00aa00',
              weight: 'bold',
              align: 'end',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'md',
          spacing: 'sm',
          contents: topItems.map((item, idx) => ({
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              {
                type: 'text',
                text: `${idx + 1}. ${item.productName}`,
                size: 'xs',
                weight: 'bold',
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                margin: 'md',
                contents: [
                  {
                    type: 'text',
                    text: `¥${item.purchasedPrice}`,
                    size: 'xs',
                    color: '#999999',
                    flex: 0,
                    decoration: 'line-through',
                  },
                  {
                    type: 'filler',
                  },
                  {
                    type: 'text',
                    text: `¥${item.flyerPrice}`,
                    size: 'xs',
                    color: '#00aa00',
                    weight: 'bold',
                    flex: 0,
                  },
                ],
              },
              {
                type: 'text',
                text: `💚 ¥${item.savings}節約 (${item.savingsPercent}%OFF)`,
                size: 'xs',
                color: '#00aa00',
              },
            ],
          })),
        },
        ...(items.length > 3
          ? [
              {
                type: 'text',
                text: `他${items.length - 3}件の節約商品あり`,
                size: 'xs',
                color: '#999999',
                margin: 'md',
              },
            ]
          : []),
      ],
    };
  });

  return {
    type: 'flex',
    altText: '🎯 家計防衛エージェント - 今週の節約チャンス',
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
          },
          {
            type: 'text',
            text: '💰 今週の節約チャンス',
            size: 'sm',
            color: '#999999',
            margin: 'md',
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
                    text: '📊 総節約可能額',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 0,
                  },
                  {
                    type: 'filler',
                  },
                  {
                    type: 'text',
                    text: `¥${totalSavings.toLocaleString()}`,
                    wrap: true,
                    color: '#00aa00',
                    size: 'sm',
                    weight: 'bold',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: '🛍️ マッチ商品',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 0,
                  },
                  {
                    type: 'filler',
                  },
                  {
                    type: 'text',
                    text: `${matches.length}件`,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                  },
                ],
              },
            ],
          },
          {
            type: 'separator',
            margin: 'lg',
          },
          ...storeBlocks,
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
                type: 'text',
                text: '📅 マッチング対象: 2/25～3/8',
                size: 'xs',
                color: '#aaaaaa',
              },
              {
                type: 'text',
                text: '🔗 詳細はダッシュボードで確認',
                size: 'xs',
                color: '#0099ff',
                decoration: 'underline',
              },
            ],
          },
        ],
      },
    },
  };
}

/**
 * HTML形式の美しい通知テンプレート（メール用）
 */
export function generateHtmlNotification(matches: MatchedItem[]): string {
  const grouped = groupMatchesByStore(matches);
  const totalSavings = matches.reduce((sum, m) => sum + m.savings, 0);

  let html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>家計防衛エージェント - 今週の節約チャンス</title>
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
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 20px;
      background-color: #f9f9f9;
      border-bottom: 1px solid #eee;
    }
    .summary-item {
      text-align: center;
    }
    .summary-item .label {
      font-size: 12px;
      color: #999;
      margin-bottom: 5px;
    }
    .summary-item .value {
      font-size: 24px;
      font-weight: bold;
      color: #00aa00;
    }
    .content {
      padding: 20px;
    }
    .store-section {
      margin-bottom: 30px;
      border-left: 4px solid #667eea;
      padding-left: 15px;
    }
    .store-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .store-name {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    .store-savings {
      font-size: 18px;
      font-weight: bold;
      color: #00aa00;
    }
    .product-item {
      background-color: #f9f9f9;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 4px;
      border-left: 3px solid #00aa00;
    }
    .product-name {
      font-weight: bold;
      margin-bottom: 8px;
      color: #333;
    }
    .product-price {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .original-price {
      text-decoration: line-through;
      color: #999;
    }
    .sale-price {
      color: #00aa00;
      font-weight: bold;
    }
    .savings-info {
      color: #00aa00;
      font-weight: bold;
      font-size: 14px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
    .divider {
      height: 1px;
      background-color: #eee;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 家計防衛エージェント</h1>
      <p>💰 今週の節約チャンス</p>
    </div>

    <div class="summary">
      <div class="summary-item">
        <div class="label">📊 総節約可能額</div>
        <div class="value">¥${totalSavings.toLocaleString()}</div>
      </div>
      <div class="summary-item">
        <div class="label">🛍️ マッチ商品</div>
        <div class="value">${matches.length}件</div>
      </div>
    </div>

    <div class="content">
  `;

  // 店舗ごとのセクション
  Object.entries(grouped).forEach(([store, items]) => {
    const storeTotalSavings = items.reduce((sum, item) => sum + item.savings, 0);

    html += `
      <div class="store-section">
        <div class="store-header">
          <div class="store-name">🏪 ${store}</div>
          <div class="store-savings">💚 ¥${storeTotalSavings.toLocaleString()}</div>
        </div>
    `;

    items.slice(0, 5).forEach((item, idx) => {
      html += `
        <div class="product-item">
          <div class="product-name">${idx + 1}. ${item.productName}</div>
          <div class="product-price">
            <span class="original-price">¥${item.purchasedPrice}</span>
            <span class="sale-price">¥${item.flyerPrice}</span>
          </div>
          <div class="savings-info">💚 ¥${item.savings}節約 (${item.savingsPercent}%OFF)</div>
        </div>
      `;
    });

    if (items.length > 5) {
      html += `
        <div style="color: #999; font-size: 12px; margin-top: 10px;">
          他${items.length - 5}件の節約商品あり
        </div>
      `;
    }

    html += `
      </div>
      <div class="divider"></div>
    `;
  });

  html += `
    </div>

    <div class="footer">
      <p>📅 マッチング対象期間: 2026年2月25日～3月8日</p>
      <p>🔗 詳細はダッシュボードで確認してください</p>
      <p style="margin-top: 15px; color: #ccc;">
        このメールは自動送信です。返信はしないでください。
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * テスト実行用の関数
 */
export async function testImprovedNotification() {
  const testMatches: MatchedItem[] = [
    {
      productName: 'いちご',
      purchasedPrice: 1780,
      flyerStore: 'フィール野田店',
      flyerPrice: 1280,
      savings: 500,
      savingsPercent: 28,
      flyerUrl: 'https://tokubai.co.jp/フィール/428',
      discount: '¥500割引',
      receiptDate: '2026-02-28',
    },
    {
      productName: 'いちご',
      purchasedPrice: 1780,
      flyerStore: 'バロー千音寺店',
      flyerPrice: 1480,
      savings: 300,
      savingsPercent: 17,
      flyerUrl: 'https://tokubai.co.jp/バロー/237912',
      discount: '¥300割引',
      receiptDate: '2026-02-28',
    },
    {
      productName: 'アリナミンEXプラスアルファ',
      purchasedPrice: 2980,
      flyerStore: 'クスリのアオキ野田店',
      flyerPrice: 2680,
      savings: 300,
      savingsPercent: 10,
      flyerUrl: 'https://tokubai.co.jp/クスリのアオキ/225282',
      discount: '¥300割引',
      receiptDate: '2026-03-08',
    },
    {
      productName: '明治 北海道バター',
      purchasedPrice: 498,
      flyerStore: 'ベイシア名古屋港',
      flyerPrice: 388,
      savings: 110,
      savingsPercent: 22,
      flyerUrl: 'https://tokubai.co.jp/ベイシアフードセンター/4012',
      discount: '¥110割引',
      receiptDate: '2026-02-28',
    },
    {
      productName: '明治 北海道バター',
      purchasedPrice: 498,
      flyerStore: 'バロー千音寺店',
      flyerPrice: 398,
      savings: 100,
      savingsPercent: 20,
      flyerUrl: 'https://tokubai.co.jp/バロー/237912',
      discount: '¥100割引',
      receiptDate: '2026-02-28',
    },
    {
      productName: 'カルビー かっぱえびせん',
      purchasedPrice: 108,
      flyerStore: 'フィール野田店',
      flyerPrice: 78,
      savings: 30,
      savingsPercent: 28,
      flyerUrl: 'https://tokubai.co.jp/フィール/428',
      discount: '¥30割引',
      receiptDate: '2026-02-28',
    },
  ];

  console.log('='.repeat(70));
  console.log('📱 LINE テキスト形式通知');
  console.log('='.repeat(70));
  console.log(generateLineTextNotification(testMatches));

  console.log('\n' + '='.repeat(70));
  console.log('📱 LINE Flex Message (JSON)');
  console.log('='.repeat(70));
  console.log(JSON.stringify(generateLineFlexMessage(testMatches), null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('📧 HTML形式通知（メール用）');
  console.log('='.repeat(70));
  console.log('HTML形式の通知が生成されました（省略表示）');
}
