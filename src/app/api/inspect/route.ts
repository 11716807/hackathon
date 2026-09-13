import { NextResponse } from "next/server";
import { getAlbum } from "@/lib/catalog";
import { runInspection, type InspectRequest } from "@/lib/inspection";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: InspectRequest;
  try {
    body = (await request.json()) as InspectRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.albumId || !getAlbum(body.albumId)) {
    return NextResponse.json({ error: "Unknown album" }, { status: 400 });
  }

  if (!Array.isArray(body.captures) || body.captures.length === 0) {
    return NextResponse.json({ error: "No captures" }, { status: 400 });
  }

  const oversized = body.captures.some(
    (capture) => (capture.dataUrl?.length ?? 0) > 2_800_000,
  );
  if (oversized) {
    return NextResponse.json(
      { error: "A photo is too large. Snap again closer to the subject." },
      { status: 413 },
    );
  }

  try {
    const result = await runInspection(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inspect failed";
    const status = message.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
