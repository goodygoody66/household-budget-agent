/**
 * レシート分析テストスクリプト
 * 3つのレシート画像を分析し、マッチング結果を表示
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { invokeLLM } from './_core/llm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * レシート画像をBase64エンコード
 */
function encodeImageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * LLMでレシート分析
 */
async function analyzeReceipt(imagePath: string, storeName: string) {
  console.log(`\n📸 ${storeName} のレシート分析を開始します...`);
  console.log(`📄 ファイル: ${imagePath}`);

  const imageBase64 = encodeImageToBase64(imagePath);
  const mimeType = 'image/jpeg';

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `あなたはレシート分析の専門家です。提供された画像からレシート情報を抽出してください。
          
以下の形式でJSON形式で返してください：
{
  "store_name": "店舗名",
  "date": "日付",
  "total_amount": "合計金額",
  "items": [
    {
      "name": "商品名",
      "quantity": "数量",
      "unit_price": "単価",
      "total_price": "合計価格"
    }
  ],
  "payment_method": "支払い方法",
  "notes": "その他の注記"
}

重要：
- 商品名は正確に読み取ってください
- 価格は数値のみ（¥記号なし）で返してください
- 読み取れない部分は null を使用してください`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'このレシート画像から商品情報を抽出してください。',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content as string;
    
    // JSONを抽出（マークダウンコードブロックに包まれている可能性あり）
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }
    
    const analysisResult = JSON.parse(jsonContent);

    console.log(`✅ ${storeName} の分析完了`);
    console.log(`📊 店舗: ${analysisResult.store_name}`);
    console.log(`📅 日付: ${analysisResult.date}`);
    console.log(`💰 合計: ${analysisResult.total_amount}`);
    console.log(`🛒 商品数: ${analysisResult.items.length}件`);
    console.log('\n📋 抽出された商品（最初の10件）:');
    analysisResult.items.slice(0, 10).forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item.name} (${item.quantity || '数量不明'}) - ${item.total_price || '価格不明'}`);
    });
    if (analysisResult.items.length > 10) {
      console.log(`  ... 他 ${analysisResult.items.length - 10} 件`);
    }

    return analysisResult;
  } catch (error) {
    console.error(`❌ ${storeName} の分析に失敗しました:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 レシート分析テストを開始します\n');
  console.log('='.repeat(60));

  try {
    // 1. バロー千音寺店のレシート分析（1枚目）
    const valorReceipt1 = await analyzeReceipt(
      path.join(__dirname, '../receipt_valor.jpg'),
      'バロー千音寺店（1枚目）'
    );

    console.log('\n' + '='.repeat(60));

    // 2. クスリのアオキ野田店のレシート分析
    const aokiReceipt = await analyzeReceipt(
      path.join(__dirname, '../receipt_aoki.jpg'),
      'クスリのアオキ野田店'
    );

    console.log('\n' + '='.repeat(60));

    // 3. バロー千音寺店のレシート分析（2枚目）
    const valorReceipt2 = await analyzeReceipt(
      path.join(__dirname, '../receipt_valor_2.jpg'),
      'バロー千音寺店（2枚目）'
    );

    console.log('\n' + '='.repeat(60));

    // 4. クスリのアオキ野田店のレシート分析（2枚目）
    const aokiReceipt2 = await analyzeReceipt(
      path.join(__dirname, '../receipt_aoki_2.jpg'),
      'クスリのアオキ野田店（2枚目）'
    );

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 分析結果サマリー:');
    console.log(`\n✅ バロー千音寺店（1枚目）:`);
    console.log(`   - 商品数: ${valorReceipt1.items.length}件`);
    console.log(`   - 合計金額: ${valorReceipt1.total_amount}`);

    console.log(`\n✅ クスリのアオキ野田店（1枚目）:`);
    console.log(`   - 商品数: ${aokiReceipt.items.length}件`);
    console.log(`   - 合計金額: ${aokiReceipt.total_amount}`);

    console.log(`\n✅ バロー千音寺店（2枚目）:`);
    console.log(`   - 商品数: ${valorReceipt2.items.length}件`);
    console.log(`   - 合計金額: ${valorReceipt2.total_amount}`);

    console.log(`\n✅ クスリのアオキ野田店（2枚目）:`);
    console.log(`   - 商品数: ${aokiReceipt2.items.length}件`);
    console.log(`   - 合計金額: ${aokiReceipt2.total_amount}`);

    console.log('\n✅ レシート分析テスト完了！');
    console.log('次のステップ: チラシマッチング処理を実行します\n');

    return { valorReceipt1, aokiReceipt, valorReceipt2, aokiReceipt2 };
  } catch (error) {
    console.error('\n❌ テスト失敗:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
