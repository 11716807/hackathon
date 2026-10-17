import { getAlbum, requireAlbum } from "./catalog";
import { documentAiEnabled, ocrLabelText } from "./documentai";
import { decideGate } from "./gate";
import { extractSlotsWithGemini } from "./gemini";
import { loadGoldenDataUrl } from "./goldens";
import { pickGolden } from "./taughtGoldens";
import { estimateImpact } from "./impact";
import { practiceExtractions, type PracticeScript } from "./practice";
import { applyRiskRules } from "./rules";
import { resolveToDataUrl } from "./storage";
import type {
  Album,
  EngineMode,
  InspectionResult,
  SlotId,
  SlotExtraction,
} from "./types";

export interface InspectRequest {
  albumId: string;
  album?: Pick<Album, "id" | "lineName" | "sku" | "slots" | "holdMinutes" | "hourlyOverheadInr" | "unitMarginInr" | "scrapUnitsIfEscape" | "recallReserveInr">;
  workOrderSku?: string;
  captures: { slotId: SlotId; dataUrl: string }[];
  goldens?: { slotId: SlotId; dataUrl: string }[];
  mode?: EngineMode;
  practiceScript?: PracticeScript;
}

export async function runInspection(
  request: InspectRequest,
): Promise<InspectionResult> {
  const catalogAlbum = getAlbum(request.albumId);
  const album = request.album
    ? ({
        industry: "custom",
        plantName: request.album.lineName,
        skuName: request.album.sku,
        workOrder: `WO-${request.album.sku}`,
        goldenDir: catalogAlbum?.goldenDir ?? "",
        ...request.album,
      } as Album)
    : requireAlbum(request.albumId);
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
    toolTrace.push("Skipped live vision — practice path uses a fixed extraction");
  } else {
    const taughtEntries = await Promise.all(
      (request.goldens ?? []).map(async (item) => {
        const dataUrl = await resolveToDataUrl(item.dataUrl);
        return dataUrl ? ([item.slotId, dataUrl] as const) : null;
      }),
    );
    const taught = new Map(
      taughtEntries.filter(Boolean) as [SlotId, string][],
    );
    const usedTaught = taught.size > 0;
    toolTrace.push(
      usedTaught
        ? "Using taught real golden photos (Cloud Storage or upload)"
        : "Judging TODAY photos only (placeholder drawings are not sent)",
    );
    const captures = await Promise.all(
      request.captures.map(async (capture) => {
        const todayDataUrl =
          (await resolveToDataUrl(capture.dataUrl)) ?? capture.dataUrl;
        const diskGolden = getAlbum(album.id)
          ? await loadGoldenDataUrl(album.id, capture.slotId)
          : undefined;
        return {
          ...capture,
          dataUrl: todayDataUrl,
          goldenDataUrl: usedTaught
            ? pickGolden(taught.get(capture.slotId), diskGolden)
            : undefined,
        };
      }),
    );
    const { extractions: live, model: usedModel } =
      await extractSlotsWithGemini({
        albumId: album.id,
        workOrderSku,
        lineName: album.lineName,
        slots: album.slots.map((slot) => ({ id: slot.id, titleEn: slot.titleEn })),
        captures,
      });
    extractions = live;
    engine = "live";
    model = usedModel;
    toolTrace.push("Gemini vision (look-alike + flags)");

    const labelCapture = captures.find((c) => c.slotId === "label");
    if (labelCapture && documentAiEnabled()) {
      try {
        const docText = await ocrLabelText(labelCapture.dataUrl);
        if (docText) {
          extractions = extractions.map((row) =>
            row.slotId === "label"
              ? { ...row, extractedText: docText }
              : row,
          );
          toolTrace.push("Document AI OCR for label SKU (overrides Gemini text)");
        } else {
          toolTrace.push(
            "Document AI returned no text — kept Gemini label OCR",
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Document AI failed";
        toolTrace.push(`Document AI skipped (${message}) — Gemini OCR fallback`);
      }
    } else if (labelCapture) {
      toolTrace.push("Label OCR via Gemini (Document AI not configured)");
    }
  }

  toolTrace.push("Applied risk table (rules beat model prose)");
  const findings = applyRiskRules({
    albumId: album.id,
    album,
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
    impact: estimateImpact(album),
    decidedAt: new Date().toISOString(),
  };
}
