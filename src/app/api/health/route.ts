import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "golden-frame",
    gemini: Boolean(process.env.GEMINI_API_KEY),
  });
}
