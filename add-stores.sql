-- フィール野田店とベイシア名古屋港を追加
-- ユーザーID 1（テスト用）に紐付ける

INSERT INTO supermarkets (userId, name, region, tokubaiUrl, shufooUrl, otherChirashiUrl, isActive, createdAt, updatedAt) VALUES
(1, 'フィール野田店', '愛知県名古屋市中川区', 'https://tokubai.co.jp/フィール/428', NULL, NULL, 1, NOW(), NOW()),
(1, 'ベイシア名古屋港', '愛知県名古屋市港区', 'https://tokubai.co.jp/ベイシアフードセンター/4012', NULL, NULL, 1, NOW(), NOW());
