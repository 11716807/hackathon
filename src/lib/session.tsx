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
  isCustomLineId,
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
const RESULT_KEY = "gf-last-result";

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
  lineIsTaught: (albumId: string) => boolean;
  goldenSrc: (slotId: SlotId) => string;
  saveTaughtAlbum: (photos: TaughtAlbum) => Promise<void>;
  clearTaughtAlbum: () => Promise<void>;
  addLine: (input: { name: string; sku: string; templateId?: string }) => void;
  updateLine: (input: { id: string; name: string; sku: string }) => void;
  deleteLine: (id: string) => Promise<void>;
  isCustomLine: (id: string) => boolean;
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

function readLastResult(): InspectionResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as InspectionResult) : null;
  } catch {
    return null;
  }
}

function writeLastResult(next: InspectionResult | null) {
  if (typeof window === "undefined") return;
  try {
    if (next) window.sessionStorage.setItem(RESULT_KEY, JSON.stringify(next));
    else window.sessionStorage.removeItem(RESULT_KEY);
  } catch {
    // quota / private mode — ignore
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
  const [result, setResultState] = useState<InspectionResult | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [taughtStore, setTaughtStore] = useState<TaughtStore>({});
  const [storedLines, setStoredLines] = useState<StoredLine[]>([]);

  function setResult(next: InspectionResult | null) {
    setResultState(next);
    writeLastResult(next);
  }

  useEffect(() => {
    setPrefs(readPrefs());
    setAudit(readAudit());
    setTaughtStore(readTaughtStore());
    setStoredLines(readStoredLines());
    setResultState(readLastResult());
    setHydrated(true);

    void (async () => {
      try {
        const [linesRes, auditRes, goldensRes] = await Promise.all([
          fetch("/api/lines"),
          fetch("/api/audit"),
          fetch("/api/goldens"),
        ]);
        if (linesRes.ok) {
          const payload = (await linesRes.json()) as { lines?: StoredLine[] };
          if (Array.isArray(payload.lines)) {
            setStoredLines(payload.lines);
            writeStoredLines(payload.lines);
          }
        }
        if (auditRes.ok) {
          const payload = (await auditRes.json()) as { audit?: AuditEntry[] };
          if (Array.isArray(payload.audit)) {
            setAudit(payload.audit);
            window.localStorage.setItem(AUDIT_KEY, JSON.stringify(payload.audit));
          }
        }
        if (goldensRes.ok) {
          const payload = (await goldensRes.json()) as {
            albums?: {
              albumId: string;
              frames: Partial<Record<string, { url: string }>>;
            }[];
          };
          if (Array.isArray(payload.albums)) {
            const cloud: TaughtStore = {};
            for (const albumDoc of payload.albums) {
              const photos: TaughtAlbum = {};
              for (const [slotId, frame] of Object.entries(
                albumDoc.frames ?? {},
              )) {
                if (frame?.url) photos[slotId] = frame.url;
              }
              if (Object.keys(photos).length > 0) {
                cloud[albumDoc.albumId] = photos;
              }
            }
            setTaughtStore((prev) => {
              const merged = { ...prev, ...cloud };
              writeTaughtStore(merged);
              return merged;
            });
          }
        }
      } catch {
        // Offline / cloud not ready — keep localStorage.
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
  }, [audit, hydrated]);

  function persistLineCloud(line: StoredLine) {
    void fetch("/api/lines", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line }),
    }).catch(() => {
      // localStorage already written via writeStoredLines in callers
    });
  }

  function persistAuditCloud(entry: AuditEntry) {
    void fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry }),
    }).catch(() => {
      // localStorage already written
    });
  }

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
      persistLineCloud(stored);
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
      setResultState(null);
      writeLastResult(null);
    },
    setResult,
    logGate: (entry) => {
      const full: AuditEntry = {
        ...entry,
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
      };
      setAudit((prev) => [full, ...prev].slice(0, 40));
      persistAuditCloud(full);
    },
    slotsToShoot,
    setNotice,
    taught,
    hasTaughtAlbum,
    lineIsTaught: (id) => {
      const target = albums.find((item) => item.id === id);
      if (!target || target.slots.length === 0) return false;
      return albumIsTaught(
        taughtStore[id],
        target.slots.map((slot) => slot.id),
      );
    },
    goldenSrc: (slotId) => {
      if (taught[slotId]) return taught[slotId]!;
      const path = goldenPath(album, slotId);
      return path || EMPTY_FRAME;
    },
    saveTaughtAlbum: async (photos) => {
      const nextLocal = { ...taughtStore, [album.id]: photos };
      setTaughtStore(nextLocal);
      writeTaughtStore(nextLocal);
      try {
        const response = await fetch("/api/goldens", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: album.id, photos }),
        });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Failed to save goldens to Storage");
        }
        const payload = (await response.json()) as {
          album?: { frames?: Partial<Record<string, { url: string }>> };
        };
        const urls: TaughtAlbum = {};
        for (const [slotId, frame] of Object.entries(
          payload.album?.frames ?? {},
        )) {
          if (frame?.url) urls[slotId] = frame.url;
        }
        if (Object.keys(urls).length > 0) {
          const next = { ...taughtStore, [album.id]: urls };
          setTaughtStore(next);
          writeTaughtStore(next);
        }
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Saved on phone only — Storage upload failed",
        );
      }
    },
    clearTaughtAlbum: async () => {
      const next = { ...taughtStore };
      delete next[album.id];
      setTaughtStore(next);
      writeTaughtStore(next);
      try {
        await fetch(`/api/goldens?albumId=${encodeURIComponent(album.id)}`, {
          method: "DELETE",
        });
      } catch {
        // local clear already applied
      }
    },
    addLine: ({ name, sku, templateId }) => {
      const line = cloneLine({ name, sku, templateId });
      setStoredLines((prev) => {
        const next = [...prev, line];
        writeStoredLines(next);
        persistLineCloud(line);
        return next;
      });
      setPrefs((prev) => ({ ...prev, albumId: line.id }));
      setCaptures({});
      setResult(null);
    },
    updateLine: ({ id, name, sku }) => {
      const trimmedName = name.trim();
      const trimmedSku = sku.trim();
      setStoredLines((prev) => {
        const resolved = resolveAlbums(prev).find((item) => item.id === id);
        if (!resolved) return prev;
        const stored = albumToStored(
          {
            ...resolved,
            lineName: trimmedName || resolved.lineName,
            sku: trimmedSku || resolved.sku,
            skuName: trimmedName || resolved.skuName,
            workOrder: `WO-${trimmedSku || resolved.sku}`,
          },
          ALBUMS.some((item) => item.id === id)
            ? id
            : prev.find((line) => line.id === id)?.templateId,
        );
        const exists = prev.some((line) => line.id === id);
        const next = exists
          ? prev.map((line) => (line.id === id ? stored : line))
          : [...prev, stored];
        writeStoredLines(next);
        persistLineCloud(stored);
        return next;
      });
    },
    deleteLine: async (id) => {
      if (!isCustomLineId(id)) return;
      setStoredLines((prev) => {
        const next = prev.filter((line) => line.id !== id);
        writeStoredLines(next);
        return next;
      });
      setTaughtStore((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        writeTaughtStore(next);
        return next;
      });
      if (prefs.albumId === id) {
        setPrefs((prev) => ({ ...prev, albumId: ALBUMS[0].id }));
        setCaptures({});
        setResult(null);
      }
      try {
        await fetch(`/api/lines?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        await fetch(`/api/goldens?albumId=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch {
        // local delete already applied
      }
    },
    isCustomLine: isCustomLineId,
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
