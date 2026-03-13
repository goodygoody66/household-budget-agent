/**
 * リアルなチラシマッチング処理テスト
 * 実際のレシート情報とチラシ情報をマッチングして通知を送信
 */

import { notifyOwner } from './_core/notification';

/**
 * テスト用レシートデータ（実際のレシート分析結果）
 */
const testReceipts = [
  {
    id: 'receipt_001',
    store: 'バロー千音寺店',
    date: '2026-02-28',
    total: 17440,
    items: [
      { name: '明治 果汁グミ推し味フルーツ', price: 196, quantity: 2 },
      { name: 'いちご', price: 1780, quantity: 1 },
      { name: '明治 北海道バター', price: 498, quantity: 1 },
      { name: 'VS 海鮮ミックス', price: 328, quantity: 1 },
      { name: 'VS 五目ずしの素', price: 198, quantity: 1 },
      { name: 'フジッコ ふじっ子煮', price: 228, quantity: 1 },
      { name: '日清食品 チキンラーメ', price: 378, quantity: 1 },
      { name: 'カルビー サッポロポテト', price: 108, quantity: 1 },
      { name: 'カルビー かっぱえびせん', price: 108, quantity: 1 },
    ],
  },
  {
    id: 'receipt_002',
    store: 'クスリのアオキ野田店',
    date: '2026-02-25',
    total: 5273,
    items: [
      { name: 'デオドラントフットスプレー', price: 798, quantity: 1 },
      { name: 'ハチミツキンカンノドアメ', price: 218, quantity: 1 },
      { name: 'カジユウグミウンシユウミカン', price: 148, quantity: 1 },
      { name: 'ホンキザミワサビ 42g', price: 218, quantity: 1 },
    ],
  },
  {
    id: 'receipt_003',
    store: 'バロー千音寺店',
    date: '2026-03-08',
    total: 12346,
    items: [
      { name: 'ミニクロワッサン（チョコ）', price: 500, quantity: 1 },
      { name: 'カンロ マロッシュグレー', price: 158, quantity: 1 },
      { name: 'カンロ ピュレグミ', price: 158, quantity: 1 },
      { name: '日清食品 チキンラーメ', price: 378, quantity: 1 },
      { name: 'カルビー ポテトチップス', price: 108, quantity: 1 },
    ],
  },
  {
    id: 'receipt_004',
    store: 'クスリのアオキ野田店',
    date: '2026-03-08',
    total: 5964,
    items: [
      { name: 'アリナミンEXプラスアルファ', price: 2980, quantity: 1 },
      { name: 'ホンキザミワサビ 42g', price: 218, quantity: 1 },
      { name: 'ゴールドスター 350×6カ', price: 788, quantity: 1 },
    ],
  },
];

/**
 * テスト用チラシデータ（実際のチラシ情報）
 */
const testFlyerData = [
  {
    store: 'バロー千音寺店',
    url: 'https://tokubai.co.jp/バロー/237912',
    items: [
      { name: '明治 北海道バター', price: 398, discount: '¥100割引' },
      { name: 'いちご', price: 1480, discount: '¥300割引' },
      { name: 'カルビー かっぱえびせん', price: 88, discount: '¥20割引' },
      { name: '日清食品 チキンラーメ', price: 298, discount: '¥80割引' },
    ],
  },
  {
    store: 'クスリのアオキ野田店',
    url: 'https://tokubai.co.jp/クスリのアオキ/225282',
    items: [
      { name: 'ホンキザミワサビ 42g', price: 168, discount: '¥50割引' },
      { name: 'アリナミンEXプラスアルファ', price: 2680, discount: '¥300割引' },
      { name: 'ゴールドスター 350×6カ', price: 688, discount: '¥100割引' },
    ],
  },
  {
    store: 'フィール野田店',
    url: 'https://tokubai.co.jp/フィール/428',
    items: [
      { name: 'いちご', price: 1280, discount: '¥500割引' },
      { name: 'カルビー かっぱえびせん', price: 78, discount: '¥30割引' },
    ],
  },
  {
    store: 'ベイシア名古屋港',
    url: 'https://tokubai.co.jp/ベイシアフードセンター/4012',
    items: [
      { name: '明治 北海道バター', price: 388, discount: '¥110割引' },
      { name: 'カルビー ポテトチップス', price: 98, discount: '¥10割引' },
    ],
  },
];

/**
 * マッチング処理
 */
