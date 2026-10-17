import { describe, expect, it } from "vitest";
import { applyRiskRules } from "./rules";
import type { SlotExtraction } from "./types";

const ok: Omit<SlotExtraction, "slotId"> = {
  extractedText: "",
  flags: [],
  visualSummary: "ok",
  confidence: 0.9,
};

function pack(overrides: Partial<Record<SlotExtraction["slotId"], SlotExtraction>>) {
  const base: SlotExtraction[] = [
    { slotId: "jig", ...ok, flags: ["jig_aligned"] },
    {
      slotId: "label",
      extractedText: "A-17 BLUE",
      flags: ["label_present"],
      visualSummary: "ok",
      confidence: 0.92,
    },
    { slotId: "guard", ...ok, flags: ["guard_closed"] },
    { slotId: "hopper", ...ok, flags: ["hopper_ok"] },
    { slotId: "first_piece", ...ok, flags: ["first_piece_ok"] },
  ];
  return base.map((item) => overrides[item.slotId] ?? item);
}

describe("applyRiskRules", () => {
  it("holds when OCR disagrees with the work order even if the photo looks fine", () => {
    const findings = applyRiskRules({
      albumId: "line3-a17",
      workOrderSku: "A-17",
      capturedSlotIds: ["jig", "label", "guard", "hopper", "first_piece"],
      extractions: pack({
        label: {
          slotId: "label",
          extractedText: "A-22 GREEN 500ml",
          flags: ["label_present"],
          visualSummary: "Looks like a clean label",
          confidence: 0.94,
        },
      }),
    });
    const label = findings.find((item) => item.slotId === "label");
    expect(label?.code).toBe("label_mismatch");
    expect(label?.severity).toBe("must_fix");
    expect(label?.detail).toContain("A-22");
  });

  it("holds on an open guard", () => {
    const findings = applyRiskRules({
      albumId: "line3-a17",
      workOrderSku: "A-17",
      capturedSlotIds: ["jig", "label", "guard", "hopper", "first_piece"],
      extractions: pack({
        guard: {
          slotId: "guard",
          extractedText: "",
          flags: ["guard_open"],
          visualSummary: "flap up",
          confidence: 0.88,
        },
      }),
    });
    expect(findings.find((item) => item.slotId === "guard")?.code).toBe(
      "guard_open",
    );
  });

  it("warns on a messy hopper without blocking", () => {
    const findings = applyRiskRules({
      albumId: "line3-a17",
      workOrderSku: "A-17",
      capturedSlotIds: ["jig", "label", "guard", "hopper", "first_piece"],
      extractions: pack({
        hopper: {
          slotId: "hopper",
          extractedText: "",
          flags: ["hopper_messy"],
          visualSummary: "clutter",
          confidence: 0.8,
        },
      }),
    });
    expect(findings.find((item) => item.slotId === "hopper")?.severity).toBe(
      "warn",
    );
  });

  it("does not retake a clear photo just because confidence is missing", () => {
    const findings = applyRiskRules({
      albumId: "line3-a17",
      workOrderSku: "A-17",
      capturedSlotIds: ["jig", "label", "guard", "hopper", "first_piece"],
      extractions: [
        {
          slotId: "jig",
          extractedText: "",
          flags: ["jig_aligned"],
          visualSummary: "bottle seated in nest",
          confidence: 0,
        },
        {
          slotId: "label",
          extractedText: "A-17",
          flags: ["label_present"],
          visualSummary: "label roll",
          confidence: 0,
        },
        {
          slotId: "guard",
          extractedText: "",
          flags: ["guard_closed"],
          visualSummary: "guard closed",
          confidence: 0,
        },
        {
          slotId: "hopper",
          extractedText: "",
          flags: ["hopper_ok"],
          visualSummary: "correct resin",
          confidence: 0,
        },
        {
          slotId: "first_piece",
          extractedText: "",
          flags: ["first_piece_ok"],
          visualSummary: "charging",
          confidence: 0,
        },
      ],
    });
    expect(findings.every((item) => item.severity !== "retake")).toBe(true);
  });

  it("asks for a retake when confidence is low", () => {
    const findings = applyRiskRules({
      albumId: "line3-a17",
      workOrderSku: "A-17",
      capturedSlotIds: ["jig", "label", "guard", "hopper", "first_piece"],
      extractions: pack({
        jig: {
          slotId: "jig",
          extractedText: "",
          flags: ["unreadable"],
          visualSummary: "blur",
          confidence: 0.2,
        },
      }),
    });
    expect(findings.find((item) => item.slotId === "jig")?.severity).toBe(
      "retake",
    );
  });

  it("marks missing slots so the gate cannot be cleared", () => {
    const findings = applyRiskRules({
      albumId: "line3-a17",
      workOrderSku: "A-17",
      capturedSlotIds: ["label"],
      extractions: [
        {
          slotId: "label",
          extractedText: "A-17 BLUE",
          flags: ["label_present"],
          visualSummary: "ok",
          confidence: 0.9,
        },
      ],
    });
    expect(findings.filter((item) => item.code === "slot_missing")).toHaveLength(
      4,
    );
  });

  it("holds a wrong electronics traveler", () => {
    const findings = applyRiskRules({
      albumId: "cell2-brd440",
      workOrderSku: "BRD-440",
      capturedSlotIds: ["jig", "label", "guard", "hopper", "first_piece"],
      extractions: [
        { slotId: "jig", ...ok, flags: ["jig_aligned"] },
        {
          slotId: "label",
          extractedText: "BRD-118",
          flags: ["label_present"],
          visualSummary: "ok",
          confidence: 0.9,
        },
        { slotId: "guard", ...ok, flags: ["guard_closed"] },
        { slotId: "hopper", ...ok, flags: ["hopper_ok"] },
        { slotId: "first_piece", ...ok, flags: ["first_piece_ok"] },
      ],
    });
    expect(findings.find((item) => item.slotId === "label")?.code).toBe(
      "label_mismatch",
    );
  });
});
