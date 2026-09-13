import { describe, expect, it } from "vitest";
import { decideGate, mustFixSlotIds } from "./gate";
import type { Finding } from "./types";

function finding(
  partial: Pick<Finding, "slotId" | "severity" | "code" | "title">,
): Finding {
  return {
    detail: "",
    sopCite: "",
    confidence: 1,
    ...partial,
  };
}

describe("decideGate", () => {
  it("HOLDs on any must-fix", () => {
    const findings = [
      finding({
        slotId: "label",
        severity: "must_fix",
        code: "label_mismatch",
        title: "Wrong label",
      }),
      finding({
        slotId: "jig",
        severity: "ok",
        code: "slot_ok",
        title: "Jig matches",
      }),
    ];
    expect(decideGate(findings).decision).toBe("HOLD");
    expect(mustFixSlotIds(findings)).toEqual(["label"]);
  });

  it("CLEARs when only warnings remain", () => {
    const result = decideGate([
      finding({
        slotId: "hopper",
        severity: "warn",
        code: "hopper_messy",
        title: "Messy",
      }),
      finding({
        slotId: "label",
        severity: "ok",
        code: "slot_ok",
        title: "OK",
      }),
    ]);
    expect(result.decision).toBe("CLEAR");
    expect(result.summary).toMatch(/warning/i);
  });

  it("HOLDs for retakes before it talks about must-fix copy", () => {
    const result = decideGate([
      finding({
        slotId: "guard",
        severity: "retake",
        code: "slot_retake",
        title: "Retake guard",
      }),
    ]);
    expect(result.decision).toBe("HOLD");
    expect(result.summary).toMatch(/Retake/i);
  });
});
