import { describe, expect, it } from "vitest";
import { runInspection } from "./inspection";

const tiny =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function captures() {
  return (["jig", "label", "guard", "hopper", "first_piece"] as const).map(
    (slotId) => ({ slotId, dataUrl: tiny }),
  );
}

describe("runInspection practice path", () => {
  it("first practice pass HOLDs on label + guard and still warns hopper", async () => {
    const result = await runInspection({
      albumId: "line3-a17",
      mode: "practice",
      practiceScript: "hold_label_and_guard",
      captures: captures(),
    });
    expect(result.decision).toBe("HOLD");
    expect(result.engine).toBe("practice");
    expect(result.findings.map((item) => item.code)).toEqual(
      expect.arrayContaining(["label_mismatch", "guard_open", "hopper_messy"]),
    );
    expect(result.impact.holdCostInr).toBeGreaterThan(0);
    expect(result.impact.escapeCostInr).toBeGreaterThan(result.impact.holdCostInr);
    expect(result.toolTrace.some((step) => step.includes("risk table"))).toBe(
      true,
    );
  });

  it("second practice pass CLEARs and keeps rupee math", async () => {
    const result = await runInspection({
      albumId: "line3-a17",
      mode: "practice",
      practiceScript: "clear_all",
      captures: captures(),
    });
    expect(result.decision).toBe("CLEAR");
    expect(result.findings.every((item) => item.severity !== "must_fix")).toBe(
      true,
    );
  });

  it("rejects an unknown album", async () => {
    await expect(
      runInspection({
        albumId: "nope",
        mode: "practice",
        captures: captures(),
      }),
    ).rejects.toThrow(/Unknown album/);
  });
});
