/**
 * LINE通知テストスクリプト
 * 改善版の通知フォーマットでLINE送信をシミュレート
 */

import { simulateLINENotification } from './lineNotificationService';

const testMatches = [
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
  {
    productName: 'ゴールドスター 350×6カ',
    purchasedPrice: 788,
    flyerStore: 'クスリのアオキ野田店',
    flyerPrice: 688,
    savings: 100,
    savingsPercent: 13,
    flyerUrl: 'https://tokubai.co.jp/クスリのアオキ/225282',
    discount: '¥100割引',
    receiptDate: '2026-03-08',
  },
  {
    productName: 'カルビー ポテトチップス',
    purchasedPrice: 108,
    flyerStore: 'ベイシア名古屋港',
    flyerPrice: 98,
    savings: 10,
    savingsPercent: 9,
    flyerUrl: 'https://tokubai.co.jp/ベイシアフードセンター/4012',
    discount: '¥10割引',
    receiptDate: '2026-03-08',
  },
];

async function main() {
  console.log('🚀 LINE通知テストを開始します\n');
  await simulateLINENotification(testMatches);
}

main().catch(console.error);
