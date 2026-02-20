# チラシ分析テスト機能

## 概要

このドキュメントは、実装されたチラシ分析テスト機能の使用方法と、テスト用のチラシ画像URLについて説明しています。

## 実装された機能

### 1. バックエンド API

**エンドポイント**: `POST /api/trpc/flyerTest.analyzeFromUrl`

**リクエスト**:
```json
{
  "imageUrl": "https://example.com/flyer.jpg"
}
```

**レスポンス**:
```json
{
  "success": true,
  "analysis": {
    "storeName": "バロー千音寺店",
    "salePeriod": "2026年1月5日～3月31日",
    "items": [
      {
        "name": "商品名",
        "regularPrice": 1000,
        "salePrice": 800,
        "discount": 20,
        "category": "食品"
      }
    ]
  }
}
```

### 2. フロントエンドUI

**ページ**: `/flyer-test`

機能:
- チラシ画像URLの入力フォーム
- 分析ボタン
- 結果の表形式表示
- エラーハンドリング

### 3. テスト

**テストファイル**: `server/flyer-test.test.ts`

テスト項目:
- URL形式の検証
- 有効なURL形式の受け入れ
- エラーハンドリング

**テスト実行**:
```bash
pnpm test
```

## テスト用チラシ画像URL

以下のチラシ画像を使用してテストできます：

### 1. クスリのアオキ野田店 - チラシ1枚目
**URL**: `https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/ctYsXJEuHFMavrdy.webp`

**内容**: P&G大感謝祭のプロモーション画像
- PayPayポイント還元キャンペーン
- 対象商品: 日用品、医薬品など

### 2. クスリのアオキ野田店 - チラシ2枚目
**URL**: `https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/JBiKDRqpSddTNEBY.webp`

**内容**: 詳細な商品情報とセール期間
- 複数の商品カテゴリ
- 価格情報と割引率

### 3. バロー千音寺店
**URL**: `https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/pNURyzutEUkusMmU.webp`

**内容**: スーパーマーケットのセール情報
- 食品、日用品など
- セール期間と価格

## 使用方法

### 1. ウェブUIでのテスト

1. アプリにログイン
2. `/flyer-test` ページにアクセス
3. 上記のURLをいずれか1つコピーして、入力フォームに貼り付け
4. 「分析開始」ボタンをクリック
5. 抽出された商品情報が表形式で表示されます

### 2. APIでのテスト

```bash
curl -X POST http://localhost:3000/api/trpc/flyerTest.analyzeFromUrl \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://files.manuscdn.com/user_upload_by_module/session_file/310519663265083404/ctYsXJEuHFMavrdy.webp"
  }'
```

## 抽出される情報

各チラシから以下の情報が自動抽出されます：

| 項目 | 説明 |
|------|------|
| 商品名 | チラシに記載されている商品の名前 |
| 通常価格 | 定価（表示されている場合） |
| セール価格 | 割引後の価格 |
| 割引率 | 割引の百分率 |
| カテゴリ | 商品のカテゴリ（食品、日用品など） |
| 店舗名 | チラシの店舗名（表示されている場合） |
| セール期間 | セールの実施期間（表示されている場合） |

## 技術詳細

### LLM統合

チラシ分析はManus内蔵のLLM（大規模言語モデル）を使用しています：

- **モデル**: GPT-4 Vision
- **機能**: 画像認識と構造化データ抽出
- **入力**: チラシ画像URL
- **出力**: JSON形式の構造化データ

### レスポンス形式

LLMからの応答は以下のJSON Schemaに従います：

```json
{
  "type": "object",
  "properties": {
    "storeName": { "type": "string" },
    "salePeriod": { "type": "string" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "regularPrice": { "type": ["number", "null"] },
          "salePrice": { "type": "number" },
          "discount": { "type": ["number", "null"] },
          "category": { "type": "string" }
        },
        "required": ["name", "salePrice", "category"]
      }
    }
  },
  "required": ["items"]
}
```

## 今後の改善予定

- [ ] 複数チラシの一括処理
- [ ] チラシ情報の自動保存
- [ ] 購買傾向との自動マッチング
- [ ] 毎週のおすすめ商品通知
- [ ] チラシの定期監視機能

## トラブルシューティング

### エラー: "画像URLを入力してください"
- 入力フォームが空です
- URLを正しく入力してください

### エラー: "分析に失敗しました"
- LLM APIが利用できない可能性があります
- インターネット接続を確認してください
- しばらく待ってから再度試してください

### エラー: "不明なエラー"
- サーバーログを確認してください
- ブラウザの開発者ツールでコンソールを確認してください

## 参考資料

- [tRPC ドキュメント](https://trpc.io/)
- [Manus LLM統合ガイド](../README.md#llm-integration)
- [チラシ分析テストコンポーネント](./client/src/pages/FlyerAnalysisTest.tsx)
