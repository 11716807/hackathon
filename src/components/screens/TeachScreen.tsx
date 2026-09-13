"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CameraSheet } from "@/components/CameraSheet";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { SlotCapture, SlotId, SlotSpec } from "@/lib/types";

export function TeachScreen() {
  const router = useRouter();
  const { locale, album, saveTaughtAlbum, setNotice, goldenSrc } = useSession();
  const [shots, setShots] = useState<Partial<Record<SlotId, SlotCapture>>>({});
  const [active, setActive] = useState<SlotSpec | null>(null);

  const remaining = album.slots.filter((slot) => !shots[slot.id]);
  const ready = remaining.length === 0;

  function save() {
    if (!ready) return;
    const photos = Object.fromEntries(
      album.slots.map((slot) => [slot.id, shots[slot.id]!.dataUrl]),
    );
    saveTaughtAlbum(photos);
    setNotice(t(locale, "taughtReady"));
    router.push("/");
  }

  const kit =
    album.industry === "desk"
      ? locale === "hi"
        ? [
            "लैपटॉप डेस्क पर रखें",
            `चार्जर पर कागज़: बड़े अक्षर ${album.sku}`,
            "ढक्कन बंद करें",
            "केबल लैपटॉप में लगाएँ",
            "चार्जिंग लाइट दिखे",
          ]
        : [
            "Laptop sitting on the desk",
            `Sticky note on the charger: big letters ${album.sku}`,
            "Lid CLOSED",
            "Cable plugged into the laptop",
            "Charging light / battery icon ON",
          ]
      : album.industry === "packaging"
        ? locale === "hi"
          ? [
              `लेबल: बड़े अक्षरों में ${album.sku} BLUE लिखें`,
              "गार्ड: गत्ता बंद रखें",
              "जिग + पहला पीस: बोतल / कप",
              "हॉपर: एक कटोरा",
            ]
          : [
              `Label: write ${album.sku} BLUE in big letters`,
              "Guard: cardboard flap CLOSED",
              "Jig + first piece: a bottle or cup",
              "Hopper: a bowl",
            ]
        : locale === "hi"
          ? [
              `ट्रैवलर: ${album.sku} लिखें`,
              "कवर बंद",
              "फिक्स्चर: कोई बॉक्स / किताब",
              "बिन: एक डिब्बा",
            ]
          : [
              `Traveler: write ${album.sku} large`,
              "Cover CLOSED",
              "Fixture: a box or book",
              "Bin: a small box",
            ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t(locale, "teachTitle")}</h1>
          <p className="mt-1 text-sm font-medium text-gf-muted">
            {t(locale, "teachHint")}
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-gf-gold">
          {t(locale, "home")}
        </Link>
      </div>

      <section className="mb-4 rounded-2xl border border-gf-line bg-white px-4 py-3">
        <p className="gf-label">{t(locale, "kitTitle")}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm font-medium text-gf-text">
          {kit.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {album.slots.map((slot) => {
          const shot = shots[slot.id];
          const title = locale === "hi" ? slot.titleHi : slot.titleEn;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setActive(slot)}
              className="overflow-hidden rounded-2xl border border-gf-line bg-white text-left"
            >
              <div className="relative aspect-[4/3] bg-gf-card-2">
                <img
                  src={shot?.dataUrl ?? goldenSrc(slot.id)}
                  alt=""
                  className={`h-full w-full object-cover ${shot ? "" : "opacity-35"}`}
                />
                <span className="absolute inset-x-2 bottom-2 rounded-lg bg-[#1e1233]/80 px-2 py-1 text-center font-mono text-xs font-semibold text-white">
                  {shot ? t(locale, "retake") : t(locale, "snap")}
                </span>
              </div>
              <p className="px-3 py-2 text-sm font-semibold">{title}</p>
            </button>
          );
        })}
      </div>

      {!ready ? (
        <p className="mt-4 text-sm font-semibold text-gf-warn">
          {t(locale, "needAll")}
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={!ready}
        className="gf-cta mt-auto flex h-14 items-center justify-center rounded-2xl text-base font-semibold disabled:opacity-40"
      >
        {t(locale, "saveGoldens")}
      </button>

      {active ? (
        <CameraSheet
          key={active.id}
          open
          slot={active}
          locale={locale}
          goldenSrc={goldenSrc(active.id)}
          onClose={() => setActive(null)}
          onCapture={(dataUrl) =>
            setShots((prev) => ({
              ...prev,
              [active.id]: {
                slotId: active.id,
                dataUrl,
                capturedAt: new Date().toISOString(),
              },
            }))
          }
        />
      ) : null}
    </div>
  );
}
