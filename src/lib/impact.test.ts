import { describe, expect, it } from "vitest";
import { estimateImpact, formatInr } from "./impact";

describe("impact", () => {
  it("prices an 8 minute hold from hourly overhead", () => {
    const impact = estimateImpact("line3-a17");
    expect(impact.holdMinutes).toBe(8);
    expect(impact.holdCostInr).toBe(Math.round((8 / 60) * 25000));
    expect(impact.escapeCostInr).toBe(200 * 18 + 180000);
  });

  it("formats INR for the gate card", () => {
    expect(formatInr(3333)).toMatch(/₹/);
  });
});
