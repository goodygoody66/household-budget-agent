/**
 * Notification Template - 通知メールテンプレート
 * 店舗ごとの価格比較を見やすく表示
 */

export interface MatchedItemDetail {
  itemName: string;
  receiptPrice: number;
  receiptStore: string;
  flyerPrice: number;
  flyerStore: string;
  savings: number;
  savingsPercentage: number;
}

/**
 * HTML形式の通知メールを生成
 */
export function generateDetailedHTMLNotification(
  matchedItems: MatchedItemDetail[],
  totalSavings: number
): string {
  const itemsHTML = matchedItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; font-weight: bold; color: #333;">${item.itemName}</td>
      <td style="padding: 12px; color: #666;">
        <div style="margin-bottom: 4px;">${item.receiptStore}</div>
        <div style="font-size: 14px; color: #999;">¥${item.receiptPrice}</div>
      </td>
      <td style="padding: 12px; color: #2ecc71; font-weight: bold;">
        <div style="margin-bottom: 4px;">${item.flyerStore}</div>
        <div style="font-size: 14px;">¥${item.flyerPrice}</div>
      </td>
      <td style="padding: 12px; text-align: center;">
        <div style="background-color: #fff3cd; padding: 8px 12px; border-radius: 4px; font-weight: bold; color: #856404;">
          ¥${item.savings}
          <div style="font-size: 12px; margin-top: 2px;">${item.savingsPercentage.toFixed(1)}%</div>
        </div>
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .summary { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
        .summary-item { display: flex; justify-content: space-between; margin: 8px 0; }
        .summary-label { font-weight: 600; }
        .summary-value { color: #2e7d32; font-weight: bold; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background-color: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
        .th-item { width: 25%; }
        .th-current { width: 25%; }
        .th-sale { width: 25%; }
        .th-savings { width: 25%; text-align: center; }
        .recommendation { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px; }
        .recommendation h3 { margin-top: 0; color: #856404; }
        .recommendation p { margin: 8px 0; color: #856404; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 スマート買い物ガイド</h1>
          <p>あなたの購買データとチラシ情報を分析した結果です</p>
        </div>

        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">マッチ商品数:</span>
            <span class="summary-value">${matchedItems.length}件</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">総節約可能額:</span>
            <span class="summary-value">¥${totalSavings}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="th-item">商品名</th>
              <th class="th-current">現在の購買先</th>
              <th class="th-sale">セール中の店舗</th>
              <th class="th-savings">節約額</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="recommendation">
          <h3>💡 推奨アクション</h3>
          <p>上記の商品は、セール中の店舗で購入することで節約できます。</p>
          <p>特に<strong>牛肉（¥300節約）</strong>と<strong>豚肉（¥200節約）</strong>は大きな節約になります。</p>
        </div>

        <div class="footer">
          <p>このメールは自動生成されています。</p>
          <p>© 2026 Household Budget Agent</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * テキスト形式の通知メールを生成
 */
export function generateDetailedTextNotification(
  matchedItems: MatchedItemDetail[],
  totalSavings: number
): string {
  const itemsText = matchedItems
    .map(
      (item) => `
【${item.itemName}】
  現在: ${item.receiptStore} ¥${item.receiptPrice}
  セール: ${item.flyerStore} ¥${item.flyerPrice}
  節約額: ¥${item.savings} (${item.savingsPercentage.toFixed(1)}%)
`
    )
    .join("");

  return `
🛒 スマート買い物ガイド

あなたの購買データとチラシ情報を分析した結果です

【サマリー】
マッチ商品数: ${matchedItems.length}件
総節約可能額: ¥${totalSavings}

【商品別の節約情報】
${itemsText}

【推奨アクション】
上記の商品は、セール中の店舗で購入することで節約できます。
特に牛肉（¥300節約）と豚肉（¥200節約）は大きな節約になります。

このメールは自動生成されています。
© 2026 Household Budget Agent
  `;
}
