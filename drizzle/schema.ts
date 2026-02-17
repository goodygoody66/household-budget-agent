import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * スーパー情報テーブル
 * ユーザーがよく利用するスーパーの情報を管理
 */
export const supermarkets = mysqlTable("supermarkets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // スーパー名（例：イオン、アピタ）
  region: varchar("region", { length: 255 }), // 地域（例：名古屋市中区）
  tokubaiUrl: varchar("tokubaiUrl", { length: 512 }), // トクバイのURL
  shufooUrl: varchar("shufooUrl", { length: 512 }), // Shufoo!のURL
  otherChirashiUrl: varchar("otherChirashiUrl", { length: 512 }), // その他チラシサイトのURL
  isActive: int("isActive").default(1).notNull(), // 1: 有効, 0: 無効
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supermarket = typeof supermarkets.$inferSelect;
export type InsertSupermarket = typeof supermarkets.$inferInsert;

/**
 * レシート情報テーブル
 * ユーザーがアップロードしたレシート画像と抽出データを管理
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }).notNull(), // S3に保存されたレシート画像のURL
  imageKey: varchar("imageKey", { length: 512 }).notNull(), // S3のキー
  purchaseDate: timestamp("purchaseDate"), // 購入日時
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }), // 合計金額
  storeName: varchar("storeName", { length: 255 }), // 購入店舗名
  items: json("items"), // 抽出された商品情報（JSON形式）
  // items構造: [{ name: string, price: number, category: string, quantity?: number }]
  rawText: text("rawText"), // LLMが抽出した生テキスト
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

/**
 * 購買傾向分析テーブル
 * ユーザーの購買パターンを集計・分析した結果を保存
 */
export const purchaseTrends = mysqlTable("purchaseTrends", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 255 }).notNull(), // 商品カテゴリー（例：野菜、肉、魚）
  itemName: varchar("itemName", { length: 255 }).notNull(), // 商品名
  purchaseCount: int("purchaseCount").default(0).notNull(), // 購入回数
  averagePrice: decimal("averagePrice", { precision: 10, scale: 2 }), // 平均購入価格
  lastPurchaseDate: timestamp("lastPurchaseDate"), // 最後の購入日
  purchaseFrequencyDays: int("purchaseFrequencyDays"), // 平均購入間隔（日数）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseTrend = typeof purchaseTrends.$inferSelect;
export type InsertPurchaseTrend = typeof purchaseTrends.$inferInsert;

/**
 * チラシ情報テーブル
 * スーパーのチラシから抽出した特売情報を管理
 */
export const flyers = mysqlTable("flyers", {
  id: int("id").autoincrement().primaryKey(),
  supermarketId: int("supermarketId").notNull(), // スーパー情報への外部キー
  flyerImageUrl: varchar("flyerImageUrl", { length: 512 }), // チラシ画像のURL
  flyerImageKey: varchar("flyerImageKey", { length: 512 }), // S3のキー
  source: varchar("source", { length: 50 }).notNull(), // チラシ源（tokubai, shufoo, other）
  validFrom: timestamp("validFrom"), // チラシ有効期間開始
  validTo: timestamp("validTo"), // チラシ有効期間終了
  items: json("items"), // 抽出された商品情報（JSON形式）
  // items構造: [{ name: string, regularPrice: number, salePrice: number, discount: number, category: string }]
  rawText: text("rawText"), // LLM抽出の生テキスト
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Flyer = typeof flyers.$inferSelect;
export type InsertFlyer = typeof flyers.$inferInsert;

/**
 * マッチング結果テーブル
 * 購買傾向とチラシ特売情報をマッチングした結果を保存
 */
export const matchingResults = mysqlTable("matchingResults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flyerId: int("flyerId").notNull(), // チラシ情報への外部キー
  purchaseTrendId: int("purchaseTrendId"), // 購買傾向への外部キー（オプション）
  itemName: varchar("itemName", { length: 255 }).notNull(), // マッチした商品名
  category: varchar("category", { length: 255 }), // 商品カテゴリー
  regularPrice: decimal("regularPrice", { precision: 10, scale: 2 }), // 通常価格
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }), // セール価格
  savingsAmount: decimal("savingsAmount", { precision: 10, scale: 2 }), // 節約額
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }), // 割引率（%）
  userPurchaseFrequency: int("userPurchaseFrequency"), // ユーザーの購入頻度（回）
  matchScore: decimal("matchScore", { precision: 5, scale: 2 }), // マッチスコア（0-100）
  isRecommended: int("isRecommended").default(1).notNull(), // 1: 推奨, 0: 非推奨
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchingResult = typeof matchingResults.$inferSelect;
export type InsertMatchingResult = typeof matchingResults.$inferInsert;

/**
 * 分析履歴テーブル
 * レシート分析やチラシ解析の実行履歴を記録
 */
export const analysisHistory = mysqlTable("analysisHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  analysisType: mysqlEnum("analysisType", ["receipt", "flyer", "matching"]).notNull(), // 分析タイプ
  targetId: int("targetId"), // 対象のID（receiptId, flyerId, matchingResultId）
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  result: json("result"), // 分析結果（JSON形式）
  errorMessage: text("errorMessage"), // エラーメッセージ
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"), // 完了時刻
});

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type InsertAnalysisHistory = typeof analysisHistory.$inferInsert;
