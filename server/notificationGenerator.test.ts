import { describe, it, expect } from "vitest";
import {
  generateMatchingNotificationData,
  generateNotificationHTML,
  generateNotificationText,
} from "./notificationGenerator";

describe("Notification Generator", () => {
  it("should generate notification data with real values", () => {
    const data = generateMatchingNotificationData();

    expect(data).toBeDefined();
    expect(data.matchedItems).toBeDefined();
    expect(data.matchedItems.length).toBeGreaterThan(0);
    expect(data.totalSavings).toBeGreaterThan(0);
    expect(data.totalMatches).toBeGreaterThan(0);
  });

  it("should have valid matched items", () => {
    const data = generateMatchingNotificationData();

    for (const item of data.matchedItems) {
      expect(item.receiptItemName).toBeTruthy();
      expect(item.receiptPrice).toBeGreaterThan(0);
      expect(item.flyerPrice).toBeGreaterThan(0);
      expect(item.savingsAmount).toBeGreaterThan(0);
      expect(item.savingsPercentage).toBeGreaterThan(0);
      expect(item.storeName).toBeTruthy();
      expect(item.category).toBeTruthy();
    }
  });

  it("should have excluded categories", () => {
    const data = generateMatchingNotificationData();

    expect(data.excludedCategories).toBeDefined();
    expect(data.excludedCategories.length).toBeGreaterThan(0);
    expect(data.excludedCategories).toContain("乳製品");
  });

  it("should generate valid HTML content", () => {
    const data = generateMatchingNotificationData();
    const html = generateNotificationHTML(data);

    expect(html).toBeTruthy();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("スマートマッチング分析結果");
    expect(html).toContain(data.matchedItems[0].receiptItemName);
    expect(html).toContain(`¥${data.totalSavings.toLocaleString()}`);
  });

  it("should include matched items in HTML", () => {
    const data = generateMatchingNotificationData();
    const html = generateNotificationHTML(data);

    for (const item of data.matchedItems) {
      expect(html).toContain(item.receiptItemName);
      expect(html).toContain(item.storeName);
    }
  });

  it("should include excluded categories in HTML", () => {
    const data = generateMatchingNotificationData();
    const html = generateNotificationHTML(data);

    for (const category of data.excludedCategories) {
      expect(html).toContain(category);
    }
  });

  it("should generate valid text content", () => {
    const data = generateMatchingNotificationData();
    const text = generateNotificationText(data);

    expect(text).toBeTruthy();
    expect(text).toContain("スマートマッチング分析結果");
    expect(text).toContain("合計節約額");
    expect(text).toContain(`¥${data.totalSavings.toLocaleString()}`);
  });

  it("should include matched items in text", () => {
    const data = generateMatchingNotificationData();
    const text = generateNotificationText(data);

    for (const item of data.matchedItems) {
      expect(text).toContain(item.receiptItemName);
      expect(text).toContain(item.storeName);
    }
  });

  it("should include excluded categories in text", () => {
    const data = generateMatchingNotificationData();
    const text = generateNotificationText(data);

    expect(text).toContain("分析から除外されたカテゴリー");
    for (const category of data.excludedCategories) {
      expect(text).toContain(category);
    }
  });

  it("should have consistent data between HTML and text", () => {
    const data = generateMatchingNotificationData();
    const html = generateNotificationHTML(data);
    const text = generateNotificationText(data);

    expect(html).toContain(data.matchedItems[0].receiptItemName);
    expect(text).toContain(data.matchedItems[0].receiptItemName);
    expect(html).toContain(`¥${data.totalSavings.toLocaleString()}`);
    expect(text).toContain(`¥${data.totalSavings.toLocaleString()}`);
  });

  it("should generate timestamp in notification data", () => {
    const data = generateMatchingNotificationData();

    expect(data.generatedAt).toBeTruthy();
    expect(new Date(data.generatedAt)).toBeInstanceOf(Date);
  });
});
