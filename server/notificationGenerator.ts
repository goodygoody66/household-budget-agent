/**
 * リアルなデータを含む通知を生成するモジュール
 */

export interface MatchingNotificationData {
  matchedItems: Array<{
    receiptItemName: string;
    receiptPrice: number;
    flyerPrice: number;
    savingsAmount: number;
    savingsPercentage: number;
    storeName: string;
    category: string;
  }>;
  totalSavings: number;
  totalMatches: number;
  excludedCategories: string[];
  generatedAt: string;
}

/**
 * テストデータを使用したリアルな通知データを生成
 */
export function generateMatchingNotificationData(): MatchingNotificationData {
  const matchedItems = [
    {
      receiptItemName: "トマト",
      receiptPrice: 298,
      flyerPrice: 198,
      savingsAmount: 100,
      savingsPercentage: 33.6,
      storeName: "バロー千音寺店",
      category: "野菜",
    },
    {
      receiptItemName: "牛肉",
      receiptPrice: 1280,
      flyerPrice: 980,
      savingsAmount: 300,
      savingsPercentage: 23.4,
      storeName: "バロー千音寺店",
      category: "肉",
    },
  ];

  const totalSavings = matchedItems.reduce((sum, item) => sum + item.savingsAmount, 0);

  return {
    matchedItems,
    totalSavings,
    totalMatches: matchedItems.length,
    excludedCategories: ["乳製品", "飲料"],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * 通知用のHTMLコンテンツを生成
 */
export function generateNotificationHTML(data: MatchingNotificationData): string {
  const itemsHTML = data.matchedItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; text-align: left;">${item.receiptItemName}</td>
      <td style="padding: 12px; text-align: right;">¥${item.receiptPrice}</td>
      <td style="padding: 12px; text-align: right; color: #4CAF50; font-weight: bold;">¥${item.flyerPrice}</td>
      <td style="padding: 12px; text-align: right; color: #2196F3; font-weight: bold;">¥${item.savingsAmount}</td>
      <td style="padding: 12px; text-align: center; color: #FF9800;">${item.savingsPercentage.toFixed(1)}%</td>
      <td style="padding: 12px; text-align: left; font-size: 12px;">${item.storeName}</td>
    </tr>
  `
    )
    .join("");

  const excludedCategoriesHTML = data.excludedCategories
    .map(
      (category) => `
    <li style="margin-bottom: 8px; color: #666;">
      <strong>${category}</strong> - 購買実績がないため分析から除外しました
    </li>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>家計防衛エージェント - スマートマッチング分析結果</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0 0;
      opacity: 0.9;
    }
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 25px;
    }
    .summary-card {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
      text-align: center;
    }
    .summary-card.savings {
      border-left-color: #4CAF50;
    }
    .summary-card.matches {
      border-left-color: #2196F3;
    }
    .summary-card.excluded {
      border-left-color: #FF9800;
    }
    .summary-card .label {
      font-size: 12px;
      color: #999;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    .summary-card.savings .value {
      color: #4CAF50;
    }
    .summary-card.matches .value {
      color: #2196F3;
    }
    .summary-card.excluded .value {
      color: #FF9800;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 15px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    table th {
      background-color: #f0f0f0;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #ddd;
    }
    .excluded-list {
      background-color: #fff3cd;
      border-left: 4px solid #FF9800;
      padding: 15px;
      border-radius: 4px;
    }
    .excluded-list ul {
      margin: 0;
      padding-left: 20px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .cta-button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 15px;
      font-weight: 600;
    }
    .cta-button:hover {
      background-color: #764ba2;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 スマートマッチング分析結果</h1>
      <p>あなたの購買実績とチラシ情報を比較しました</p>
    </div>

    <div class="summary">
      <div class="summary-card savings">
        <div class="label">合計節約額</div>
        <div class="value">¥${data.totalSavings.toLocaleString()}</div>
      </div>
      <div class="summary-card matches">
        <div class="label">マッチ商品数</div>
        <div class="value">${data.totalMatches}</div>
      </div>
      <div class="summary-card excluded">
        <div class="label">除外カテゴリー</div>
        <div class="value">${data.excludedCategories.length}</div>
      </div>
    </div>

    <div class="section">
      <h2>💰 お得な商品一覧</h2>
      <table>
        <thead>
          <tr>
            <th>商品名</th>
            <th>購買価格</th>
            <th>セール価格</th>
            <th>節約額</th>
            <th>節約率</th>
            <th>店舗</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    ${
      data.excludedCategories.length > 0
        ? `
    <div class="section">
      <h2>⚠️ 分析から除外されたカテゴリー</h2>
      <div class="excluded-list">
        <p>以下のカテゴリーは購買実績がないため、分析から除外しました：</p>
        <ul>
          ${excludedCategoriesHTML}
        </ul>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>📊 分析内容</h2>
      <p>
        このレポートは、あなたの過去の購買実績とチラシ情報を比較して生成されました。
        購買実績がある商品でセール価格が低いもののみをピックアップしています。
      </p>
      <p>
        <strong>除外カテゴリーについて：</strong>
        購買実績がないカテゴリーのセール情報は、あなたの購買パターンに合わないと判断し、
        分析から除外しています。これにより、より関連性の高い情報をお届けしています。
      </p>
    </div>

    <div style="text-align: center;">
      <a href="https://household-budget-agent.manus.space/receipt-flyer-matching" class="cta-button">
        詳細を確認する
      </a>
    </div>

    <div class="footer">
      <p>
        このメールは家計防衛エージェントから自動送信されています。<br>
        生成日時: ${new Date(data.generatedAt).toLocaleString("ja-JP")}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 通知用のテキストコンテンツを生成
 */
export function generateNotificationText(data: MatchingNotificationData): string {
  const itemsList = data.matchedItems
    .map(
      (item) =>
        `• ${item.receiptItemName}\n  購買価格: ¥${item.receiptPrice} → セール価格: ¥${item.flyerPrice}\n  節約額: ¥${item.savingsAmount} (${item.savingsPercentage.toFixed(1)}%)\n  店舗: ${item.storeName}`
    )
    .join("\n\n");

  const excludedList = data.excludedCategories.map((cat) => `• ${cat}`).join("\n");

  return `
🛒 スマートマッチング分析結果

あなたの購買実績とチラシ情報を比較しました。

【サマリー】
合計節約額: ¥${data.totalSavings.toLocaleString()}
マッチ商品数: ${data.totalMatches}件
除外カテゴリー: ${data.excludedCategories.length}件

【お得な商品一覧】
${itemsList}

${
  data.excludedCategories.length > 0
    ? `
【分析から除外されたカテゴリー】
購買実績がないため、以下のカテゴリーは分析から除外しました：
${excludedList}
`
    : ""
}

【分析内容】
このレポートは、あなたの過去の購買実績とチラシ情報を比較して生成されました。
購買実績がある商品でセール価格が低いもののみをピックアップしています。

除外カテゴリーについて：
購買実績がないカテゴリーのセール情報は、あなたの購買パターンに合わないと判断し、
分析から除外しています。これにより、より関連性の高い情報をお届けしています。

詳細を確認: https://household-budget-agent.manus.space/receipt-flyer-matching

---
このメールは家計防衛エージェントから自動送信されています。
生成日時: ${new Date(data.generatedAt).toLocaleString("ja-JP")}
  `;
}
