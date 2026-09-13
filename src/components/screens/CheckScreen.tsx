"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CameraSheet } from "@/components/CameraSheet";
import { goldenPath } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { InspectionResult, SlotSpec } from "@/lib/types";

export function CheckScreen() {
  const router = useRouter();
  const {
    locale,
    album,
    captures,
    saveCapture,
    slotsToShoot,
    result,
    mode,
    setResult,
    setNotice,
  } = useSession();
  const [active, setActive] = useState<SlotSpec | null>(null);
  const [checking, setChecking] = useState(false);

  const required = result ? slotsToShoot : album.slots.map((slot) => slot.id);
  const remaining = required.filter((id) => !captures[id]);
  const ready = remaining.length === 0;

  const slots = useMemo(() => {
    if (!result) return album.slots;
    return album.slots.filter((slot) => required.includes(slot.id));
  }, [album.slots, required, result]);

  async function checkSetup() {
    if (!ready) return;
    setChecking(true);
    setNotice(null);
    try {
      const body = {
        albumId: album.id,
        workOrderSku: album.sku,
        mode,
        practiceScript:
          mode === "practice"
            ? result
              ? "clear_all"
              : "hold_label_and_guard"
            : undefined,
        captures: album.slots
          .map((slot) => captures[slot.id])
          .filter(Boolean)
          .map((capture) => ({
            slotId: capture!.slotId,
            dataUrl: capture!.dataUrl,
          })),
      };
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Inspect failed");
      }
      setResult(payload as InspectionResult);
      router.push("/result");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Inspect failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t(locale, "captureTitle")}</h1>
          <p className="mt-1 text-sm font-medium text-gf-muted">{t(locale, "captureHint")}</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-gf-gold">
          {t(locale, "home")}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {slots.map((slot) => {
          const shot = captures[slot.id];
          const title = locale === "hi" ? slot.titleHi : slot.titleEn;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => {
                setActive(slot);
              }}
              className="overflow-hidden rounded-2xl border border-gf-line bg-gf-card text-left"
            >
              <div className="relative aspect-[4/3] bg-gf-card-2">
                <img
                  src={shot?.dataUrl ?? goldenPath(album, slot.id)}
                  alt=""
                  className={`h-full w-full object-cover ${shot ? "" : "opacity-40"}`}
                />
                {!shot ? (
                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-[#1e1233]/80 px-2 py-1 text-center font-mono text-xs font-semibold text-white">
                    {t(locale, "snap")}
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 rounded-full bg-gf-clear px-2 py-0.5 font-mono text-xs font-bold text-white">
                    OK
                  </span>
                )}
              </div>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-gf-text">{title}</p>
                <p className="text-xs font-medium text-gf-muted">
                  {shot ? t(locale, "retake") : "Golden ghost"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {!ready ? (
        <p className="mt-4 text-sm font-semibold text-gf-warn">{t(locale, "needAll")}</p>
      ) : null}

      <button
        type="button"
        onClick={checkSetup}
        disabled={!ready || checking}
        className="gf-cta mt-auto flex h-14 items-center justify-center rounded-2xl text-base font-semibold disabled:opacity-40"
      >
        {checking ? "…" : t(locale, "checkSetup")}
      </button>

      {active ? (
        <CameraSheet
          key={active.id}
          open
          slot={active}
          locale={locale}
          goldenSrc={goldenPath(album, active.id)}
          onClose={() => setActive(null)}
          onCapture={(dataUrl) => saveCapture(active.id, dataUrl)}
        />
      ) : null}
    </div>
  );
}
