#!/usr/bin/env python3
"""
家計防衛エージェント - スタンドアロン通知システム
Claude等の他のAIでも動作するPython版

このスクリプトは、マッチング結果をLINE通知に変換して送信します。
Node.js環境がなくても、Pythonさえあれば動作します。
"""

import json
import os
from typing import List, Dict, Tuple
from dataclasses import dataclass
from datetime import datetime
import requests


@dataclass
class MatchedItem:
    """マッチング結果の商品情報"""
    product_name: str
    purchased_price: int
    flyer_store: str
    flyer_price: int
    savings: int
    savings_percent: int
    flyer_url: str
    discount: str
    receipt_date: str


class ImprovedNotificationGenerator:
    """改善版通知メッセージ生成エンジン"""

    @staticmethod
    def group_matches_by_store(matches: List[MatchedItem]) -> Dict[str, List[MatchedItem]]:
        """マッチング結果を店舗ごとにグループ化"""
        grouped = {}
        for match in matches:
            if match.flyer_store not in grouped:
                grouped[match.flyer_store] = []
            grouped[match.flyer_store].append(match)
        return grouped

    @staticmethod
    def generate_line_text_notification(matches: List[MatchedItem]) -> str:
        """LINE向けのテキスト形式通知を生成"""
        grouped = ImprovedNotificationGenerator.group_matches_by_store(matches)
        total_savings = sum(m.savings for m in matches)

        message = "🎯 家計防衛エージェント\n"
        message += "💰 今週の節約チャンス\n\n"
        message += f"📊 総節約可能額: ¥{total_savings:,}\n"
        message += f"🛍️ マッチ商品: {len(matches)}件\n\n"
        message += "━" * 20 + "\n\n"

        for store, items in grouped.items():
            store_total = sum(item.savings for item in items)
            message += f"🏪 {store}\n"
            message += f"💚 節約額: ¥{store_total:,}\n\n"

            for idx, item in enumerate(items[:3], 1):
                message += f"{idx}. {item.product_name}\n"
                message += f"   ¥{item.purchased_price:,} → ¥{item.flyer_price:,}\n"
                message += f"   💚 ¥{item.savings}節約 ({item.savings_percent}%OFF)\n\n"

            if len(items) > 3:
                message += f"   他{len(items) - 3}件の節約商品あり\n\n"

            message += "━" * 20 + "\n\n"

        message += "📅 マッチング対象: 2/25～3/8\n"
        message += "🔗 詳細はダッシュボードで確認\n"

        return message

    @staticmethod
    def generate_line_flex_message(matches: List[MatchedItem]) -> Dict:
        """LINE Flex Message用のJSON構造を生成"""
        grouped = ImprovedNotificationGenerator.group_matches_by_store(matches)
        total_savings = sum(m.savings for m in matches)

        # 店舗ごとのセクションを生成
        store_blocks = []
        for store, items in grouped.items():
            store_total = sum(item.savings for item in items)
            top_items = items[:3]

            product_contents = []
            for idx, item in enumerate(top_items, 1):
                product_contents.append({
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "xs",
                    "contents": [
                        {
                            "type": "text",
                            "text": f"{idx}. {item.product_name}",
                            "size": "xs",
                            "weight": "bold",
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "margin": "md",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": f"¥{item.purchased_price}",
                                    "size": "xs",
                                    "color": "#999999",
                                    "flex": 0,
                                    "decoration": "line-through",
                                },
                                {"type": "filler"},
                                {
                                    "type": "text",
                                    "text": f"¥{item.flyer_price}",
                                    "size": "xs",
                                    "color": "#00aa00",
                                    "weight": "bold",
                                    "flex": 0,
                                },
                            ],
                        },
                        {
                            "type": "text",
                            "text": f"💚 ¥{item.savings}節約 ({item.savings_percent}%OFF)",
                            "size": "xs",
                            "color": "#00aa00",
                        },
                    ],
                })

            store_block = {
                "type": "box",
                "layout": "vertical",
                "margin": "md",
                "spacing": "sm",
                "contents": [
                    {
                        "type": "box",
                        "layout": "baseline",
                        "margin": "md",
                        "contents": [
                            {
                                "type": "text",
                                "text": f"🏪 {store}",
                                "weight": "bold",
                                "size": "sm",
                                "flex": 0,
                            },
                            {"type": "filler"},
                            {
                                "type": "text",
                                "text": f"💚 ¥{store_total:,}",
                                "size": "sm",
                                "color": "#00aa00",
                                "weight": "bold",
                                "align": "end",
                            },
                        ],
                    },
                    {
                        "type": "box",
                        "layout": "vertical",
                        "margin": "md",
                        "spacing": "sm",
                        "contents": product_contents,
                    },
                ]
            }

            if len(items) > 3:
                store_block["contents"].append({
                    "type": "text",
                    "text": f"他{len(items) - 3}件の節約商品あり",
                    "size": "xs",
                    "color": "#999999",
                    "margin": "md",
                })

            store_blocks.append(store_block)

        return {
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
                            "size": "xl",
                        },
                        {
                            "type": "text",
                            "text": "💰 今週の節約チャンス",
                            "size": "sm",
                            "color": "#999999",
                            "margin": "md",
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "margin": "lg",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "box",
                                    "layout": "baseline",
                                    "spacing": "sm",
                                    "contents": [
                                        {
                                            "type": "text",
                                            "text": "📊 総節約可能額",
                                            "color": "#aaaaaa",
                                            "size": "sm",
                                            "flex": 0,
                                        },
                                        {"type": "filler"},
                                        {
                                            "type": "text",
                                            "text": f"¥{total_savings:,}",
                                            "wrap": True,
                                            "color": "#00aa00",
                                            "size": "sm",
                                            "weight": "bold",
                                        },
                                    ],
                                },
                                {
                                    "type": "box",
                                    "layout": "baseline",
                                    "spacing": "sm",
                                    "contents": [
                                        {
                                            "type": "text",
                                            "text": "🛍️ マッチ商品",
                                            "color": "#aaaaaa",
                                            "size": "sm",
                                            "flex": 0,
                                        },
                                        {"type": "filler"},
                                        {
                                            "type": "text",
                                            "text": f"{len(matches)}件",
                                            "wrap": True,
                                            "color": "#666666",
                                            "size": "sm",
                                        },
                                    ],
                                },
                            ],
                        },
                        {"type": "separator", "margin": "lg"},
                        *store_blocks,
                        {"type": "separator", "margin": "lg"},
                        {
                            "type": "box",
                            "layout": "vertical",
                            "margin": "lg",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "📅 マッチング対象: 2/25～3/8",
                                    "size": "xs",
                                    "color": "#aaaaaa",
                                },
                                {
                                    "type": "text",
                                    "text": "🔗 詳細はダッシュボードで確認",
                                    "size": "xs",
                                    "color": "#0099ff",
                                    "decoration": "underline",
                                },
                            ],
                        },
                    ],
                },
            },
        }

    @staticmethod
    def generate_html_notification(matches: List[MatchedItem]) -> str:
        """HTML形式の美しい通知テンプレート"""
        grouped = ImprovedNotificationGenerator.group_matches_by_store(matches)
        total_savings = sum(m.savings for m in matches)

        html = """<!DOCTYPE html>
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
        <div class="value">¥{total_savings:,}</div>
      </div>
      <div class="summary-item">
        <div class="label">🛍️ マッチ商品</div>
        <div class="value">{len(matches)}件</div>
      </div>
    </div>

    <div class="content">
"""

        for store, items in grouped.items():
            store_total = sum(item.savings for item in items)
            html += f"""
      <div class="store-section">
        <div class="store-header">
          <div class="store-name">🏪 {store}</div>
          <div class="store-savings">💚 ¥{store_total:,}</div>
        </div>
"""

            for idx, item in enumerate(items[:5], 1):
                html += f"""
        <div class="product-item">
          <div class="product-name">{idx}. {item.product_name}</div>
          <div class="product-price">
            <span class="original-price">¥{item.purchased_price:,}</span>
            <span class="sale-price">¥{item.flyer_price:,}</span>
          </div>
          <div class="savings-info">💚 ¥{item.savings}節約 ({item.savings_percent}%OFF)</div>
        </div>
"""

            if len(items) > 5:
                html += f"""
        <div style="color: #999; font-size: 12px; margin-top: 10px;">
          他{len(items) - 5}件の節約商品あり
        </div>
"""

            html += """
      </div>
      <div class="divider"></div>
"""

        html += """
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
"""
        return html


