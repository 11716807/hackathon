import { NextResponse } from "next/server";
import { appendAudit, firestoreEnabled, listAudit } from "@/lib/firestore";
import type { AuditEntry } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  if (!firestoreEnabled()) {
    return NextResponse.json(
      { error: "Firestore not configured", audit: [] },
      { status: 503 },
    );
  }
  try {
    const audit = await listAudit();
    return NextResponse.json({ audit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message, audit: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!firestoreEnabled()) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 503 },
    );
  }
  try {
    const body = (await request.json()) as { entry?: AuditEntry };
    if (!body.entry?.id || !body.entry.at) {
      return NextResponse.json({ error: "Invalid audit entry" }, { status: 400 });
    }
    await appendAudit(body.entry);
    return NextResponse.json({ ok: true, id: body.entry.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Append failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
