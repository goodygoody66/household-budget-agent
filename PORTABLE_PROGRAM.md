# 家計防衛エージェント - ポータブルプログラム

**このドキュメントは、Claude等の他のAIでも動作するように設計されています。**

---

## 📋 概要

このプログラムは、レシート画像を分析し、複数のスーパーマーケットのチラシ情報と照合して、ユーザーが普段購入する商品の特売情報を自動的に検出し、LINE通知するシステムです。

**主な機能**:
- レシート画像のLLM分析（商品名、価格、カテゴリーを抽出）
- チラシ情報の自動取得（トクバイ、Shufoo!）
- 購買実績とチラシ情報のマッチング
- LINE Messaging APIによる週次通知
- 改善版の直感的でわかりやすい通知フォーマット

---

## 🏗️ システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                    ユーザーインタフェース                   │
│              (Next.js + React + Tailwind)               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   tRPC API層                             │
│  (型安全なRPC通信、認証・認可処理)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              ビジネスロジック層                            │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ レシート分析      │  │ チラシ取得・解析  │            │
│  │ (LLM + Vision)   │  │ (スクレイピング)  │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ マッチング処理    │  │ 通知生成・送信    │            │
│  │ (類似度計算)     │  │ (LINE/メール)    │            │
│  └──────────────────┘  └──────────────────┘            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              データベース層                               │
│  (Prisma ORM + MySQL/TiDB)                              │
│                                                          │
│  - users: ユーザー情報                                   │
│  - receipts: レシート記録                                │
│  - receipt_items: レシート内の商品                       │
│  - supermarkets: スーパー情報                            │
│  - flyers: チラシ情報                                    │
│  - matching_results: マッチング結果                      │
│  - lineUserMappings: LINE User ID                       │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 主要ファイル構成

### 1. 通知生成エンジン

**`improvedNotificationGenerator.ts`** - 改善版通知メッセージ生成

```typescript
// 3つのフォーマットを生成
- generateLineTextNotification(matches) → テキスト形式
- generateLineFlexMessage(matches) → Flex Message形式（JSON）
- generateHtmlNotification(matches) → HTML形式（メール用）

// 入力形式
interface MatchedItem {
  productName: string;           // 商品名
  purchasedPrice: number;        // 購入価格
  flyerStore: string;            // チラシ掲載店舗
  flyerPrice: number;            // チラシ価格
  savings: number;               // 節約額
  savingsPercent: number;        // 割引率
  flyerUrl: string;              // チラシURL
  discount: string;              // 割引情報
  receiptDate: string;           // 購入日
}
```

**特徴**:
- 店舗ごとにグループ化して表示
- 「どの店に行けばどうお得か」が一目瞭然
- LINE、メール、テキストの3フォーマット対応

### 2. LINE通知サービス

**`lineNotificationService.ts`** - LINE Messaging API統合

```typescript
// メイン関数
sendMatchingResultsToLINE(userId, matches)
  → ユーザーのすべてのLINE IDに通知を送信
  → テキスト形式とFlex Message形式の両方を送信
  → 返り値: { success, sentCount, failedCount }

// テスト用
simulateLINENotification(matches)
  → コンソールに通知内容をシミュレート表示
```

**必要な環境変数**:
```
LINE_CHANNEL_ACCESS_TOKEN=<LINE Messaging API のアクセストークン>
```

### 3. レシート分析

**`receiptAnalysis.ts`** - LLM + Vision APIを使用

```typescript
// レシート画像を分析
analyzeReceiptImage(imagePath)
  → {
      date: "2026-02-28",
      store: "バロー千音寺店",
      total: 17440,
      items: [
        { name: "いちご", price: 1780, quantity: 1, category: "生鮮" },
        ...
      ]
    }
```

### 4. チラシ取得・解析

**`flyerScheduler.ts`** - 毎日午前1時に自動実行

```typescript
// トクバイ、Shufoo!からチラシを取得
fetchFlyersForSupermarkets()
  → チラシ画像をダウンロード
  → LLMで商品情報を抽出
  → データベースに保存
```

### 5. マッチング処理

**`receiptFlyerMatching.ts`** - 購買実績とチラシのマッチング

```typescript
// マッチング処理
matchReceiptsWithFlyers(receiptItems, flyerItems)
  → Levenshtein距離で商品名を比較
  → 同じカテゴリーのみマッチング対象
  → 節約額を計算
  → 返り値: MatchedItem[]
```

---

## 🔄 データフロー