class LineNotificationService:
    """LINE Messaging API統合サービス"""

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.api_url = "https://api.line.biz/v2/bot/message/push"

    def send_text_message(self, line_user_id: str, text: str) -> Tuple[bool, str]:
        """テキストメッセージを送信"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.access_token}",
            }
            payload = {
                "to": line_user_id,
                "messages": [{"type": "text", "text": text}],
            }

            response = requests.post(self.api_url, json=payload, headers=headers)

            if response.status_code == 200:
                return True, "送信成功"
            else:
                return False, f"送信失敗: {response.status_code} {response.text}"
        except Exception as e:
            return False, f"エラー: {str(e)}"

    def send_flex_message(self, line_user_id: str, flex_message: Dict) -> Tuple[bool, str]:
        """Flex Messageを送信"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.access_token}",
            }
            payload = {
                "to": line_user_id,
                "messages": [flex_message],
            }

            response = requests.post(self.api_url, json=payload, headers=headers)

            if response.status_code == 200:
                return True, "送信成功"
            else:
                return False, f"送信失敗: {response.status_code} {response.text}"
        except Exception as e:
            return False, f"エラー: {str(e)}"


def create_test_matches() -> List[MatchedItem]:
    """テスト用のマッチングデータを作成"""
    return [
        MatchedItem(
            product_name="いちご",
            purchased_price=1780,
            flyer_store="フィール野田店",
            flyer_price=1280,
            savings=500,
            savings_percent=28,
            flyer_url="https://tokubai.co.jp/フィール/428",
            discount="¥500割引",
            receipt_date="2026-02-28",
        ),
        MatchedItem(
            product_name="いちご",
            purchased_price=1780,
            flyer_store="バロー千音寺店",
            flyer_price=1480,
            savings=300,
            savings_percent=17,
            flyer_url="https://tokubai.co.jp/バロー/237912",
            discount="¥300割引",
            receipt_date="2026-02-28",
        ),
        MatchedItem(
            product_name="アリナミンEXプラスアルファ",
            purchased_price=2980,
            flyer_store="クスリのアオキ野田店",
            flyer_price=2680,
            savings=300,
            savings_percent=10,
            flyer_url="https://tokubai.co.jp/クスリのアオキ/225282",
            discount="¥300割引",
            receipt_date="2026-03-08",
        ),
        MatchedItem(
            product_name="明治 北海道バター",
            purchased_price=498,
            flyer_store="ベイシア名古屋港",
            flyer_price=388,
            savings=110,
            savings_percent=22,
            flyer_url="https://tokubai.co.jp/ベイシアフードセンター/4012",
            discount="¥110割引",
            receipt_date="2026-02-28",
        ),
        MatchedItem(
            product_name="明治 北海道バター",
            purchased_price=498,
            flyer_store="バロー千音寺店",
            flyer_price=398,
            savings=100,
            savings_percent=20,
            flyer_url="https://tokubai.co.jp/バロー/237912",
            discount="¥100割引",
            receipt_date="2026-02-28",
        ),
    ]


