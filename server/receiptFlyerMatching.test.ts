import { describe, it, expect } from "vitest";
import {
  matchReceiptWithFlyer,
  generateMatchingReport,
  ReceiptItem,
  FlyerItem,
} from "./receiptFlyerMatching";

describe("Receipt and Flyer Matching", () => {
  const receiptItems: ReceiptItem[] = [
    {
      name: "トマト",
      price: 298,
      category: "野菜",
      quantity: 1,
    },
    {
      name: "牛肉",
      price: 1280,
      category: "肉",
      quantity: 1,
    },
    {
      name: "牛乳",
      price: 198,
      category: "乳製品",
      quantity: 1,
    },
  ];

  const flyerItems: FlyerItem[] = [
    {
      name: "トマト",
      regularPrice: 398,
      salePrice: 198,
      discountPercentage: 50,
      category: "野菜",
      storeName: "バロー",
      salePeriod: "2026/02/20-02/26",
    },
    {
      name: "牛肉",
      regularPrice: 1580,
      salePrice: 980,
      discountPercentage: 38,
      category: "肉",
      storeName: "バロー",
      salePeriod: "2026/02/20-02/26",
    },
    {
      name: "チーズ",
      regularPrice: 450,
      salePrice: 299,
      discountPercentage: 34,
      category: "乳製品",
      storeName: "バロー",
      salePeriod: "2026/02/20-02/26",
    },
    {
      name: "ヨーグルト",
      regularPrice: 280,
      salePrice: 180,
      discountPercentage: 36,
      category: "乳製品",
      storeName: "クスリのアオキ",
      salePeriod: "2026/02/18-02/24",
    },
  ];

  it("should match receipt items with flyer items", () => {
    const result = matchReceiptWithFlyer(receiptItems, flyerItems);

    expect(result.matchedItems.length).toBeGreaterThan(0);
    expect(result.totalSavings).toBeGreaterThan(0);
  });

  it("should calculate savings correctly", () => {
    const result = matchReceiptWithFlyer(receiptItems, flyerItems);

    // Check if matched items have positive savings
    for (const match of result.matchedItems) {
      expect(match.savingsAmount).toBeGreaterThan(0);
      expect(match.savingsPercentage).toBeGreaterThan(0);
    }
  });

  it("should exclude categories without purchase history", () => {
    const result = matchReceiptWithFlyer(receiptItems, flyerItems);

    // チーズはレシートに無いので除外されるはず
    const hasCheeseInMatched = result.matchedItems.some(
      m => m.flyerItem.name === "チーズ"
    );
    expect(hasCheeseInMatched).toBe(false);
  });

  it("should generate matching report", () => {
    const result = matchReceiptWithFlyer(receiptItems, flyerItems);
    const report = generateMatchingReport(result);

    expect(report.summary).toBeDefined();
    expect(report.details).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("should handle empty receipt items", () => {
    const result = matchReceiptWithFlyer([], flyerItems);

    expect(result.matchedItems.length).toBe(0);
    expect(result.totalSavings).toBe(0);
    expect(result.excludedCategories.length).toBeGreaterThan(0);
  });

  it("should handle empty flyer items", () => {
    const result = matchReceiptWithFlyer(receiptItems, []);

    expect(result.matchedItems.length).toBe(0);
    expect(result.totalSavings).toBe(0);
  });

  it("should match items with similar names", () => {
    const items: ReceiptItem[] = [
      {
        name: "トマト",
        price: 298,
        category: "野菜",
      },
    ];

    const flyers: FlyerItem[] = [
      {
        name: "トマト（国産）",
        regularPrice: 398,
        salePrice: 198,
        category: "野菜",
        storeName: "バロー",
      },
    ];

    const result = matchReceiptWithFlyer(items, flyers, 0.4);

    expect(result.matchedItems.length).toBeGreaterThan(0);
    expect(result.matchedItems[0].similarity).toBeGreaterThan(0.3);
  });

  it("should not match items from different categories", () => {
    const items: ReceiptItem[] = [
      {
        name: "牛肉",
        price: 1280,
        category: "肉",
      },
    ];

    const flyers: FlyerItem[] = [
      {
        name: "牛肉",
        regularPrice: 1580,
        salePrice: 980,
        category: "野菜", // Different category
        storeName: "バロー",
      },
    ];

    const result = matchReceiptWithFlyer(items, flyers);

    expect(result.matchedItems.length).toBe(0);
  });
});
