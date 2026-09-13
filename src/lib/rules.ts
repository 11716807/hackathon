import { getSlot, requireAlbum } from "./catalog";
import { primaryExtractedSku, skuMatchesWorkOrder } from "./sku";
import type {
  Finding,
  SlotExtraction,
  SlotId,
  VisualFlag,
} from "./types";

const LOW_CONFIDENCE = 0.42;

export interface RuleInput {
  albumId: string;
  workOrderSku: string;
  capturedSlotIds: SlotId[];
  extractions: SlotExtraction[];
}

function has(flags: VisualFlag[], flag: VisualFlag): boolean {
  return flags.includes(flag);
}

function baseFinding(
  albumId: string,
  slotId: SlotId,
  extraction?: SlotExtraction,
): Pick<Finding, "slotId" | "sopCite" | "extractedText" | "confidence"> {
  const album = requireAlbum(albumId);
  return {
    slotId,
    sopCite: getSlot(album, slotId).sopLine,
    extractedText: extraction?.extractedText || undefined,
    confidence: extraction?.confidence ?? 0,
  };
}

export function applyRiskRules(input: RuleInput): Finding[] {
  const album = requireAlbum(input.albumId);
  const bySlot = new Map(
    input.extractions.map((item) => [item.slotId, item]),
  );
  const findings: Finding[] = [];

  for (const slot of album.slots) {
    const captured = input.capturedSlotIds.includes(slot.id);
    const extraction = bySlot.get(slot.id);

    if (!captured) {
      findings.push({
        ...baseFinding(input.albumId, slot.id),
        severity: "retake",
        code: "slot_missing",
        title: `${slot.titleEn} is missing`,
        detail: "This slot was not captured. The gate cannot be cleared.",
        confidence: 0,
      });
      continue;
    }

    if (
      !extraction ||
      has(extraction.flags, "unreadable") ||
      extraction.confidence < LOW_CONFIDENCE
    ) {
      findings.push({
        ...baseFinding(input.albumId, slot.id, extraction),
        severity: "retake",
        code: "slot_retake",
        title: `Retake ${slot.titleEn.toLowerCase()}`,
        detail:
          "The photo is too unclear to judge. Same angle as the golden, more light, fill the frame.",
      });
      continue;
    }

    if (slot.id === "label") {
      const matches = skuMatchesWorkOrder(
        input.workOrderSku,
        extraction.extractedText,
      );
      if (!extraction.extractedText.trim()) {
        findings.push({
          ...baseFinding(input.albumId, slot.id, extraction),
          severity: "must_fix",
          code: "label_unreadable",
          title: "Label SKU could not be read",
          detail:
            "No printed SKU was recovered. Fill the frame with the code and retake.",
        });
        continue;
      }
      if (!matches) {
        const seen = primaryExtractedSku(extraction.extractedText);
        findings.push({
          ...baseFinding(input.albumId, slot.id, extraction),
          severity: "must_fix",
          code: "label_mismatch",
          title: "Label does not match the work order",
          detail: seen
            ? `Read ${seen}. Work order is ${input.workOrderSku}.`
            : `Read “${extraction.extractedText}”. Work order is ${input.workOrderSku}.`,
        });
        continue;
      }
    }

    if (slot.id === "guard" && has(extraction.flags, "guard_open")) {
      findings.push({
        ...baseFinding(input.albumId, slot.id, extraction),
        severity: "must_fix",
        code: "guard_open",
        title: "Guard is open",
        detail:
          "Interlock is not in the safe position. Close the guard before start.",
      });
      continue;
    }

    if (slot.id === "jig" && has(extraction.flags, "jig_misaligned")) {
      findings.push({
        ...baseFinding(input.albumId, slot.id, extraction),
        severity: "must_fix",
        code: "jig_misaligned",
        title: "Part is not seated",
        detail: "Nest / fixture does not match the golden seating.",
      });
      continue;
    }

    if (
      slot.id === "first_piece" &&
      has(extraction.flags, "first_piece_defect")
    ) {
      findings.push({
        ...baseFinding(input.albumId, slot.id, extraction),
        severity: "must_fix",
        code: "first_piece_defect",
        title: "First piece has a visible defect",
        detail:
          extraction.visualSummary ||
          "Do not release the line until the first piece is replaced.",
      });
      continue;
    }

    if (
      slot.id === "hopper" &&
      has(extraction.flags, "hopper_wrong_material")
    ) {
      findings.push({
        ...baseFinding(input.albumId, slot.id, extraction),
        severity: "must_fix",
        code: "hopper_wrong_material",
        title: "Wrong material staged",
        detail:
          extraction.visualSummary ||
          "Hopper / bin does not match the work order kit.",
      });
      continue;
    }

    if (slot.id === "hopper" && has(extraction.flags, "hopper_messy")) {
      findings.push({
        ...baseFinding(input.albumId, slot.id, extraction),
        severity: "warn",
        code: "hopper_messy",
        title: "Staging is messy",
        detail: "Not a start-block. Clean if it hides the next SKU.",
      });
      continue;
    }

    findings.push({
      ...baseFinding(input.albumId, slot.id, extraction),
      severity: "ok",
      code: "slot_ok",
      title: `${slot.titleEn} matches`,
      detail: extraction.visualSummary || "No blocking difference vs golden.",
    });
  }

  return findings;
}