def main():
    """メイン処理"""
    print("=" * 70)
    print("🚀 家計防衛エージェント - スタンドアロン通知システム")
    print("=" * 70)

    # テストデータを作成
    matches = create_test_matches()

    # 通知生成エンジンを初期化
    generator = ImprovedNotificationGenerator()

    # テキスト形式通知を生成
    print("\n【テキスト形式通知】")
    print("-" * 70)
    text_notification = generator.generate_line_text_notification(matches)
    print(text_notification)

    # Flex Message形式を生成
    print("\n【Flex Message形式（JSON）】")
    print("-" * 70)
    flex_message = generator.generate_line_flex_message(matches)
    print(json.dumps(flex_message, ensure_ascii=False, indent=2))

    # HTML形式を生成
    print("\n【HTML形式通知】")
    print("-" * 70)
    html_notification = generator.generate_html_notification(matches)
    print("HTML形式の通知が生成されました（省略表示）")
    print(f"HTML長: {len(html_notification)} 文字")

    # LINE通知をシミュレート（実際には送信しない）
    print("\n【LINE通知シミュレーション】")
    print("-" * 70)
    access_token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN", "DUMMY_TOKEN")
    if access_token == "DUMMY_TOKEN":
        print("⚠️  LINE_CHANNEL_ACCESS_TOKEN が設定されていません")
        print("実際に送信するには、環境変数を設定してください:")
        print("  export LINE_CHANNEL_ACCESS_TOKEN=<your_token>")
    else:
        service = LineNotificationService(access_token)
        line_user_id = os.getenv("LINE_USER_ID", "DUMMY_USER_ID")
        print(f"送信先LINE User ID: {line_user_id}")
        print("テキスト形式を送信します...")
        # success, message = service.send_text_message(line_user_id, text_notification)
        # print(f"結果: {message}")

    print("\n" + "=" * 70)
    print("✅ スタンドアロン通知システムのテスト完了")
    print("=" * 70)


if __name__ == "__main__":
    main()
