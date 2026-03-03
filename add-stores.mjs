#!/usr/bin/env node

/**
 * スクリプト: フィール野田店とベイシア名古屋港をデータベースに追加
 * 使用方法: node add-stores.mjs
 */

import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'household_budget',
});

// スーパー情報を取得（テスト用ユーザーID = 1と仮定）
const userId = 1;

const stores = [
  {
    name: 'フィール野田店',
    region: '愛知県名古屋市中川区',
    tokubaiUrl: 'https://tokubai.co.jp/フィール/428',
    shufooUrl: null,
    otherChirashiUrl: null,
  },
  {
    name: 'ベイシア名古屋港',
    region: '愛知県名古屋市港区',
    tokubaiUrl: 'https://tokubai.co.jp/ベイシアフードセンター/4012',
    shufooUrl: null,
    otherChirashiUrl: null,
  },
];

try {
  console.log('スーパー情報を追加中...');
  
  for (const store of stores) {
    const query = `
      INSERT INTO supermarkets (userId, name, region, tokubaiUrl, shufooUrl, otherChirashiUrl, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;
    
    const values = [
      userId,
      store.name,
      store.region,
      store.tokubaiUrl,
      store.shufooUrl,
      store.otherChirashiUrl,
    ];
    
    await connection.execute(query, values);
    console.log(`✓ ${store.name} を追加しました`);
  }
  
  console.log('\n追加完了！');
  
} catch (error) {
  console.error('エラーが発生しました:', error);
  process.exit(1);
} finally {
  await connection.end();
}
