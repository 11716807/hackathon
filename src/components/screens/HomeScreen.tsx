"use client";

import Link from "next/link";
import { HomeFaq } from "@/components/HomeFaq";
import { KitPicker } from "@/components/KitPicker";
import { PolaroidFan } from "@/components/PolaroidFan";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function HomeScreen() {
  const { locale, album, audit, resetCaptures, hasTaughtAlbum, goldenSrc } =
    useSession();
  const last = audit[0];
  const prints = album.slots.map((slot) => ({
    src: goldenSrc(slot.id),
    caption: locale === "hi" ? slot.titleHi : slot.titleEn,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="gf-home flex flex-col items-center gap-8 lg:flex-row">
        <div className="gf-home-fan w-full">
          <PolaroidFan key={album.id} items={prints} />
        </div>
        <div className="gf-home-copy max-w-xl">
          <p className="text-sm font-semibold tracking-[0.18em] text-gf-gold uppercase">
            {last ? `${last.decision} · ${album.lineName}` : t(locale, "eyebrow")}
          </p>
          <h1 className="gf-stamp mt-3 text-[3.1rem] text-gf-text md:text-[5.2rem]">
            {locale === "hi" ? "स्टार्ट मत करो।" : "Don’t start."}
          </h1>
          <p className="gf-whisper mt-4 md:text-lg">{t(locale, "pitch")}</p>
          <div className="gf-home-shift mt-6">
            <KitPicker />
          </div>
          <div className="gf-home-actions mt-8">
            {hasTaughtAlbum ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/check"
                  onClick={() => resetCaptures()}
                  className="gf-cta inline-flex h-14 min-w-[240px] items-center justify-center rounded-full px-8 text-base font-semibold"
                >
                  {t(locale, "startCheck")}
                </Link>
                <Link
                  href="/goldens/teach"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white/70 px-4 text-sm font-semibold text-gf-gold-2"
                  title={t(locale, "editGoldens")}
                >
                  <span aria-hidden>✎</span>
                  {t(locale, "editGoldens")}
                </Link>
              </div>
            ) : (
              <Link
                href="/goldens/teach"
                className="gf-cta inline-flex h-14 min-w-[240px] items-center justify-center rounded-full px-8 text-base font-semibold"
              >
                {t(locale, "teachGoldens")}
              </Link>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-gf-gold-2">
              {!hasTaughtAlbum ? (
                <Link href="/check" onClick={() => resetCaptures()}>
                  {t(locale, "startCheck")}
                </Link>
              ) : null}
              <Link href="/goldens">{t(locale, "goldens")}</Link>
            </div>
          </div>
          {last ? <p className="mt-6 text-sm text-gf-muted">{last.summary}</p> : null}
        </div>
      </div>

      <HomeFaq locale={locale} />
      <footer className="gf-footer">
        {t(locale, "footer")}
      </footer>
    </div>
  );
}
