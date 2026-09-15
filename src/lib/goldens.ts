import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { goldenPath, requireAlbum } from "./catalog";
import type { SlotId } from "./types";

export async function svgBufferToPngDataUrl(svg: Buffer): Promise<string> {
  const png = await sharp(svg, { density: 160 }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function loadGoldenDataUrl(
  albumId: string,
  slotId: SlotId,
): Promise<string | null> {
  const album = requireAlbum(albumId);
  if (!album.goldenDir) return null;
  const relative = goldenPath(album, slotId).replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relative);
  try {
    const bytes = await readFile(filePath);
    if (filePath.endsWith(".svg")) {
      return svgBufferToPngDataUrl(bytes);
    }
    const mime = filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")
      ? "image/jpeg"
      : "image/png";
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
