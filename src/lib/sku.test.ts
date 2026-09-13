import { describe, expect, it } from "vitest";
import {
  extractSkuTokens,
  primaryExtractedSku,
  skuMatchesWorkOrder,
} from "./sku";

describe("sku matching", () => {
  it("matches A-17 in noisy OCR text", () => {
    expect(skuMatchesWorkOrder("A-17", "ROLL A-17 BLUE 500ml")).toBe(true);
  });

  it("matches A17 without hyphen", () => {
    expect(skuMatchesWorkOrder("A-17", "A17 BLUE")).toBe(true);
  });

  it("rejects a different SKU", () => {
    expect(skuMatchesWorkOrder("A-17", "A-22 GREEN 500ml")).toBe(false);
  });

  it("rejects empty OCR", () => {
    expect(skuMatchesWorkOrder("A-17", "   ")).toBe(false);
  });

  it("matches electronics traveler codes", () => {
    expect(skuMatchesWorkOrder("BRD-440", "TRAVELER BRD-440 REV C")).toBe(true);
    expect(skuMatchesWorkOrder("BRD-440", "BRD-118 MIXED LOT")).toBe(false);
  });

  it("extracts the printed token for the HOLD copy", () => {
    expect(primaryExtractedSku("A-22 GREEN 500ml")).toBe("A-22");
    expect(extractSkuTokens("kit brd-440")).toContain("BRD-440");
  });
});
