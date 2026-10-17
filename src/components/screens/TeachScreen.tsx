"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraSheet } from "@/components/CameraSheet";
import { CaptureDock } from "@/components/CaptureDock";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { SlotSpec } from "@/lib/types";

export function TeachScreen() {
  const router = useRouter();
  const {
    locale,
    album,
    taught,
    saveTaughtAlbum,
    setNotice,
    goldenSrc,
    addFrame,
    removeFrame,
    renameFrame,
  } = useSession();
  const [shots, setShots] = useState<Record<string, string>>({});
  const [active, setActive] = useState<SlotSpec | null>(null);
  const [newLabel, setNewLabel] = useState("");

  const taughtCount = Object.values(taught).filter(Boolean).length;

  useEffect(() => {
    const photos: Record<string, string> = {};
    for (const [id, dataUrl] of Object.entries(taught)) {
      if (dataUrl) photos[id] = dataUrl;
    }
    setShots(photos);
  }, [album.id, taughtCount]);

  const remaining = album.slots.filter((slot) => !shots[slot.id]);
  const ready = album.slots.length > 0 && remaining.length === 0;

  const [saving, setSaving] = useState(false);

  async function save() {
    if (!ready || saving) return;
    setSaving(true);
    try {
      await saveTaughtAlbum(shots);
      setNotice(t(locale, "taughtReady"));
      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    router.push("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="text-sm font-semibold text-gf-gold-2"
        >
          ← {t(locale, "back")}
        </button>
        <button
          type="button"
          onClick={() => {
            if (ready) void save();
            else goBack();
          }}
          disabled={saving}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            ready
              ? "bg-[#5b21b6] text-white"
              : "bg-white/70 text-gf-gold-2"
          }`}
        >
          {ready ? t(locale, "done") : t(locale, "back")}
        </button>
      </div>

      <p className="mt-3 text-center text-sm font-semibold tracking-[0.16em] text-gf-gold uppercase">
        {t(locale, "teachTitle")}
      </p>
      <p className="gf-whisper mx-auto mt-2 max-w-md text-center">
        {t(locale, "teachHint")}
      </p>
      <p className="mt-2 text-center text-sm font-semibold text-gf-gold-2">
        {album.lineName}
      </p>

      <div className="mx-auto mt-5 flex w-full max-w-xl flex-col gap-2 sm:flex-row">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder={t(locale, "frameLabel")}
          className="min-w-0 flex-1 rounded-full bg-white/80 px-4 py-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const slot = addFrame(newLabel);
            setNewLabel("");
            setActive(slot);
          }}
          className="h-12 shrink-0 rounded-full bg-[#5b21b6] px-6 text-sm font-semibold text-white sm:h-auto"
        >
          {t(locale, "addFrame")}
        </button>
      </div>

      <div className="mx-auto mt-4 grid w-full max-w-xl gap-3 pb-36">
        {album.slots.map((slot) => {
          const photo = shots[slot.id];
          return (
            <div
              key={slot.id}
              className="flex gap-3 rounded-[1.4rem] bg-white/70 p-3"
            >
              <button
                type="button"
                onClick={() => setActive(slot)}
                className="w-24 shrink-0 overflow-hidden rounded-2xl"
              >
                <img
                  src={photo ?? goldenSrc(slot.id)}
                  alt=""
                  className={`aspect-[4/5] w-full object-cover ${photo ? "" : "opacity-50"}`}
                />
              </button>
              <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                <input
                  value={slot.titleEn}
                  onChange={(event) => renameFrame(slot.id, event.target.value)}
                  className="w-full bg-transparent text-base font-semibold outline-none"
                  aria-label={t(locale, "frameLabel")}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActive(slot)}
                    className="text-sm font-semibold text-gf-gold-2"
                  >
                    {photo ? t(locale, "retakePhoto") : t(locale, "takePhoto")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFrame(slot.id)}
                    disabled={album.slots.length <= 1}
                    className="text-sm font-semibold text-gf-hold disabled:opacity-30"
                  >
                    {t(locale, "removeFrame")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-20 z-20 mx-auto mb-4 flex w-full max-w-xl flex-col items-center gap-2 bg-gradient-to-t from-[#e8e0f4] via-[#e8e0f4]/95 to-transparent pt-6">
        {ready ? (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="gf-cta flex h-14 min-w-[220px] items-center justify-center rounded-full px-8 text-base font-semibold"
          >
            {t(locale, "done")} · {t(locale, "saveGoldens")}
          </button>
        ) : (
          <>
            <p className="text-center text-sm text-gf-muted">
              {t(locale, "needAll")}
            </p>
            <button
              type="button"
              onClick={goBack}
              className="h-12 min-w-[180px] rounded-full bg-white/80 px-6 text-sm font-semibold text-gf-gold-2"
            >
              ← {t(locale, "back")}
            </button>
          </>
        )}
      </div>

      <CaptureDock
        onSnap={() => {
          const next = remaining[0] ?? album.slots[0];
          if (next) setActive(next);
        }}
      />

      {active ? (
        <CameraSheet
          key={active.id}
          open
          slot={active}
          locale={locale}
          goldenSrc={shots[active.id] ?? goldenSrc(active.id)}
          onClose={() => setActive(null)}
          onCapture={(dataUrl) =>
            setShots((prev) => ({
              ...prev,
              [active.id]: dataUrl,
            }))
          }
        />
      ) : null}
    </div>
  );
}
