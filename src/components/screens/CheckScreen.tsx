"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraSheet } from "@/components/CameraSheet";
import { CaptureDock } from "@/components/CaptureDock";
import { SlotStage } from "@/components/SlotStage";
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
    hasTaughtAlbum,
    taught,
    goldenSrc,
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
        album: {
          id: album.id,
          lineName: album.lineName,
          sku: album.sku,
          slots: album.slots,
          holdMinutes: album.holdMinutes,
          hourlyOverheadInr: album.hourlyOverheadInr,
          unitMarginInr: album.unitMarginInr,
          scrapUnitsIfEscape: album.scrapUnitsIfEscape,
          recallReserveInr: album.recallReserveInr,
        },
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
        goldens: hasTaughtAlbum
          ? album.slots
              .map((slot) =>
                taught[slot.id]
                  ? { slotId: slot.id, dataUrl: taught[slot.id]! }
                  : null,
              )
              .filter(Boolean)
          : undefined,
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
      <p className="text-center text-sm font-semibold tracking-[0.16em] text-gf-gold uppercase">
        {t(locale, "captureTitle")}
      </p>
      <p className="gf-whisper mx-auto mt-2 max-w-md text-center">
        {t(locale, "captureHint")}
      </p>

      <div className="mt-6 flex-1">
        <SlotStage
          slots={slots}
          srcFor={(slot) => captures[slot.id]?.dataUrl ?? goldenSrc(slot.id)}
          isShot={(slot) => Boolean(captures[slot.id])}
          onPick={setActive}
          locale={locale}
        />
      </div>

      {ready ? (
        <button
          type="button"
          onClick={checkSetup}
          disabled={checking}
          className="gf-cta mx-auto mt-8 flex h-14 min-w-[220px] items-center justify-center rounded-full px-8 text-base font-semibold"
        >
          {checking ? "…" : t(locale, "checkSetup")}
        </button>
      ) : null}

      <CaptureDock
        onSnap={() => {
          const next = slots.find((slot) => !captures[slot.id]) ?? slots[0];
          if (next) setActive(next);
        }}
      />

      {active ? (
        <CameraSheet
          key={active.id}
          open
          slot={active}
          locale={locale}
          goldenSrc={goldenSrc(active.id)}
          onClose={() => setActive(null)}
          onCapture={(dataUrl) => saveCapture(active.id, dataUrl)}
        />
      ) : null}
    </div>
  );
}
