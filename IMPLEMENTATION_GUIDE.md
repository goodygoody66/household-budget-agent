# 家計防衛エージェント - 実装ガイド

**このガイドは、完成したプログラムを他の環境やAIで実装する際の参考資料です。**

---

## 📦 配布ファイル一覧

### 1. ドキュメント

| ファイル | 説明 |
|---------|------|
| `PORTABLE_PROGRAM.md` | 完全なポータブルプログラム仕様書 |
| `IMPLEMENTATION_GUIDE.md` | このファイル（実装ガイド） |
| `README.md` | プロジェクト概要 |

### 2. TypeScript/Node.js版

| ファイル | 説明 |
|---------|------|
| `server/improvedNotificationGenerator.ts` | 改善版通知生成エンジン |
| `server/lineNotificationService.ts` | LINE通知サービス |
| `server/test-line-notification.ts` | LINE通知テストスクリプト |
| `server/test-real-matching.ts` | リアルマッチングテストスクリプト |

### 3. Python版（スタンドアロン）

| ファイル | 説明 |
|---------|------|
| `standalone_notification_system.py` | Python版スタンドアロン通知システム |

### 4. データベーススキーマ

| ファイル | 説明 |
|---------|------|
| `drizzle/schema.ts` | Prisma/Drizzleスキーマ定義 |

---

## 🚀 クイックスタート

### Node.js環境での実装

```bash
# 1. 依存パッケージをインストール
npm install
# または
pnpm install

# 2. 環境変数を設定
export LINE_CHANNEL_ACCESS_TOKEN=<your_token>
export BUILT_IN_FORGE_API_KEY=<your_key>

# 3. テストを実行
npx tsx server/test-line-notification.ts

# 4. 本番運用
pnpm dev
```

### Python環境での実装

```bash
# 1. 依存パッケージをインストール
pip install requests

# 2. 環境変数を設定
export LINE_CHANNEL_ACCESS_TOKEN=<your_token>

# 3. スクリプトを実行
python3 standalone_notification_system.py
```

---

## 🔧 カスタマイズ例

### 例1: 通知フォーマットを変更

**TypeScript版**:
```typescript
import { generateLineTextNotification } from './server/improvedNotificationGenerator';

const customMatches = [...]; // マッチング結果

// テキスト形式を生成
const message = generateLineTextNotification(customMatches);

// カスタマイズ例：絵文字を変更
const customMessage = message.replace('🎯', '💰');
```

**Python版**:
```python
from standalone_notification_system import ImprovedNotificationGenerator, MatchedItem

matches = [...]  # マッチング結果

generator = ImprovedNotificationGenerator()
message = generator.generate_line_text_notification(matches)

# カスタマイズ例：絵文字を変更
custom_message = message.replace('🎯', '💰')
```

### 例2: LINE通知を送信

**TypeScript版**:
```typescript
import { sendMatchingResultsToLINE } from './server/lineNotificationService';

const result = await sendMatchingResultsToLINE(userId, matches);
console.log(`送信結果: ${result.sentCount}件成功, ${result.failedCount}件失敗`);
```

**Python版**:
```python
from standalone_notification_system import LineNotificationService

service = LineNotificationService(access_token)
success, message = service.send_text_message(line_user_id, text_notification)
print(f"送信結果: {message}")
```

### 例3: 複数の通知フォーマットを生成

**TypeScript版**:
```typescript
import {
  generateLineTextNotification,
  generateLineFlexMessage,
  generateHtmlNotification,
} from './server/improvedNotificationGenerator';

const matches = [...];

// 3つのフォーマットを生成
const textMsg = generateLineTextNotification(matches);
const flexMsg = generateLineFlexMessage(matches);
const htmlMsg = generateHtmlNotification(matches);

// 用途に応じて使い分け
// - LINE: textMsg または flexMsg
// - メール: htmlMsg
```

**Python版**:
```python
from standalone_notification_system import ImprovedNotificationGenerator

generator = ImprovedNotificationGenerator()
matches = [...]

# 3つのフォーマットを生成
text_msg = generator.generate_line_text_notification(matches)
flex_msg = generator.generate_line_flex_message(matches)
html_msg = generator.generate_html_notification(matches)
```

---

## 📊 データ構造

### MatchedItem（マッチング結果の商品）

```typescript
interface MatchedItem {
  productName: string;        // 商品名（例: "いちご"）
  purchasedPrice: number;     // 購入時の価格（例: 1780）
  flyerStore: string;         // チラシ掲載店舗（例: "フィール野田店"）
  flyerPrice: number;         // チラシ価格（例: 1280）
  savings: number;            // 節約額（例: 500）
  savingsPercent: number;     // 割引率（例: 28）
  flyerUrl: string;           // チラシURL
  discount: string;           // 割引情報（例: "¥500割引"）
  receiptDate: string;        // 購入日（例: "2026-02-28"）
}
```

### 通知メッセージの構造

**テキスト形式**:
```
🎯 家計防衛エージェント
💰 今週の節約チャンス
📊 総節約可能額: ¥1,450
🛍️ マッチ商品: 8件
━━━━━━━━━━━━━━━━━━━━
🏪 店舗名
💚 節約額: ¥XXX
1. 商品名
   ¥購入価格 → ¥チラシ価格
   💚 ¥節約額 (割引率%OFF)
```

**Flex Message形式**:
```json
{
  "type": "flex",
  "altText": "...",
  "contents": {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [...]
    }
  }
}
```

---