function matchReceiptsWithFlyers() {
  const matches: any[] = [];

  for (const receipt of testReceipts) {
    for (const item of receipt.items) {
      for (const flyer of testFlyerData) {
        const flyerItem = flyer.items.find(
          (fi) =>
            fi.name.includes(item.name.substring(0, 10)) ||
            item.name.includes(fi.name.substring(0, 10))
        );

        if (flyerItem && flyerItem.price < item.price) {
          const savingAmount = item.price - flyerItem.price;
          matches.push({
            receiptDate: receipt.date,
            receiptStore: receipt.store,
            productName: item.name,
            purchasedPrice: item.price,
            flyerStore: flyer.store,
            flyerPrice: flyerItem.price,
            savings: savingAmount,
            savingsPercent: Math.round((savingAmount / item.price) * 100),
            flyerUrl: flyer.url,
            discount: flyerItem.discount,
          });
        }
      }
    }
  }

  return matches.sort((a, b) => b.savings - a.savings);
}

/**
 * 通知メッセージを生成
 */
function generateNotificationMessage(matches: any[]) {
  const topMatches = matches.slice(0, 5);

  let message = `🎯 **家計防衛エージェント - チラシマッチング結果**\n\n`;
  message += `📅 **マッチング対象期間**: 2026年2月25日～3月8日\n`;
  message += `📋 **レシート数**: 4枚（バロー千音寺店2枚、クスリのアオキ野田店2枚）\n`;
  message += `🛒 **総購買額**: ¥41,023\n`;
  message += `💰 **マッチング件数**: ${matches.length}件\n\n`;

  message += `**🔝 最大節約商品 TOP 5**\n\n`;

  topMatches.forEach((match, index) => {
    message += `${index + 1}. **${match.productName}**\n`;
    message += `   📅 購入日: ${match.receiptDate}\n`;
    message += `   🏪 購入店舗: ${match.receiptStore}\n`;
    message += `   💵 購入価格: ¥${match.purchasedPrice}\n`;
    message += `   ✨ チラシ価格: ¥${match.flyerPrice} (${match.flyerStore})\n`;
    message += `   💚 節約額: **¥${match.savings} (${match.savingsPercent}%割引)**\n`;
    message += `   📌 ${match.discount}\n`;
    message += `   🔗 ${match.flyerUrl}\n\n`;
  });

  message += `**📊 統計情報**\n`;
  const totalSavings = matches.reduce((sum, m) => sum + m.savings, 0);
  message += `- 総節約可能額: **¥${totalSavings}**\n`;
  message += `- 平均節約額: ¥${Math.round(totalSavings / matches.length)}\n`;
  message += `- 最大節約: ¥${matches[0].savings}\n`;

  return message;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 リアルなチラシマッチング処理を開始します\n');
  console.log('='.repeat(70));

  try {
    // 1. マッチング処理実行
    console.log('\n📊 マッチング処理中...');
    const matches = matchReceiptsWithFlyers();

    console.log(`✅ マッチング完了: ${matches.length}件の節約機会を発見\n`);

    // 2. 通知メッセージ生成
    const notificationMessage = generateNotificationMessage(matches);

    console.log('📢 生成された通知メッセージ:\n');
    console.log(notificationMessage);

    // 3. Manus通知を送信
    console.log('\n📤 Manus通知を送信中...');
    const notificationResult = await notifyOwner({
      title: '🎯 家計防衛エージェント - チラシマッチング結果',
      content: notificationMessage,
    });

    if (notificationResult) {
      console.log('✅ Manus通知を送信しました！');
    } else {
      console.log('⚠️ Manus通知の送信に失敗しました（サービス一時利用不可）');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ リアルなチラシマッチングテスト完了！');
    console.log('\n📋 マッチング詳細:');
    console.log(`- 対象期間: 2026年2月25日～3月8日`);
    console.log(`- レシート: バロー千音寺店（2026/02/28, 2026/03/08）`);
    console.log(`           クスリのアオキ野田店（2026/02/25, 2026/03/08）`);
    console.log(`- チラシ: バロー千音寺店、クスリのアオキ野田店、フィール野田店、ベイシア名古屋港`);
    console.log(`- 節約機会: ${matches.length}件`);
    console.log(`- 総節約可能額: ¥${matches.reduce((sum, m) => sum + m.savings, 0)}\n`);

    return matches;
  } catch (error) {
    console.error('\n❌ テスト失敗:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
