import { ALBUMS, EMPTY_FRAME } from "./catalog";
import type { Album, SlotSpec } from "./types";

const LINES_KEY = "gf-custom-lines";

export interface StoredLine {
  id: string;
  lineName: string;
  sku: string;
  skuName: string;
  industry: Album["industry"];
  templateId?: string;
  slots: SlotSpec[];
  holdMinutes: number;
  hourlyOverheadInr: number;
  unitMarginInr: number;
  scrapUnitsIfEscape: number;
  recallReserveInr: number;
}

function templateOf(id?: string): Album {
  return ALBUMS.find((album) => album.id === id) ?? ALBUMS[1] ?? ALBUMS[0];
}

export function storedToAlbum(line: StoredLine): Album {
  const template = templateOf(line.templateId);
  return {
    id: line.id,
    industry: line.industry,
    plantName: template.plantName,
    lineName: line.lineName,
    sku: line.sku,
    skuName: line.skuName,
    workOrder: `WO-${line.sku}`,
    goldenDir: ALBUMS.some((album) => album.id === line.id)
      ? template.goldenDir
      : "",
    hourlyOverheadInr: line.hourlyOverheadInr,
    unitMarginInr: line.unitMarginInr,
    scrapUnitsIfEscape: line.scrapUnitsIfEscape,
    recallReserveInr: line.recallReserveInr,
    holdMinutes: line.holdMinutes,
    slots: line.slots,
  };
}

export function albumToStored(album: Album, templateId?: string): StoredLine {
  return {
    id: album.id,
    lineName: album.lineName,
    sku: album.sku,
    skuName: album.skuName,
    industry: album.industry,
    templateId,
    slots: album.slots,
    holdMinutes: album.holdMinutes,
    hourlyOverheadInr: album.hourlyOverheadInr,
    unitMarginInr: album.unitMarginInr,
    scrapUnitsIfEscape: album.scrapUnitsIfEscape,
    recallReserveInr: album.recallReserveInr,
  };
}

export function readStoredLines(): StoredLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LINES_KEY);
    return raw ? (JSON.parse(raw) as StoredLine[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredLines(lines: StoredLine[]) {
  window.localStorage.setItem(LINES_KEY, JSON.stringify(lines));
}

/** Retired demo kits — ignore if still present in local/Firestore. */
const RETIRED_LINE_IDS = new Set(["desk-charge"]);

export function resolveAlbums(stored: StoredLine[]): Album[] {
  const active = stored.filter((line) => !RETIRED_LINE_IDS.has(line.id));
  const byId = new Map(active.map((line) => [line.id, line]));
  const catalog = ALBUMS.map((album) => {
    const over = byId.get(album.id);
    return over ? storedToAlbum({ ...over, templateId: album.id }) : album;
  });
  const extras = active
    .filter((line) => !ALBUMS.some((album) => album.id === line.id))
    .map(storedToAlbum);
  return [...catalog, ...extras];
}

/** True when the line was user-created (not a built-in catalog kit). */
export function isCustomLineId(id: string): boolean {
  return !ALBUMS.some((album) => album.id === id);
}

export function newSlot(label: string): SlotSpec {
  const id = `slot-${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    titleEn: label,
    titleHi: label,
    hintEn: "Same angle as the golden. Fill the frame.",
    hintHi: "गोल्डन जैसा कोण। फ्रेम भरें।",
    sopLine: `Compare ${label} to the last good run.`,
  };
}

export function cloneLine(input: {
  name: string;
  sku: string;
  templateId?: string;
}): StoredLine {
  const template = templateOf(input.templateId);
  const copySlots = Boolean(input.templateId);
  return {
    id: `line-${crypto.randomUUID().slice(0, 8)}`,
    lineName: input.name.trim() || "New line",
    sku: input.sku.trim() || template.sku,
    skuName: input.name.trim() || template.skuName,
    industry: input.templateId ? template.industry : "custom",
    templateId: input.templateId,
    slots: copySlots
      ? template.slots.map((slot) => ({ ...slot }))
      : [newSlot("Frame 1")],
    holdMinutes: template.holdMinutes,
    hourlyOverheadInr: template.hourlyOverheadInr,
    unitMarginInr: template.unitMarginInr,
    scrapUnitsIfEscape: template.scrapUnitsIfEscape,
    recallReserveInr: template.recallReserveInr,
  };
}

export { EMPTY_FRAME };
