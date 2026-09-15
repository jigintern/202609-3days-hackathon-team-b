-- 各ページのモックデータをシードとして投入する。
-- デモ用のデータなので、不要になったらこのファイルの内容を消して
-- DELETE FROM posts WHERE id LIKE 'p0%' OR id = 'p100'; で片付けられる。
-- 何度適用しても増えないよう INSERT OR IGNORE にしている。

INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p01', '¥480でできる痛バケツ活用聖地巡礼', 'アニメの舞台になった商店街を、電車の乗り放題きっぷだけで巡ってきた記録。歩いた距離は約6km。', '商店街の入り口に公式コラボの旗が立っていて写真映えする', 'pilgrimage', '埼玉県', 180, 480, 'うめ', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E8%81%96%E5%9C%B0%E5%B7%A1%E7%A4%BC"]', '["乗り放題きっぷを購入する", "商店街の公式コラボ旗を目印に巡る", "巡礼マップと照らし合わせて撮影する"]', '[]', '["聖地巡礼"]', '2026-09-10T00:00:00.000Z', '2026-09-10T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p02', '100均だけで手作り応援うちわ', '文字パネル用のうちわを100均素材だけで自作。夜光シートを貼って暗い会場でも見やすくした。', '', 'craft', '大阪府', 90, 750, 'かずきんぐ', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E3%82%B0%E3%83%83%E3%82%BA%E5%88%B6%E4%BD%9C"]', '["厚紙を台紙にする", "文字を切り抜いて貼る", "夜光シートで縁取りする"]', '[]', '["グッズ制作"]', '2026-09-08T00:00:00.000Z', '2026-09-08T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p03', '配信同時視聴だけで参戦気分', '遠征できない日は、コメント欄でみんなと実況しながら見る同時視聴配信で十分満足できた。', '配信開始30分前からコメント欄が盛り上がるので早めの入室がおすすめ', 'home', '北海道', 120, 0, 'ka-bon', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E8%87%AA%E5%AE%85%E6%8E%A8%E3%81%97%E6%B4%BB"]', '[]', '[]', '["自宅推し活"]', '2026-09-12T00:00:00.000Z', '2026-09-12T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p04', '始発高速バスだけで日帰り遠征', '宿泊なし、始発の高速バス往復のみで会場入り。前日にグッズを調べて並ぶ時間を短縮した。', '', 'live', '大阪府', 480, 9800, 'こうた', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E5%8F%82%E6%88%A6"]', '["前日にグッズ列の傾向を調べる", "始発バスを予約する", "日帰りで帰宅する"]', '[]', '["参戦"]', '2026-09-05T00:00:00.000Z', '2026-09-05T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p05', 'コンビニ食材だけで推し誕生日ケーキ', 'コンビニのスポンジと100均のトッピングだけで再現した、推しカラーの誕生日ケーキ記録。', '', 'craft', '神奈川県', 150, 1200, 'うめ', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E3%82%B0%E3%83%83%E3%82%BA%E5%88%B6%E4%BD%9C"]', '["スポンジとクリームを用意する", "推しカラーで着色する", "トッピングで飾り付ける"]', '[]', '["グッズ制作"]', '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p06', '最寄り駅から徒歩だけで巡る聖地巡礼', 'レンタサイクルもタクシーも使わず、徒歩だけで作中に登場した全スポットを回った記録。', '夏場は水分補給できる場所を事前に調べておくと安心', 'pilgrimage', '岐阜県', 240, 1500, 'かずきんぐ', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E8%81%96%E5%9C%B0%E5%B7%A1%E7%A4%BC"]', '["巡礼マップを事前に印刷する", "駅から徒歩ルートを組む", "各スポットで聖地写真と見比べる"]', '[]', '["聖地巡礼"]', '2026-08-28T00:00:00.000Z', '2026-08-28T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p07', '地元の神社にお参りするだけの推し活', '遠征費をかけずに、地元の神社にお参りして推しの活躍を祈願する絵馬を奉納する推し活。', '', 'home', '京都府', 60, 300, 'ka-bon', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E8%87%AA%E5%AE%85%E6%8E%A8%E3%81%97%E6%B4%BB"]', '[]', '[]', '["自宅推し活"]', '2026-09-13T00:00:00.000Z', '2026-09-13T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p08', 'フリマアプリだけで参戦装備を揃える', 'フリマアプリの中古ペンライトとタオルだけで、参戦に必要な装備一式を揃えた記録。', '', 'craft', '福岡県', 30, 2000, 'こうた', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E3%82%B0%E3%83%83%E3%82%BA%E5%88%B6%E4%BD%9C"]', '["出品相場を比較する", "状態の良い出品者を選ぶ", "到着後に動作確認する"]', '[]', '["グッズ制作"]', '2026-09-03T00:00:00.000Z', '2026-09-03T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p09', '夜行バス往復で宿泊費ゼロの参戦', '夜行バスの往復と日帰り行動で宿泊費をゼロに抑えた参戦記録。移動中はしっかり仮眠した。', '', 'live', '宮城県', 420, 6500, 'うめ', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E5%8F%82%E6%88%A6"]', '["夜行バスを早割で予約する", "車内で仮眠を取る", "日帰りで会場を後にする"]', '[]', '["参戦"]', '2026-08-30T00:00:00.000Z', '2026-08-30T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p001', '推しの出身地を巡る弾丸聖地巡礼(都内日帰り)', '電車移動のみで完結。交通費と軽食代のみで楽しめる推し活ルート。', '近くに聖地カフェがあるので合わせて立ち寄れる', 'pilgrimage', '東京都', 240, 3000, 'ゆき', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%8E%8C"]', '[]', '[]', '["聖地巡礼", "日帰り", "電車移動"]', '2026-08-10T00:00:00.000Z', '2026-08-10T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p002', '手作りうちわで参戦準備(文字うちわ制作)', '画用紙・シール・カラーテープのみで完結する低コストの参戦うちわ制作。', '100均素材だけで作れる、初心者向けの手順つき', 'craft', '大阪府', 120, 1500, 'そら', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%8E%A8"]', '[]', '[]', '["うちわ制作", "ハンドメイド", "初心者向け"]', '2026-08-12T00:00:00.000Z', '2026-08-12T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p003', '無料の野外イベントで推し活参戦', '商業施設の無料野外ステージを利用した参戦。手荷物ルールも紹介。', '入場無料、交通費と軽食代のみで楽しめる', 'live', '神奈川県', 180, 800, 'かい', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%8E%A4"]', '[]', '[]', '["野外イベント", "無料", "参戦"]', '2026-08-14T00:00:00.000Z', '2026-08-14T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p004', 'コラボカフェをお得に楽しむ回り方', '予約不要のコラボカフェを回るコース。徒歩圏内で完結。', '1店舗500円前後のドリンクでノベルティ狙い', 'cafe', '京都府', 150, 2000, 'みなと', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E2%98%95"]', '[]', '[]', '["コラボカフェ", "推しカフェ", "ノベルティ"]', '2026-08-15T00:00:00.000Z', '2026-08-15T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p005', 'スマホだけで撮る「祭壇」フォトテク', '自然光と100均の小物だけで推しグッズを飾る撮影テクニック集。', '追加費用ゼロ、家にある物だけで映える撮影', 'collection', '北海道', 90, 0, 'はると', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%93%B8"]', '[]', '[]', '["祭壇", "無料", "スマホ撮影"]', '2026-08-16T00:00:00.000Z', '2026-08-16T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p006', '缶バッジ&アクリルスタンド風グッズ自作', '自宅プリンターと100均のキーホルダー金具で完結する低コストクラフト。', '推しの描いたイラストを印刷して自作するだけ', 'craft', '愛知県', 60, 500, 'つむぎ', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%A7%B7"]', '[]', '[]', '["グッズ制作", "初心者向け"]', '2026-08-17T00:00:00.000Z', '2026-08-17T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p007', '聖地巡礼+御朱印集めの一日旅', '電車とバスを乗り継ぐ巡礼ルート。御朱印帳は事前準備が必要。', '御朱印代を含めても半日で5,000円台に収まる', 'pilgrimage', '奈良県', 360, 5500, 'あおい', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E2%9B%A9%EF%B8%8F"]', '[]', '[]', '["聖地巡礼", "御朱印", "神社仏閣"]', '2026-08-18T00:00:00.000Z', '2026-08-18T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p008', '配信ライブを友達と鑑賞会で参戦気分', '持ち寄りの軽食のみで完結する、遠征なしの参戦スタイル。', '配信視聴料を割り勘、会場費ゼロの自宅参戦', 'live', '長野県', 300, 1200, 'りく', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%8E%AB"]', '[]', '[]', '["配信ライブ", "参戦", "友達と"]', '2026-08-19T00:00:00.000Z', '2026-08-19T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p009', '個人店の推し色ドリンクでプチ推し活', '1杯600円前後のカスタムドリンクを推しカラーで楽しむコース。', '推しカラーのドリンクをオーダーメイドできる店を紹介', 'cafe', '福岡県', 120, 1800, 'ももこ', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%8D%B0"]', '[]', '[]', '["推しカラー", "推しカフェ"]', '2026-08-20T00:00:00.000Z', '2026-08-20T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p010', '100均素材だけの推しぬい服作り', 'フェルトと接着剤中心で完結する、推しぬい用の裁縫なしクラフト。', '型紙不要、裁縫初心者でも1時間で完成', 'craft', '北海道', 90, 1000, 'ゆず', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%F0%9F%A7%B8"]', '[]', '[]', '["推しぬい", "初心者向け", "ハンドメイド"]', '2026-08-21T00:00:00.000Z', '2026-08-21T00:00:00.000Z'
);
INSERT OR IGNORE INTO posts (id, title, body, tip, genre, prefecture, duration_min, budget, author_name, images, steps, materials, tags, created_at, updated_at) VALUES (
  'p100', '推しの缶バッジ風アクセサリー作り', '推しのイラストを使ったオリジナル缶バッジを手作りしました。
100均とお店で揃う材料だけで、初心者でも30分〜1時間ほどで完成します！', '近くに「手芸センタードリーム 新宿店」があるので、材料調達に立ち寄るのがおすすめです。', 'craft', '東京都', 180, 2500, 'みさき', '["https://placehold.jp/ffef6c/222222/600x450.png?text=%E5%AE%8C%E6%88%90%E5%86%99%E7%9C%9F", "https://placehold.jp/f5f5f5/222222/600x450.png?text=%E6%9D%90%E6%96%99%E4%B8%80%E8%A6%A7", "https://placehold.jp/f5f5f5/222222/600x450.png?text=%E4%BD%9C%E6%A5%AD%E9%A2%A8%E6%99%AF"]', '["好きな推しのイラストを印刷する", "缶バッジのテンプレートサイズに合わせて丸く切り抜く", "キットのパーツにイラストをセットする", "専用プレス機でしっかり圧着する", "完成！ピンやマグネットをつけて持ち歩こう"]', '["缶バッジキット(38mm) ×5", "コピー用紙（印刷用）", "はさみ・カッター", "クリアシール", "推しのイラストデータ"]', '["グッズ制作", "初心者向け", "100均"]', '2026-09-10T00:00:00.000Z', '2026-09-10T00:00:00.000Z'
);

INSERT OR IGNORE INTO reports (id, post_id, author_name, body, image_url, created_at) VALUES (
  'r001', 'p100', 'ゆか', '実際に作ってみました！思ったより簡単で30分で完成しました✨', 'https://placehold.jp/fafafa/222222/600x450.png?text=%E5%AE%8C%E6%88%90%E5%93%81', '2026-09-11T00:00:00.000Z'
);
INSERT OR IGNORE INTO reports (id, post_id, author_name, body, image_url, created_at) VALUES (
  'r002', 'p100', 'たくみ', '缶バッジキットが100均でも売っていたので、さらに節約できました！', NULL, '2026-09-12T00:00:00.000Z'
);

-- detail/index.html のモックにあったいいね数を再現する
UPDATE posts   SET like_count = 128 WHERE id = 'p100';
UPDATE reports SET like_count = 12  WHERE id = 'r001';
UPDATE reports SET like_count = 8   WHERE id = 'r002';
