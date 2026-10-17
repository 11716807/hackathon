import { NextResponse } from "next/server";
import {
  deleteLine,
  firestoreEnabled,
  listLines,
  upsertLine,
  upsertLines,
} from "@/lib/firestore";
import type { StoredLine } from "@/lib/lines";

export const runtime = "nodejs";

export async function GET() {
  if (!firestoreEnabled()) {
    return NextResponse.json(
      { error: "Firestore not configured", lines: [] },
      { status: 503 },
    );
  }
  try {
    const lines = await listLines();
    return NextResponse.json({ lines });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message, lines: [] }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!firestoreEnabled()) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 503 },
    );
  }
  try {
    const body = (await request.json()) as {
      line?: StoredLine;
      lines?: StoredLine[];
    };
    if (body.lines) {
      await upsertLines(body.lines);
      return NextResponse.json({ ok: true, count: body.lines.length });
    }
    if (body.line?.id) {
      await upsertLine(body.line);
      return NextResponse.json({ ok: true, id: body.line.id });
    }
    return NextResponse.json({ error: "Expected line or lines" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upsert failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!firestoreEnabled()) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 503 },
    );
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Expected id" }, { status: 400 });
    }
    await deleteLine(id);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
