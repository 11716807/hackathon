import { NextResponse } from "next/server";
import {
  deleteGoldenAlbum,
  firestoreEnabled,
  getGoldenAlbum,
  listGoldenAlbums,
  upsertGoldenAlbum,
  type StoredGoldenAlbum,
  type StoredGoldenFrame,
} from "@/lib/firestore";
import {
  deletePrefix,
  goldenObjectPath,
  parseDataUrl,
  storageEnabled,
  uploadBuffer,
} from "@/lib/storage";
import type { SlotId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!firestoreEnabled()) {
    return NextResponse.json(
      { error: "Firestore not configured", albums: [] },
      { status: 503 },
    );
  }
  try {
    const albumId = new URL(request.url).searchParams.get("albumId");
    if (albumId) {
      const album = await getGoldenAlbum(albumId);
      return NextResponse.json({ album });
    }
    const albums = await listGoldenAlbums();
    return NextResponse.json({ albums });
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return NextResponse.json({ error: message, albums: [] }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!firestoreEnabled() || !storageEnabled()) {
    return NextResponse.json(
      { error: "Storage/Firestore not configured" },
      { status: 503 },
    );
  }
  try {
    const body = (await request.json()) as {
      albumId?: string;
      photos?: Partial<Record<SlotId, string>>;
    };
    if (!body.albumId || !body.photos) {
      return NextResponse.json(
        { error: "Expected albumId and photos" },
        { status: 400 },
      );
    }

    const frames: Partial<Record<SlotId, StoredGoldenFrame>> = {};
    const updatedAt = new Date().toISOString();

    for (const [slotId, dataUrl] of Object.entries(body.photos)) {
      if (!dataUrl) continue;
      if (dataUrl.startsWith("/api/media?") || dataUrl.startsWith("https://")) {
        const existing = await getGoldenAlbum(body.albumId);
        const prior = existing?.frames?.[slotId];
        if (prior) {
          frames[slotId] = prior;
          continue;
        }
      }
      if (!dataUrl.startsWith("data:")) {
        continue;
      }
      if (dataUrl.length > 2_800_000) {
        return NextResponse.json(
          { error: `Photo ${slotId} is too large` },
          { status: 413 },
        );
      }
      const { buffer, contentType, ext } = parseDataUrl(dataUrl);
      const objectPath = goldenObjectPath(body.albumId, slotId, ext);
      const uploaded = await uploadBuffer({
        objectPath,
        buffer,
        contentType,
      });
      frames[slotId] = {
        path: uploaded.path,
        url: uploaded.url,
        updatedAt,
      };
    }

    const album: StoredGoldenAlbum = {
      albumId: body.albumId,
      frames,
      updatedAt,
    };
    await upsertGoldenAlbum(album);
    return NextResponse.json({ ok: true, album });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
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
    const albumId = new URL(request.url).searchParams.get("albumId");
    if (!albumId) {
      return NextResponse.json({ error: "albumId required" }, { status: 400 });
    }
    await deleteGoldenAlbum(albumId);
    if (storageEnabled()) {
      await deletePrefix(`goldens/${albumId}/`);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
