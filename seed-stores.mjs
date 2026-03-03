import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'household_budget',
});

try {
  // テストユーザーID（通常は1）
  const userId = 1;

  // 店舗データを挿入
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
    {
      name: '業務スーパー黄金店',
      region: '愛知県名古屋市中村区',
      tokubaiUrl: null,
      shufooUrl: null,
      otherChirashiUrl: null,
    },
  ];

  for (const store of stores) {
    const query = `
      INSERT INTO supermarkets (userId, name, region, tokubaiUrl, shufooUrl, otherChirashiUrl, isActive)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `;
    
    await connection.execute(query, [
      userId,
      store.name,
      store.region,
      store.tokubaiUrl,
      store.shufooUrl,
      store.otherChirashiUrl,
    ]);

    console.log(`✓ ${store.name} を追加しました`);
  }

  console.log('\n✓ すべての店舗を追加しました');
} catch (error) {
  console.error('エラー:', error);
} finally {
  await connection.end();
}
