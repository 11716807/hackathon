"use client";

import Link from "next/link";
import { goldenPath } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function GoldensScreen() {
  const { locale, album } = useSession();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t(locale, "goldens")}</h1>
          <p className="mt-1 text-sm font-medium text-gf-muted">
            {album.lineName} · {album.sku} {album.skuName}
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-gf-gold">
          {t(locale, "home")}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {album.slots.map((slot) => (
          <figure
            key={slot.id}
            className="overflow-hidden rounded-2xl border border-gf-line bg-gf-card"
          >
            <img
              src={goldenPath(album, slot.id)}
              alt={slot.titleEn}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="px-3 py-2 text-sm font-semibold text-gf-text">
              {locale === "hi" ? slot.titleHi : slot.titleEn}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
