import { readFile } from "node:fs/promises";
import path from "node:path";
import { goldenPath, requireAlbum } from "./catalog";
import type { SlotId } from "./types";

export async function loadGoldenDataUrl(
  albumId: string,
  slotId: SlotId,
): Promise<string | null> {
  const album = requireAlbum(albumId);
  const relative = goldenPath(album, slotId).replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relative);
  try {
    const bytes = await readFile(filePath);
    const mime = filePath.endsWith(".svg") ? "image/svg+xml" : "image/png";
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
