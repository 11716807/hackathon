import type { SlotExtraction, SlotId } from "./types";

export type PracticeScript = "hold_label_and_guard" | "clear_all";

const OK: Omit<SlotExtraction, "slotId"> = {
  extractedText: "",
  flags: [],
  visualSummary: "Matches golden seating and state.",
  confidence: 0.93,
};

export function practiceExtractions(
  script: PracticeScript,
  workOrderSku: string,
  slotIds: SlotId[],
): SlotExtraction[] {
  return slotIds.map((slotId) => {
    if (script === "clear_all") {
      if (slotId === "label") {
        return {
          slotId,
          extractedText: `${workOrderSku} APPROVED`,
          flags: ["label_present"],
          visualSummary: "Printed SKU matches the work order.",
          confidence: 0.95,
        };
      }
      if (slotId === "guard") {
        return {
          slotId,
          extractedText: "",
          flags: ["guard_closed"],
          visualSummary: "Guard closed, latch visible.",
          confidence: 0.94,
        };
      }
      if (slotId === "first_piece") {
        return {
          slotId,
          ...OK,
          flags: ["first_piece_ok"],
        };
      }
      if (slotId === "jig") {
        return { slotId, ...OK, flags: ["jig_aligned"] };
      }
      return { slotId, ...OK, flags: ["hopper_ok"] };
    }

    if (slotId === "label") {
      return {
        slotId,
        extractedText: workOrderSku === "BRD-440" ? "BRD-118 MIXED LOT" : "A-22 GREEN 500ml",
        flags: ["label_present"],
        visualSummary: "A different SKU is loaded on the roll / traveler.",
        confidence: 0.91,
      };
    }
    if (slotId === "guard") {
      return {
        slotId,
        extractedText: "",
        flags: ["guard_open"],
        visualSummary: "Guard flap is open.",
        confidence: 0.9,
      };
    }
    if (slotId === "hopper") {
      return {
        slotId,
        ...OK,
        flags: ["hopper_messy"],
        visualSummary: "Staging is cluttered but material looks correct.",
        confidence: 0.8,
      };
    }
    if (slotId === "jig") {
      return { slotId, ...OK, flags: ["jig_aligned"] };
    }
    return {
      slotId,
      ...OK,
      flags: ["first_piece_ok"],
    };
  });
}
