"use client";

import Link from "next/link";
import { ALBUMS } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { formatInr } from "@/lib/impact";
import { useSession } from "@/lib/session";

export function HomeScreen() {
  const {
    locale,
    role,
    setRole,
    albumId,
    setAlbumId,
    mode,
    setMode,
    album,
    audit,
    resetCaptures,
  } = useSession();
  const last = audit[0];

  return (
    <div className="flex flex-1 flex-col gap-5">
      <section className="rounded-3xl border border-gf-line bg-gf-card p-5 gf-frame">
        <p className="text-2xl font-semibold tracking-tight text-gf-text">
          {t(locale, "tagline")}
        </p>
        <p className="mt-3 text-base leading-7 text-gf-muted">
          Five photos. A start gate. The model reads the label; the rules decide
          HOLD or CLEAR.
        </p>
      </section>

      <section>
        <p className="gf-label mb-2">
          {t(locale, "role")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["operator", "supervisor"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                role === value
                  ? "border-gf-gold bg-[#ede9fe] text-gf-gold-2"
                  : "border-gf-line bg-white text-gf-text"
              }`}
            >
              {t(locale, value)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="gf-label mb-2">
          {t(locale, "line")}
        </p>
        <div className="grid gap-2">
          {ALBUMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAlbumId(item.id)}
              className={`rounded-2xl border px-4 py-3 text-left ${
                albumId === item.id
                  ? "border-gf-gold bg-[#ede9fe]"
                  : "border-gf-line bg-white"
              }`}
            >
              <p className="text-sm font-semibold text-gf-text">{item.lineName}</p>
              <p className="mt-1 font-mono text-xs font-medium text-gf-muted">
                {item.sku} · {item.skuName} · {item.workOrder}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gf-line bg-gf-card px-4 py-3">
        <p className="gf-label">
          {t(locale, "engine")}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(["practice", "live"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                mode === value
                  ? "border-gf-gold bg-[#ede9fe] text-gf-gold-2"
                  : "border-gf-line bg-white text-gf-text"
              }`}
            >
              {t(locale, value)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm leading-6 text-gf-muted">
          {mode === "live" ? t(locale, "liveHint") : t(locale, "practiceHint")}
        </p>
      </section>

      <section className="rounded-2xl border border-gf-line bg-gf-card-2 px-4 py-3">
        <p className="gf-label">
          {t(locale, "workOrder")}
        </p>
        <p className="mt-1 text-lg font-semibold">
          {album.sku}{" "}
          <span className="text-gf-muted font-normal">{album.skuName}</span>
        </p>
        <p className="mt-1 font-mono text-sm font-semibold text-gf-gold">
          {album.workOrder} · hold {album.holdMinutes} {t(locale, "minutes")} ·
          escape {formatInr(album.scrapUnitsIfEscape * album.unitMarginInr + album.recallReserveInr)}
        </p>
      </section>

      <Link
        href="/check"
        onClick={() => resetCaptures()}
        className="gf-cta flex h-14 items-center justify-center rounded-2xl text-base font-semibold"
      >
        {t(locale, "startCheck")}
      </Link>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="gf-label">
            {t(locale, "lastGate")}
          </p>
          <Link href="/history" className="text-sm font-semibold text-gf-gold">
            {t(locale, "history")}
          </Link>
        </div>
        {last ? (
          <div className="rounded-2xl border border-gf-line bg-gf-card px-4 py-3">
            <p
              className={`font-mono text-sm ${
                last.decision === "HOLD" ? "text-gf-hold" : "text-gf-clear"
              }`}
            >
              {last.decision} · {last.sku}
            </p>
            <p className="mt-1 text-sm text-gf-muted">{last.summary}</p>
          </div>
        ) : (
          <p className="text-sm text-gf-muted">{t(locale, "emptyHistory")}</p>
        )}
      </section>

      {role === "supervisor" ? (
        <Link
          href="/goldens"
          className="text-center text-sm font-semibold text-gf-gold underline-offset-4 hover:underline"
        >
          {t(locale, "goldens")}
        </Link>
      ) : null}
    </div>
  );
}
