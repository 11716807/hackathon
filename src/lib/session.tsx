"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALBUMS, EMPTY_FRAME, goldenPath } from "./catalog";
import { mustFixSlotIds } from "./gate";
import {
  albumToStored,
  cloneLine,
  readStoredLines,
  resolveAlbums,
  writeStoredLines,
  newSlot,
  type StoredLine,
} from "./lines";
import {
  albumIsTaught,
  readTaughtStore,
  writeTaughtStore,
  type TaughtAlbum,
  type TaughtStore,
} from "./taughtGoldens";
import type {
  Album,
  AuditEntry,
  EngineMode,
  InspectionResult,
  LayoutMode,
  Locale,
  Role,
  SlotCapture,
  SlotId,
  SlotSpec,
} from "./types";

const AUDIT_KEY = "gf-audit";
const PREFS_KEY = "gf-prefs";

interface Prefs {
  role: Role;
  locale: Locale;
  albumId: string;
  mode: EngineMode;
  layoutMode: LayoutMode;
}

interface SessionState {
  role: Role;
  locale: Locale;
  albumId: string;
  mode: EngineMode;
  layoutMode: LayoutMode;
  captures: Partial<Record<SlotId, SlotCapture>>;
  result: InspectionResult | null;
  audit: AuditEntry[];
  notice: string | null;
  albums: Album[];
  album: Album;
  setRole: (role: Role) => void;
  setLocale: (locale: Locale) => void;
  setAlbumId: (id: string) => void;
  setMode: (mode: EngineMode) => void;
  setLayoutMode: (layoutMode: LayoutMode) => void;
  saveCapture: (slotId: SlotId, dataUrl: string) => void;
  clearCapture: (slotId: SlotId) => void;
  resetCaptures: () => void;
  setResult: (result: InspectionResult | null) => void;
  logGate: (entry: Omit<AuditEntry, "id" | "at">) => void;
  slotsToShoot: SlotId[];
  setNotice: (notice: string | null) => void;
  taught: TaughtAlbum;
  hasTaughtAlbum: boolean;
  goldenSrc: (slotId: SlotId) => string;
  saveTaughtAlbum: (photos: TaughtAlbum) => void;
  clearTaughtAlbum: () => void;
  addLine: (input: { name: string; sku: string; templateId?: string }) => void;
  addFrame: (label: string) => SlotSpec;
  removeFrame: (slotId: SlotId) => void;
  renameFrame: (slotId: SlotId, label: string) => void;
}

const SessionContext = createContext<SessionState | null>(null);

function readPrefs(): Prefs {
  const fallback: Prefs = {
    role: "operator",
    locale: "en",
    albumId: ALBUMS[0].id,
    mode: "live",
    layoutMode: "auto",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<Prefs>), mode: "live" };
  } catch {
    return fallback;
  }
}

