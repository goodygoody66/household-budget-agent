import { describe, it, expect, beforeAll } from "vitest";
import { sendLINENotification } from "./line";

describe("LINE Messaging API", () => {
  it("should validate LINE_CHANNEL_ACCESS_TOKEN is set", () => {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token).not.toBe("");
    expect(token?.length).toBeGreaterThan(0);
  });

  it("should validate LINE_CHANNEL_SECRET is set", () => {
    const secret = process.env.LINE_CHANNEL_SECRET;
    expect(secret).toBeDefined();
    expect(secret).not.toBe("");
    expect(secret?.length).toBeGreaterThan(0);
  });

  it("should have correct token format", () => {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    // LINE Channel Access Tokenは通常、英数字とハイフンで構成されている
    expect(token).toMatch(/^[A-Za-z0-9\-]+$/);
  });

  it("should have correct secret format", () => {
    const secret = process.env.LINE_CHANNEL_SECRET;
    // LINE Channel Secretは通常、英数字で構成されている
    expect(secret).toMatch(/^[A-Za-z0-9]+$/);
  });

  // 注：実際のLINE APIテストはテストユーザーIDが必要なため、ここではスキップ
  // 本番環境ではWebhook経由でテストすることを推奨
});
