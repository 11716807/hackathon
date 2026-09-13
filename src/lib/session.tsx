"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALBUMS, requireAlbum } from "./catalog";
import { mustFixSlotIds } from "./gate";
import type {
  Album,
  AuditEntry,
  EngineMode,
  InspectionResult,
  Locale,
  Role,
  SlotCapture,
  SlotId,
} from "./types";

const AUDIT_KEY = "gf-audit";
const PREFS_KEY = "gf-prefs";

interface Prefs {
  role: Role;
  locale: Locale;
  albumId: string;
  mode: EngineMode;
}

interface SessionState {
  role: Role;
  locale: Locale;
  albumId: string;
  mode: EngineMode;
  captures: Partial<Record<SlotId, SlotCapture>>;
  result: InspectionResult | null;
  audit: AuditEntry[];
  notice: string | null;
  album: Album;
  setRole: (role: Role) => void;
  setLocale: (locale: Locale) => void;
  setAlbumId: (id: string) => void;
  setMode: (mode: EngineMode) => void;
  saveCapture: (slotId: SlotId, dataUrl: string) => void;
  clearCapture: (slotId: SlotId) => void;
  resetCaptures: () => void;
  setResult: (result: InspectionResult | null) => void;
  logGate: (entry: Omit<AuditEntry, "id" | "at">) => void;
  slotsToShoot: SlotId[];
  setNotice: (notice: string | null) => void;
}

const SessionContext = createContext<SessionState | null>(null);

function readPrefs(): Prefs {
  if (typeof window === "undefined") {
    return {
      role: "operator",
      locale: "en",
      albumId: ALBUMS[0].id,
      mode: "practice",
    };
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return {
        role: "operator",
        locale: "en",
        albumId: ALBUMS[0].id,
        mode: process.env.NEXT_PUBLIC_DEFAULT_ENGINE === "live" ? "live" : "practice",
      };
    }
    return JSON.parse(raw) as Prefs;
  } catch {
    return {
      role: "operator",
      locale: "en",
      albumId: ALBUMS[0].id,
      mode: "practice",
    };
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
    mode: "practice",
  });
  const [hydrated, setHydrated] = useState(false);
  const [captures, setCaptures] = useState<Partial<Record<SlotId, SlotCapture>>>(
    {},
  );
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // Persist across visits; run after mount to avoid SSR mismatch.
    setPrefs(readPrefs());
    setAudit(readAudit());
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

  const album = requireAlbum(prefs.albumId);

  const slotsToShoot = useMemo(() => {
    if (!result) return album.slots.map((slot) => slot.id);
    return mustFixSlotIds(result.findings);
  }, [album.slots, result]);

  const value: SessionState = {
    role: prefs.role,
    locale: prefs.locale,
    albumId: prefs.albumId,
    mode: prefs.mode,
    captures,
    result,
    audit,
    notice,
    album,
    setRole: (role) => setPrefs((prev) => ({ ...prev, role })),
    setLocale: (locale) => setPrefs((prev) => ({ ...prev, locale })),
    setAlbumId: (albumId) => {
      setPrefs((prev) => ({ ...prev, albumId }));
      setCaptures({});
      setResult(null);
    },
    setMode: (mode) => setPrefs((prev) => ({ ...prev, mode })),
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