## 🔐 環境変数設定

### 必須環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging APIのアクセストークン | `Bearer xxx...` |
| `BUILT_IN_FORGE_API_KEY` | Manus内蔵APIキー | `key_xxx...` |
| `DATABASE_URL` | データベース接続文字列 | `mysql://user:pass@host/db` |

### オプション環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|----------|
| `LINE_USER_ID` | テスト用LINE User ID | - |
| `NOTIFICATION_SCHEDULE` | 通知スケジュール（cron形式） | `0 20 * * 5` |

---

## 🧪 テスト方法

### ユニットテスト

```bash
# TypeScript版
pnpm test

# Python版
python3 -m pytest standalone_notification_system_test.py
```

### 統合テスト

```bash
# LINE通知のテスト送信
npx tsx server/test-line-notification.ts

# リアルマッチングのテスト
npx tsx server/test-real-matching.ts
```

### 手動テスト

```bash
# Python版で直接実行
python3 standalone_notification_system.py

# 出力を確認
# - テキスト形式通知
# - Flex Message（JSON）
# - HTML形式通知
```

---

## 🐛 トラブルシューティング

### 問題: LINE通知が送信されない

**原因と対策**:
```
1. LINE_CHANNEL_ACCESS_TOKEN が設定されていない
   → 環境変数を確認: echo $LINE_CHANNEL_ACCESS_TOKEN
   
2. LINE User IDが間違っている
   → LINE Botの友達追加時に取得したUser IDを確認
   
3. LINE Messaging APIの設定が不完全
   → LINE Developers Consoleで設定を確認
```

### 問題: マッチング結果が空

**原因と対策**:
```
1. レシート情報が不足している
   → レシート分析が正常に完了しているか確認
   
2. チラシ情報が不足している
   → チラシ取得スケジューラーが動作しているか確認
   
3. 商品名の類似度が低い
   → Levenshtein距離の閾値を調整
```

### 問題: データベース接続エラー

**原因と対策**:
```
1. DATABASE_URL が設定されていない
   → 環境変数を確認
   
2. データベースサーバーが起動していない
   → MySQL/TiDBサーバーの状態を確認
   
3. 接続情報が間違っている
   → ホスト名、ユーザー名、パスワードを確認
```

---

## 📈 パフォーマンス最適化

### 1. キャッシング

```typescript
// マッチング結果をキャッシュ
const cache = new Map<string, MatchedItem[]>();

function getCachedMatches(key: string): MatchedItem[] | null {
  return cache.get(key) || null;
}

function setCachedMatches(key: string, matches: MatchedItem[]): void {
  cache.set(key, matches);
  // 1時間後に削除
  setTimeout(() => cache.delete(key), 3600000);
}
```

### 2. バッチ処理

```typescript
// 複数ユーザーへの通知を並列処理
async function sendBatchNotifications(
  userMatches: Map<number, MatchedItem[]>
): Promise<void> {
  const promises = Array.from(userMatches.entries()).map(
    ([userId, matches]) => sendMatchingResultsToLINE(userId, matches)
  );
  await Promise.all(promises);
}
```

### 3. インデックス最適化

```sql
-- マッチング結果テーブルにインデックスを追加
CREATE INDEX idx_user_id ON matching_results(userId);
CREATE INDEX idx_created_at ON matching_results(createdAt);
CREATE INDEX idx_user_created ON matching_results(userId, createdAt);
```

---

## 🔄 デプロイメント

### 本番環境へのデプロイ

```bash
# 1. ビルド
pnpm build

# 2. マイグレーション
pnpm db:push

# 3. サーバー起動
pnpm start

# 4. ヘルスチェック
curl http://localhost:3000/health
```

### Docker でのデプロイ

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# ビルド
docker build -t household-budget-agent .

# 実行
docker run -e LINE_CHANNEL_ACCESS_TOKEN=xxx \
           -e DATABASE_URL=mysql://... \
           -p 3000:3000 \
           household-budget-agent
```

---

## 📚 参考資料

### 公式ドキュメント
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Prisma ORM](https://www.prisma.io/docs/)
- [tRPC](https://trpc.io/docs)
- [Next.js](https://nextjs.org/docs)

### アルゴリズム
- [Levenshtein距離](https://ja.wikipedia.org/wiki/レーベンシュタイン距離)
- [TF-IDF](https://ja.wikipedia.org/wiki/Tf-idf)

### ツール
- [LINE Developers Console](https://developers.line.biz/console/)
- [Prisma Studio](https://www.prisma.io/studio)
- [VS Code REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

---

## 📝 変更履歴

### v1.0.0 (2026-03-13)
- ✅ 初版リリース
- ✅ TypeScript版実装完了
- ✅ Python版スタンドアロン実装完了
- ✅ 改善版通知フォーマット実装
- ✅ LINE Messaging API統合

---

## 🤝 サポート

### よくある質問

**Q: 他のAIでこのコードを使用できますか？**
A: はい。`PORTABLE_PROGRAM.md`と`standalone_notification_system.py`を参考に、任意の環境で実装できます。

**Q: 複数ユーザーに対応していますか？**
A: はい。ユーザーごとのLINE User IDを管理し、複数ユーザーへの通知に対応しています。

**Q: 通知スケジュールをカスタマイズできますか？**
A: はい。cron形式で指定できます。デフォルトは毎週金曜日夜8時（`0 20 * * 5`）です。

---

**最終更新**: 2026年3月13日
**バージョン**: 1.0.0