### 1. レシート登録フロー

```
ユーザーがレシート画像をアップロード
    ↓
LLM + Vision APIで分析
    ↓
商品情報を抽出（名前、価格、カテゴリー、日付）
    ↓
データベースに保存
    ↓
購買傾向を更新
```

### 2. チラシ更新フロー（毎日午前1時）

```
スケジューラー起動
    ↓
トクバイ、Shufoo!からチラシを取得
    ↓
チラシ画像をLLMで解析
    ↓
商品情報を抽出（名前、価格、割引情報）
    ↓
データベースに保存
```

### 3. マッチング・通知フロー（毎週金曜日夜8時）

```
スケジューラー起動
    ↓
今週のレシート情報を取得
    ↓
チラシ情報を取得
    ↓
マッチング処理実行
    ↓
改善版通知メッセージを生成
    ↓
ユーザーのLINE IDを取得
    ↓
LINE Messaging APIで送信
    ↓
（オプション）メール通知も送信
```

---

## 🚀 実装ガイド

### ステップ1: 環境構築

```bash
# Node.js 18+ が必要
node --version  # v18.0.0以上

# 依存パッケージをインストール
npm install
# または
pnpm install
```

### ステップ2: 環境変数を設定

```bash
# .env.local または .env ファイルを作成
LINE_CHANNEL_ACCESS_TOKEN=<LINE Messaging APIのアクセストークン>
LINE_CHANNEL_SECRET=<LINE Messaging APIのチャネルシークレット>

# LLM API（Manus内蔵）
BUILT_IN_FORGE_API_KEY=<APIキー>
BUILT_IN_FORGE_API_URL=<API URL>

# データベース
DATABASE_URL=mysql://user:password@host/database
```

### ステップ3: データベースマイグレーション

```bash
# スキーマをデータベースに反映
pnpm db:push
```

### ステップ4: テスト実行

```bash
# 改善版通知メッセージをテスト
npx tsx server/test-improved-notification.ts

# LINE通知をシミュレート
npx tsx server/test-line-notification.ts

# リアルなマッチング処理をテスト
npx tsx server/test-real-matching.ts
```

### ステップ5: 本番運用

```bash
# 開発サーバーを起動
pnpm dev

# または本番ビルド
pnpm build
pnpm start
```

---

## 📊 通知フォーマット例

### テキスト形式（LINE）

```
🎯 家計防衛エージェント
💰 今週の節約チャンス
📊 総節約可能額: ¥1,450
🛍️ マッチ商品: 8件
━━━━━━━━━━━━━━━━━━━━
🏪 フィール野田店
💚 節約額: ¥530
1. いちご
   ¥1780 → ¥1280
   💚 ¥500節約 (28%OFF)
2. カルビー かっぱえびせん
   ¥108 → ¥78
   💚 ¥30節約 (28%OFF)
━━━━━━━━━━━━━━━━━━━━
🏪 バロー千音寺店
💚 節約額: ¥400
1. いちご
   ¥1780 → ¥1480
   💚 ¥300節約 (17%OFF)
...
```

### Flex Message形式（JSON）

```json
{
  "type": "flex",
  "altText": "🎯 家計防衛エージェント - 今週の節約チャンス",
  "contents": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "🎯 家計防衛エージェント",
          "weight": "bold",
          "size": "xl"
        },
        ...
      ]
    }
  }
}
```

---

## 💾 データベーススキーマ

### users テーブル

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### receipts テーブル

```sql
CREATE TABLE receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  storeId INT NOT NULL,
  date DATE NOT NULL,
  total INT NOT NULL,
  imageUrl VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (storeId) REFERENCES supermarkets(id)
);
```

### receipt_items テーブル

```sql
CREATE TABLE receipt_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  receiptId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  quantity INT DEFAULT 1,
  category VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (receiptId) REFERENCES receipts(id)
);
```

### flyers テーブル

```sql
CREATE TABLE flyers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  storeId INT NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  imageUrl VARCHAR(500),
  pdfUrl VARCHAR(500),
  sourceUrl VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storeId) REFERENCES supermarkets(id)
);
```

### matching_results テーブル

```sql
CREATE TABLE matching_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  receiptItemId INT NOT NULL,
  flyerId INT NOT NULL,
  savingsAmount INT NOT NULL,
  savingsPercent INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (receiptItemId) REFERENCES receipt_items(id),
  FOREIGN KEY (flyerId) REFERENCES flyers(id)
);
```

