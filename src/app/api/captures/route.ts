import { NextResponse } from "next/server";
import {
  captureObjectPath,
  parseDataUrl,
  storageEnabled,
  uploadBuffer,
} from "@/lib/storage";
import type { SlotId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!storageEnabled()) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 },
    );
  }
  try {
    const body = (await request.json()) as {
      albumId?: string;
      batchId?: string;
      captures?: { slotId: SlotId; dataUrl: string }[];
    };
    if (!body.albumId || !Array.isArray(body.captures) || body.captures.length === 0) {
      return NextResponse.json(
        { error: "Expected albumId and captures" },
        { status: 400 },
      );
    }
    const batchId = body.batchId || crypto.randomUUID().slice(0, 8);
    const uploaded: { slotId: SlotId; path: string; url: string }[] = [];

    for (const capture of body.captures) {
      if (!capture.dataUrl?.startsWith("data:")) continue;
      if (capture.dataUrl.length > 2_800_000) {
        return NextResponse.json(
          { error: `Photo ${capture.slotId} is too large` },
          { status: 413 },
        );
      }
      const { buffer, contentType, ext } = parseDataUrl(capture.dataUrl);
      const objectPath = captureObjectPath(
        body.albumId,
        batchId,
        capture.slotId,
        ext,
      );
      const result = await uploadBuffer({
        objectPath,
        buffer,
        contentType,
      });
      uploaded.push({
        slotId: capture.slotId,
        path: result.path,
        url: result.url,
      });
    }

    return NextResponse.json({ ok: true, batchId, uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
