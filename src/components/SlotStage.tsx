"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Polaroid } from "@/components/Polaroid";
import { t } from "@/lib/i18n";
import type { Locale, SlotSpec } from "@/lib/types";

interface SlotStageProps {
  slots: SlotSpec[];
  srcFor: (slot: SlotSpec) => string;
  isShot: (slot: SlotSpec) => boolean;
  onPick: (slot: SlotSpec) => void;
  locale: Locale;
  hint?: string;
}

export function SlotStage({
  slots,
  srcFor,
  isShot,
  onPick,
  locale,
  hint,
}: SlotStageProps) {
  const shotKey = slots.map((slot) => `${slot.id}:${isShot(slot) ? "1" : "0"}`).join("|");
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    const next = slots.findIndex((slot) => !isShot(slot));
    setFocus(next >= 0 ? next : 0);
  }, [shotKey]);

  const slot = slots[Math.min(focus, Math.max(slots.length - 1, 0))];
  if (!slot) return null;

  const title = locale === "hi" ? slot.titleHi : slot.titleEn;
  const done = slots.filter(isShot).length;
  const shot = isShot(slot);

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-center text-sm font-semibold text-gf-gold-2">
        {done}/{slots.length} {t(locale, "photoProgress")}
      </p>
      <h2 className="mt-1 text-center text-2xl font-semibold tracking-tight md:text-3xl">
        {shot ? title : `${t(locale, "nextPhoto")}: ${title}`}
      </h2>
      <p className="gf-whisper mx-auto mt-2 max-w-sm text-center">
        {t(locale, "tapOrUpload")}
      </p>

      <motion.button
        type="button"
        onClick={() => onPick(slot)}
        className="mx-auto mt-6 w-full max-w-[320px] text-left md:max-w-[380px]"
        whileTap={{ scale: 0.98 }}
        aria-label={shot ? t(locale, "retakePhoto") : t(locale, "takePhoto")}
      >
        <Polaroid
          src={srcFor(slot)}
          caption={title}
          faded={!shot}
          stamp={shot ? "OK" : undefined}
          stampTone="clear"
        >
          {!shot ? (
            <span className="absolute inset-x-0 top-[28%] flex justify-center px-4">
              <span className="gf-pulse rounded-full bg-white px-5 py-3 text-sm font-semibold text-gf-gold-2 shadow-lg">
                {t(locale, "takePhoto")}
              </span>
            </span>
          ) : null}
        </Polaroid>
      </motion.button>

      <button
        type="button"
        onClick={() => onPick(slot)}
        className="gf-cta mx-auto mt-5 flex h-14 min-w-[240px] items-center justify-center rounded-full px-8 text-base font-semibold"
      >
        {shot ? t(locale, "retakePhoto") : t(locale, "takePhoto")}
      </button>

      <p className="gf-whisper mx-auto mt-4 max-w-md text-center">
        {hint ?? (locale === "hi" ? slot.hintHi : slot.hintEn)}
      </p>

      <div className="mt-6 flex items-end justify-center px-2">
        {slots.map((item, index) => {
          const caption = locale === "hi" ? item.titleHi : item.titleEn;
          const active = index === focus;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFocus(index);
                onPick(item);
              }}
              className="origin-bottom"
              style={{
                marginLeft: index === 0 ? 0 : -18,
                zIndex: active ? 20 : index,
                transform: `rotate(${(index - (slots.length - 1) / 2) * 4}deg) translateY(${active ? -10 : 12}px) scale(${active ? 1.08 : 0.9})`,
              }}
              aria-label={caption}
            >
              <div className="gf-print w-[72px] p-1 pb-6 md:w-[92px]">
                <img
                  src={srcFor(item)}
                  alt=""
                  className={`aspect-[4/5] w-full object-cover ${isShot(item) ? "" : "opacity-40"}`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