function readAudit(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>({
    role: "operator",
    locale: "en",
    albumId: ALBUMS[0].id,
    mode: "live",
    layoutMode: "auto",
  });
  const [hydrated, setHydrated] = useState(false);
  const [captures, setCaptures] = useState<Partial<Record<SlotId, SlotCapture>>>(
    {},
  );
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [taughtStore, setTaughtStore] = useState<TaughtStore>({});
  const [storedLines, setStoredLines] = useState<StoredLine[]>([]);

  useEffect(() => {
    setPrefs(readPrefs());
    setAudit(readAudit());
    setTaughtStore(readTaughtStore());
    setStoredLines(readStoredLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
  }, [audit, hydrated]);

  const albums = useMemo(() => resolveAlbums(storedLines), [storedLines]);
  const album =
    albums.find((item) => item.id === prefs.albumId) ?? albums[0] ?? ALBUMS[0];
  const taught = taughtStore[album.id] ?? {};
  const hasTaughtAlbum =
    album.slots.length > 0 &&
    albumIsTaught(
      taught,
      album.slots.map((slot) => slot.id),
    );

  function patchAlbum(updater: (current: Album) => Album) {
    setStoredLines((prev) => {
      const current =
        resolveAlbums(prev).find((item) => item.id === album.id) ?? album;
      const nextAlbum = updater(current);
      const stored = albumToStored(
        nextAlbum,
        ALBUMS.some((item) => item.id === nextAlbum.id)
          ? nextAlbum.id
          : prev.find((line) => line.id === nextAlbum.id)?.templateId,
      );
      const exists = prev.some((line) => line.id === nextAlbum.id);
      const next = exists
        ? prev.map((line) => (line.id === nextAlbum.id ? stored : line))
        : [...prev, stored];
      writeStoredLines(next);
      return next;
    });
  }

  const slotsToShoot = useMemo(() => {
    if (!result) return album.slots.map((slot) => slot.id);
    return mustFixSlotIds(result.findings);
  }, [album.slots, result]);

  const value: SessionState = {
    role: prefs.role,
    locale: prefs.locale,
    albumId: album.id,
    mode: prefs.mode,
    layoutMode: prefs.layoutMode,
    captures,
    result,
    audit,
    notice,
    albums,
    album,
    setRole: (role) => setPrefs((prev) => ({ ...prev, role })),
    setLocale: (locale) => setPrefs((prev) => ({ ...prev, locale })),
    setAlbumId: (albumId) => {
      setPrefs((prev) => ({ ...prev, albumId }));
      setCaptures({});
      setResult(null);
    },
    setMode: (mode) => setPrefs((prev) => ({ ...prev, mode })),
    setLayoutMode: (layoutMode) => setPrefs((prev) => ({ ...prev, layoutMode })),
    saveCapture: (slotId, dataUrl) =>
      setCaptures((prev) => ({
        ...prev,
        [slotId]: { slotId, dataUrl, capturedAt: new Date().toISOString() },
      })),
    clearCapture: (slotId) =>
      setCaptures((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      }),
    resetCaptures: () => {
      setCaptures({});
      setResult(null);
    },
    setResult,
    logGate: (entry) =>
      setAudit((prev) => [
        {
          ...entry,
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 40)),
    slotsToShoot,
    setNotice,
    taught,
    hasTaughtAlbum,
    goldenSrc: (slotId) => {
      if (taught[slotId]) return taught[slotId]!;
      const path = goldenPath(album, slotId);
      return path || EMPTY_FRAME;
    },
    saveTaughtAlbum: (photos) => {
      const next = { ...taughtStore, [album.id]: photos };
      setTaughtStore(next);
      writeTaughtStore(next);
    },
    clearTaughtAlbum: () => {
      const next = { ...taughtStore };
      delete next[album.id];
      setTaughtStore(next);
      writeTaughtStore(next);
    },
    addLine: ({ name, sku, templateId }) => {
      const line = cloneLine({ name, sku, templateId });
      setStoredLines((prev) => {
        const next = [...prev, line];
        writeStoredLines(next);
        return next;
      });
      setPrefs((prev) => ({ ...prev, albumId: line.id }));
      setCaptures({});
      setResult(null);
    },
    addFrame: (label) => {
      const slot = newSlot(label.trim() || `Frame ${album.slots.length + 1}`);
      patchAlbum((current) => ({
        ...current,
        slots: [...current.slots, slot],
      }));
      return slot;
    },
    removeFrame: (slotId) => {
      patchAlbum((current) => {
        if (current.slots.length <= 1) return current;
        return {
          ...current,
          slots: current.slots.filter((slot) => slot.id !== slotId),
        };
      });
      const photos = { ...(taughtStore[album.id] ?? {}) };
      delete photos[slotId];
      const next = { ...taughtStore, [album.id]: photos };
      setTaughtStore(next);
      writeTaughtStore(next);
    },
    renameFrame: (slotId, label) => {
      patchAlbum((current) => ({
        ...current,
        slots: current.slots.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                titleEn: label,
                titleHi: label,
                sopLine: `Compare ${label.trim() || slot.titleEn} to the last good run.`,
              }
            : slot,
        ),
      }));
    },
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
}
