import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, Supermarket, InsertSupermarket, Receipt, InsertReceipt, PurchaseTrend, InsertPurchaseTrend, Flyer, InsertFlyer, MatchingResult, InsertMatchingResult, AnalysisHistory, InsertAnalysisHistory, supermarkets, receipts, purchaseTrends, flyers, matchingResults, analysisHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Supermarket queries
export async function createSupermarket(data: InsertSupermarket): Promise<Supermarket> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(supermarkets).values(data);
  const created = await db.select().from(supermarkets).where(eq(supermarkets.userId, data.userId!)).orderBy(desc(supermarkets.createdAt)).limit(1);
  return created[0]!;
}

export async function getUserSupermarkets(userId: number): Promise<Supermarket[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supermarkets).where(eq(supermarkets.userId, userId));
}

export async function updateSupermarket(id: number, data: Partial<InsertSupermarket>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(supermarkets).set(data).where(eq(supermarkets.id, id));
}

export async function deleteSupermarket(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supermarkets).where(eq(supermarkets.id, id));
}

// Receipt queries
export async function createReceipt(data: InsertReceipt): Promise<Receipt> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(receipts).values(data);
  const created = await db.select().from(receipts).where(eq(receipts.userId, data.userId!)).orderBy(desc(receipts.createdAt)).limit(1);
  return created[0]!;
}

export async function getUserReceipts(userId: number, limit: number = 50): Promise<Receipt[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(receipts).where(eq(receipts.userId, userId)).orderBy(desc(receipts.createdAt)).limit(limit);
}

export async function getReceiptById(id: number): Promise<Receipt | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
  return result[0];
}

// Purchase Trend queries
export async function upsertPurchaseTrend(data: InsertPurchaseTrend): Promise<PurchaseTrend> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(purchaseTrends)
    .where(and(eq(purchaseTrends.userId, data.userId!), eq(purchaseTrends.itemName, data.itemName!)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(purchaseTrends).set(data).where(eq(purchaseTrends.id, existing[0].id));
    return (await db.select().from(purchaseTrends).where(eq(purchaseTrends.id, existing[0].id)).limit(1))[0]!;
  } else {
    await db.insert(purchaseTrends).values(data);
    const created = await db.select().from(purchaseTrends).where(eq(purchaseTrends.userId, data.userId!)).orderBy(desc(purchaseTrends.createdAt)).limit(1);
    return created[0]!;
  }
}

export async function getUserPurchaseTrends(userId: number): Promise<PurchaseTrend[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(purchaseTrends).where(eq(purchaseTrends.userId, userId));
}

// Flyer queries
export async function createFlyer(data: InsertFlyer): Promise<Flyer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(flyers).values(data);
  const created = await db.select().from(flyers).where(eq(flyers.supermarketId, data.supermarketId!)).orderBy(desc(flyers.createdAt)).limit(1);
  return created[0]!;
}

export async function getSupermarketFlyers(supermarketId: number): Promise<Flyer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flyers).where(eq(flyers.supermarketId, supermarketId)).orderBy(desc(flyers.createdAt));
}

// Matching Result queries
export async function createMatchingResult(data: InsertMatchingResult): Promise<MatchingResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(matchingResults).values(data);
  const created = await db.select().from(matchingResults).where(eq(matchingResults.userId, data.userId!)).orderBy(desc(matchingResults.createdAt)).limit(1);
  return created[0]!;
}

export async function getUserMatchingResults(userId: number, limit: number = 100): Promise<MatchingResult[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matchingResults).where(eq(matchingResults.userId, userId)).orderBy(desc(matchingResults.createdAt)).limit(limit);
}

// Analysis History queries
export async function createAnalysisHistory(data: InsertAnalysisHistory): Promise<AnalysisHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(analysisHistory).values(data);
  const created = await db.select().from(analysisHistory).where(eq(analysisHistory.userId, data.userId!)).orderBy(desc(analysisHistory.createdAt)).limit(1);
  return created[0]!;
}

export async function updateAnalysisHistory(id: number, data: Partial<InsertAnalysisHistory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(analysisHistory).set(data).where(eq(analysisHistory.id, id));
}
