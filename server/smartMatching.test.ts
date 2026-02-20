import { describe, expect, it } from "vitest";
import { analyzeSmartMatching, FlyerItem, PurchasedItem } from "./smartMatching";

describe("Smart Matching Analysis", () => {
  it("should match flyer items with purchased items when sale price is lower", () => {
    const flyerItems: FlyerItem[] = [
      {
        name: "トマト",
        regularPrice: 200,
        salePrice: 150,
        discount: 25,
        category: "野菜",
      },
      {
        name: "牛乳",
        regularPrice: 180,
        salePrice: 160,
        discount: 11,
        category: "乳製品",
      },
    ];

    const purchasedItems: PurchasedItem[] = [
      {
        itemName: "トマト",
        category: "野菜",
        averagePrice: 180,
        purchaseCount: 5,
      },
      {
        itemName: "牛乳",
        category: "乳製品",
        averagePrice: 170,
        purchaseCount: 10,
      },
    ];

    const result = analyzeSmartMatching(flyerItems, purchasedItems, ["野菜", "乳製品", "肉"]);

    expect(result.matchedItems.length).toBeGreaterThan(0);
    expect(result.matchedItems[0]?.savingsAmount).toBeGreaterThan(0);
    expect(result.totalSavings).toBeGreaterThan(0);
  });

  it("should exclude categories not in purchase history", () => {
    const flyerItems: FlyerItem[] = [
      {
        name: "トマト",
        regularPrice: 200,
        salePrice: 150,
        discount: 25,
        category: "野菜",
      },
      {
        name: "サーモン",
        regularPrice: 1000,
        salePrice: 800,
        discount: 20,
        category: "魚",
      },
    ];

    const purchasedItems: PurchasedItem[] = [
      {
        itemName: "トマト",
        category: "野菜",
        averagePrice: 180,
        purchaseCount: 5,
      },
    ];

    const result = analyzeSmartMatching(flyerItems, purchasedItems, ["野菜", "魚"]);

    expect(result.excludedCategories).toContain("魚");
    expect(result.excludedCategories).not.toContain("野菜");
  });

  it("should not match items where sale price is higher than user average", () => {
    const flyerItems: FlyerItem[] = [
      {
        name: "トマト",
        regularPrice: 200,
        salePrice: 180,
        discount: 10,
        category: "野菜",
      },
    ];

    const purchasedItems: PurchasedItem[] = [
      {
        itemName: "トマト",
        category: "野菜",
        averagePrice: 150,
        purchaseCount: 5,
      },
    ];

    const result = analyzeSmartMatching(flyerItems, purchasedItems, ["野菜"]);

    expect(result.matchedItems.length).toBe(0);
  });

  it("should calculate match score based on purchase frequency and savings", () => {
    const flyerItems: FlyerItem[] = [
      {
        name: "牛乳",
        regularPrice: 180,
        salePrice: 140,
        discount: 22,
        category: "乳製品",
      },
    ];

    const purchasedItems: PurchasedItem[] = [
      {
        itemName: "牛乳",
        category: "乳製品",
        averagePrice: 170,
        purchaseCount: 20,
      },
    ];

    const result = analyzeSmartMatching(flyerItems, purchasedItems, ["乳製品"]);

    expect(result.matchedItems.length).toBe(1);
    expect(result.matchedItems[0]?.matchScore).toBeGreaterThan(50);
  });

  it("should handle empty flyer items", () => {
    const flyerItems: FlyerItem[] = [];

    const purchasedItems: PurchasedItem[] = [
      {
        itemName: "トマト",
        category: "野菜",
        averagePrice: 180,
        purchaseCount: 5,
      },
    ];

    const result = analyzeSmartMatching(flyerItems, purchasedItems, ["野菜"]);

    expect(result.matchedItems.length).toBe(0);
    expect(result.totalSavings).toBe(0);
  });

  it("should handle empty purchase history", () => {
    const flyerItems: FlyerItem[] = [
      {
        name: "トマト",
        regularPrice: 200,
        salePrice: 150,
        discount: 25,
        category: "野菜",
      },
    ];

    const purchasedItems: PurchasedItem[] = [];

    const result = analyzeSmartMatching(flyerItems, purchasedItems, ["野菜"]);

    expect(result.matchedItems.length).toBe(0);
    expect(result.excludedCategories).toContain("野菜");
  });

  it("should sort matched items by match score descending", () => {
    const flyerItems: FlyerItem[] = [
      {
        name: "牛乳",
        regularPrice: 180,
        salePrice: 140,
        discount: 22,
        category: "乳製品",
      },
      {
        name: "ヨーグルト",
        regularPrice: 150,
        salePrice: 130,
        discount: 13,
        category: "乳製品",
      },
    ];

    const purchasedItems: PurchasedItem[] = [
      {
        itemName: "牛乳",
        category: "乳製品",
        averagePrice: 170,
        purchaseCount: 20,
      },
      {
        itemName: "ヨーグルト",
        category: "乳製品",
        averagePrice: 140,
        purchaseCount: 5,
      },
    ];

    const result = analyzeSmartMatching(flyerItems, purchasedItems, ["乳製品"]);

    expect(result.matchedItems.length).toBe(2);
    expect(result.matchedItems[0]?.matchScore).toBeGreaterThanOrEqual(
      result.matchedItems[1]?.matchScore || 0
    );
  });
});
