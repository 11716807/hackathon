import type { SlotId } from "./types";

const TAUGHT_KEY = "gf-taught-goldens";

export type TaughtAlbum = Partial<Record<SlotId, string>>;
export type TaughtStore = Record<string, TaughtAlbum>;

export function readTaughtStore(): TaughtStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TAUGHT_KEY);
    return raw ? (JSON.parse(raw) as TaughtStore) : {};
  } catch {
    return {};
  }
}

export function writeTaughtStore(store: TaughtStore) {
  window.localStorage.setItem(TAUGHT_KEY, JSON.stringify(store));
}

export function albumIsTaught(
  album: TaughtAlbum | undefined,
  slotIds: SlotId[],
): boolean {
  return Boolean(album && slotIds.every((id) => album[id]));
}

export function pickGolden(
  clientGolden?: string,
  diskGolden?: string | null,
): string | undefined {
  if (clientGolden && !clientGolden.startsWith("data:image/svg")) {
    return clientGolden;
  }
  return diskGolden ?? undefined;
}
