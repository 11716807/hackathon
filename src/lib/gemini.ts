import { GoogleGenerativeAI } from "@google/generative-ai";
import { SLOT_ORDER, requireAlbum } from "./catalog";
import type { SlotExtraction, SlotId, VisualFlag } from "./types";

const ALLOWED_FLAGS: VisualFlag[] = [
  "guard_open",
  "guard_closed",
  "label_present",
  "jig_misaligned",
  "jig_aligned",
  "first_piece_defect",
  "first_piece_ok",
  "hopper_wrong_material",
  "hopper_ok",
  "hopper_messy",
  "unreadable",
];

const GEMINI_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Capture must be a base64 data URL");
  }
  return { mimeType: match[1], data: match[2] };
}

export function isGeminiImageMime(mimeType: string): boolean {
  return GEMINI_IMAGE_MIMES.has(mimeType.toLowerCase());
}

export function toGeminiMime(mimeType: string): string {
  return mimeType.toLowerCase() === "image/jpg" ? "image/jpeg" : mimeType;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(raw.slice(start, end + 1));
}

function asFlags(value: unknown): VisualFlag[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is VisualFlag =>
    ALLOWED_FLAGS.includes(item as VisualFlag),
  );
}

export function resolveSlotId(raw: unknown): SlotId | null {
  const text = String(raw ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  if (SLOT_ORDER.includes(text as SlotId)) return text as SlotId;
  if (/label|sticker|sku|charger|traveler/.test(text)) return "label";
  if (/guard|lid|cover|flap/.test(text)) return "guard";
  if (/hopper|cable|plug|bin/.test(text)) return "hopper";
  if (/first|light|charging|piece|board/.test(text)) return "first_piece";
  if (/jig|laptop|desk|fixture|seat/.test(text)) return "jig";
  return null;
}

export function normalizeConfidence(value: unknown): number {
  if (value == null || value === "") return 0.8;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.8;
  if (n > 1 && n <= 100) return Math.min(1, n / 100);
  return Math.min(1, Math.max(0, n));
}

export function normalizeExtractions(payload: unknown): SlotExtraction[] {
  const record = payload as { slots?: unknown };
  if (!Array.isArray(record.slots)) {
    throw new Error("Model JSON missing slots[]");
  }
  const seen = new Set<SlotId>();
  const rows: SlotExtraction[] = [];
  for (const item of record.slots) {
    const row = item as Record<string, unknown>;
    const slotId = resolveSlotId(row.slotId ?? row.id ?? row.name ?? row.slot);
    if (!slotId || seen.has(slotId)) continue;
    seen.add(slotId);
    rows.push({
      slotId,
      extractedText: String(row.extractedText ?? row.text ?? ""),
      flags: asFlags(row.flags),
      visualSummary: String(row.visualSummary ?? row.summary ?? ""),
      confidence: normalizeConfidence(row.confidence),
    });
  }
  return rows;
}

export async function extractSlotsWithGemini(input: {
  albumId: string;
  workOrderSku: string;
  captures: { slotId: SlotId; dataUrl: string; goldenDataUrl?: string }[];
}): Promise<{ extractions: SlotExtraction[]; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const album = requireAlbum(input.albumId);
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const slotGuide = album.slots
    .map((slot) => `- ${slot.id} = ${slot.titleEn}`)
    .join("\n");

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
    [
      {
        text: `You inspect a simple setup (desk or factory). Judge the TODAY photo.
Work order SKU: ${input.workOrderSku}
Line: ${album.lineName}

Use ONLY these slotId values:
${slotGuide}

For label, transcribe printed text (OCR). Do not invent a SKU.
Only use these flags: ${ALLOWED_FLAGS.join(", ")}.
Return JSON: {"slots":[{"slotId":"jig","extractedText":"","flags":[],"visualSummary":"one sentence","confidence":0.8}]}

Rules:
- slotId must be exactly jig, label, guard, hopper, or first_piece.
- confidence is 0 to 1. If unsure, use 0.75. Never omit the slot.
- Do NOT mark unreadable unless TODAY is actually blurry or empty. A clear phone photo of a laptop, cable, or lid is readable.
- Ignore style differences if GOLDEN is a drawing and TODAY is a real photo. Judge TODAY.
- guard_open only if the lid/cover is clearly open.
- hopper_wrong_material only if the cable is clearly unplugged (desk) or the kit is wrong.
- first_piece_defect only if a defect is obvious.`,
      },
    ];

  for (const capture of input.captures) {
    const today = parseDataUrl(capture.dataUrl);
    if (!isGeminiImageMime(today.mimeType)) {
      throw new Error(
        `Unsupported photo type for ${capture.slotId}: ${today.mimeType}. Use the camera or a JPG/PNG.`,
      );
    }

    const golden = capture.goldenDataUrl
      ? parseDataUrl(capture.goldenDataUrl)
      : null;
    const goldenOk = golden && isGeminiImageMime(golden.mimeType);

    parts.push({
      text: goldenOk
        ? `\nSLOT ${capture.slotId} — GOLDEN (approved PNG) then TODAY (live):`
        : `\nSLOT ${capture.slotId} — TODAY only (judge against work order ${input.workOrderSku} and the slot checklist):`,
    });
    if (golden && goldenOk) {
      parts.push({
        inlineData: {
          mimeType: toGeminiMime(golden.mimeType),
          data: golden.data,
        },
      });
    }
    parts.push({
      inlineData: { mimeType: toGeminiMime(today.mimeType), data: today.data },
    });
  }

  const result = await model.generateContent(parts);
  const text = result.response.text();
  return {
    extractions: normalizeExtractions(extractJson(text)),
    model: modelName,
  };
}
