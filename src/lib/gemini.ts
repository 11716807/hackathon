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

export function normalizeExtractions(payload: unknown): SlotExtraction[] {
  const record = payload as { slots?: unknown };
  if (!Array.isArray(record.slots)) {
    throw new Error("Model JSON missing slots[]");
  }
  return record.slots
    .map((item) => {
      const row = item as Record<string, unknown>;
      const slotId = row.slotId as SlotId;
      if (!SLOT_ORDER.includes(slotId)) return null;
      const confidence = Number(row.confidence);
      return {
        slotId,
        extractedText: String(row.extractedText ?? ""),
        flags: asFlags(row.flags),
        visualSummary: String(row.visualSummary ?? ""),
        confidence: Number.isFinite(confidence)
          ? Math.min(1, Math.max(0, confidence))
          : 0,
      } satisfies SlotExtraction;
    })
    .filter((item): item is SlotExtraction => item !== null);
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
    generationConfig: { temperature: 0.1 },
  });

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
    [
      {
        text: `You inspect a factory changeover. Compare each TODAY photo to its GOLDEN photo.
Work order SKU: ${input.workOrderSku}
Line: ${album.lineName}
Industry: ${album.industry}

For the LABEL slot, transcribe every printed code you can read (OCR). Do not guess a SKU that is not visible.
Only use these flags: ${ALLOWED_FLAGS.join(", ")}.
Return ONLY JSON:
{"slots":[{"slotId":"jig|label|guard|hopper|first_piece","extractedText":"","flags":[],"visualSummary":"one sentence","confidence":0.0}]}

Rules:
- guard_open if any safety flap/cover/strap is clearly not in the safe/closed position.
- label extractedText should include the printed SKU if readable.
- first_piece_defect only if a defect is visible.
- unreadable if blur, glare, or the subject is not in frame.
- hopper_wrong_material only if the staged material/kit clearly differs.
- hopper_messy for clutter without a wrong SKU.`,
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
