import { requireAlbum } from "./catalog";
import { decideGate } from "./gate";
import { extractSlotsWithGemini } from "./gemini";
import { loadGoldenDataUrl } from "./goldens";
import { estimateImpact } from "./impact";
import { practiceExtractions, type PracticeScript } from "./practice";
import { applyRiskRules } from "./rules";
import type {
  EngineMode,
  InspectionResult,
  SlotId,
  SlotExtraction,
} from "./types";

export interface InspectRequest {
  albumId: string;
  workOrderSku?: string;
  captures: { slotId: SlotId; dataUrl: string }[];
  mode?: EngineMode;
  practiceScript?: PracticeScript;
}

export async function runInspection(
  request: InspectRequest,
): Promise<InspectionResult> {
  const album = requireAlbum(request.albumId);
  const workOrderSku = request.workOrderSku ?? album.sku;
  const capturedSlotIds = request.captures.map((item) => item.slotId);
  const mode: EngineMode = request.mode ?? "live";
  const toolTrace: string[] = [
    "Loaded album and work order",
    `Captured slots: ${capturedSlotIds.join(", ") || "none"}`,
  ];

  let extractions: SlotExtraction[] = [];
  let engine: InspectionResult["engine"] = "rules";
  let model: string | undefined;

  if (mode === "practice") {
    const script = request.practiceScript ?? "hold_label_and_guard";
    extractions = practiceExtractions(script, workOrderSku, capturedSlotIds);
    engine = "practice";
    toolTrace.push(`Practice script: ${script}`);
    toolTrace.push("Skipped Gemini — practice path uses a fixed extraction");
  } else {
    const captures = await Promise.all(
      request.captures.map(async (capture) => ({
        ...capture,
        goldenDataUrl:
          (await loadGoldenDataUrl(album.id, capture.slotId)) ?? undefined,
      })),
    );
    const { extractions: live, model: usedModel } =
      await extractSlotsWithGemini({
        albumId: album.id,
        workOrderSku,
        captures,
      });
    extractions = live;
    engine = "live";
    model = usedModel;
    toolTrace.push(`Gemini vision + OCR (${usedModel})`);
  }

  toolTrace.push("Applied risk table (rules beat model prose)");
  const findings = applyRiskRules({
    albumId: album.id,
    workOrderSku,
    capturedSlotIds: album.slots.map((slot) => slot.id).filter((id) =>
      capturedSlotIds.includes(id),
    ),
    extractions,
  });

  const { decision, summary } = decideGate(findings);
  toolTrace.push(`Gate: ${decision}`);

  return {
    albumId: album.id,
    workOrderSku,
    engine,
    model,
    findings,
    decision,
    summary,
    toolTrace,
    impact: estimateImpact(album.id),
    decidedAt: new Date().toISOString(),
  };
}
