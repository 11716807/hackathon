import { NextResponse } from "next/server";
import { downloadObject, storageEnabled } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!storageEnabled()) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 503 },
    );
  }
  const path = new URL(request.url).searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }
  try {
    const { buffer, contentType } = await downloadObject(path);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
