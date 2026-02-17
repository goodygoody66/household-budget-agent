import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Supermarket Router", () => {
  let supermarketId: number;
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should create a supermarket", async () => {
    const result = await caller.supermarket.create({
      name: "バロー千音寺店",
      region: "名古屋市中区",
      tokubaiUrl: "https://tokubai.com/test",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("バロー千音寺店");
    expect(result.region).toBe("名古屋市中区");
    expect(result.userId).toBe(ctx.user.id);
    supermarketId = result.id;
  });

  it("should list supermarkets for user", async () => {
    const result = await caller.supermarket.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(s => s.id === supermarketId)).toBe(true);
  });

  it("should update a supermarket", async () => {
    await caller.supermarket.update({
      id: supermarketId,
      name: "バロー千音寺店 (更新)",
      region: "名古屋市中区千種",
    });

    const result = await caller.supermarket.list();
    const updated = result.find(s => s.id === supermarketId);
    expect(updated?.name).toBe("バロー千音寺店 (更新)");
    expect(updated?.region).toBe("名古屋市中区千種");
  });

  it("should delete a supermarket", async () => {
    await caller.supermarket.delete({ id: supermarketId });

    const result = await caller.supermarket.list();
    expect(result.some(s => s.id === supermarketId)).toBe(false);
  });

  it("should validate required fields", async () => {
    try {
      await caller.supermarket.create({
        name: "",
        region: "test",
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should validate URL format", async () => {
    try {
      await caller.supermarket.create({
        name: "Test Store",
        tokubaiUrl: "not-a-url",
      });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