### lineUserMappings テーブル

```sql
CREATE TABLE lineUserMappings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  lineUserId VARCHAR(255) NOT NULL,
  displayName VARCHAR(255),
  isActive INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY (userId, lineUserId)
);
```

---

## 🔧 API エンドポイント（tRPC）

### 通知関連

```typescript
// マッチング結果をLINE送信
trpc.notification.sendMatchingToLINE.useMutation({
  userId: number,
  matches: MatchedItem[]
})

// テスト通知を送信
trpc.notification.sendTestNotification.useMutation({
  userId: number
})
```

### レシート関連

```typescript
// レシート画像を分析
trpc.receipt.analyzeImage.useMutation({
  imageUrl: string,
  storeId: number
})

// レシート一覧を取得
trpc.receipt.getList.useQuery({
  userId: number,
  limit?: number
})
```

### チラシ関連

```typescript
// チラシ情報を取得
trpc.flyer.getByStore.useQuery({
  storeId: number
})

// 手動でチラシを更新
trpc.flyer.refreshFlyers.useMutation({
  storeIds: number[]
})
```

---

## 🧪 テストコード

### ユニットテスト例

```typescript
import { describe, it, expect } from 'vitest';
import { generateLineTextNotification } from './improvedNotificationGenerator';

describe('通知生成', () => {
  it('テキスト形式通知を生成', () => {
    const matches = [
      {
        productName: 'いちご',
        purchasedPrice: 1780,
        flyerStore: 'フィール野田店',
        flyerPrice: 1280,
        savings: 500,
        savingsPercent: 28,
        flyerUrl: 'https://example.com',
        discount: '¥500割引',
        receiptDate: '2026-02-28',
      },
    ];

    const result = generateLineTextNotification(matches);
    
    expect(result).toContain('🎯 家計防衛エージェント');
    expect(result).toContain('¥1,450');
    expect(result).toContain('フィール野田店');
  });
});
```

### 統合テスト例

```typescript
import { sendMatchingResultsToLINE } from './lineNotificationService';

async function testIntegration() {
  const matches = [...]; // テストデータ
  const result = await sendMatchingResultsToLINE(1, matches);
  
  console.log('送信結果:', result);
  // { success: true, sentCount: 1, failedCount: 0 }
}
```

---

## 📈 クレジット消費試算

| 処理 | 頻度 | クレジット/回 | 月間消費 |
|------|------|-------------|--------|
| レシート分析 | 週4回 | 2 | 32 |
| チラシ取得・解析 | 毎日 | 1 | 30 |
| マッチング処理 | 週1回 | 0.5 | 2 |
| LINE通知 | 週1回 | 0.5 | 2 |
| **合計** | - | - | **66** |

**年間消費**: 約792クレジット

---

## 🔐 セキュリティ考慮事項

1. **API キー管理**
   - 環境変数に保存（`.env.local`）
   - ソースコードにハードコーディングしない
   - 定期的なローテーション

2. **LINE User ID**
   - 暗号化して保存
   - ユーザー認証後のみアクセス可能

3. **レシート画像**
   - S3に保存（プライベートバケット）
   - 署名付きURLで一時的にアクセス可能
   - 定期的なクリーンアップ

4. **データベース**
   - SSL/TLS接続
   - 定期的なバックアップ
   - アクセス制御の厳格化

---

## 🐛 トラブルシューティング

### LINE通知が送信されない

```
原因: LINE_CHANNEL_ACCESS_TOKEN が設定されていない
対策: 環境変数を確認し、LINE Messaging APIのアクセストークンを設定
```

### レシート分析が失敗する

```
原因: LLM APIが利用不可
対策: BUILT_IN_FORGE_API_KEY と BUILT_IN_FORGE_API_URL を確認
```

### マッチング結果が空

```
原因: レシート情報またはチラシ情報が不足
対策: 
1. レシートが正しく分析されているか確認
2. チラシが取得されているか確認
3. 商品名が正確に抽出されているか確認
```

---

## 📚 参考資料

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [Levenshtein距離の説明](https://ja.wikipedia.org/wiki/レーベンシュタイン距離)
- [Prisma ORM ドキュメント](https://www.prisma.io/docs/)
- [tRPC ドキュメント](https://trpc.io/docs)

---

## 📝 ライセンス

このプログラムはMIT Licenseの下で公開されています。

---

**最終更新**: 2026年3月13日
**バージョン**: 1.0.0
**ステータス**: 本番運用可能
