"use client";

import Link from "next/link";
import { PolaroidFan } from "@/components/PolaroidFan";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function GoldensScreen() {
  const { locale, album, hasTaughtAlbum, goldenSrc, clearTaughtAlbum, setNotice } =
    useSession();

  const prints = album.slots.map((slot) => ({
    src: goldenSrc(slot.id),
    caption: locale === "hi" ? slot.titleHi : slot.titleEn,
  }));

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <p className="text-sm font-semibold tracking-[0.16em] text-gf-gold uppercase">
        {t(locale, "goldens")}
      </p>
      <h1 className="gf-stamp mt-2 text-5xl md:text-7xl">
        {album.sku}
      </h1>
      <p className="gf-whisper mt-3 max-w-md">
        {album.lineName}.{" "}
        {hasTaughtAlbum ? t(locale, "taughtReady") : t(locale, "taughtMissing")}
      </p>

      <div className="mt-4 w-full">
        <PolaroidFan key={album.id} items={prints} />
      </div>

      {hasTaughtAlbum ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/goldens/teach"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white/70 px-5 text-sm font-semibold text-gf-gold-2"
          >
            <span aria-hidden>✎</span>
            {t(locale, "editGoldens")}
          </Link>
          <button
            type="button"
            onClick={() => {
              void clearTaughtAlbum().then(() =>
                setNotice(t(locale, "taughtMissing")),
              );
            }}
            className="text-sm font-semibold text-gf-hold"
          >
            {t(locale, "clearTaught")}
          </button>
        </div>
      ) : (
        <Link
          href="/goldens/teach"
          className="gf-cta mt-4 inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-semibold"
        >
          {t(locale, "teachGoldens")}
        </Link>
      )}
    </div>
  );
}
