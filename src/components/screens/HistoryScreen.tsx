"use client";

import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function HistoryScreen() {
  const { locale, audit } = useSession();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
      <p className="text-center text-sm font-semibold tracking-[0.16em] text-gf-gold uppercase">
        {t(locale, "history")}
      </p>
      <h1 className="gf-stamp mt-2 text-center text-5xl md:text-7xl">
        {locale === "hi" ? "शिफ्ट" : "This shift"}
      </h1>

      {audit.length === 0 ? (
        <p className="gf-whisper mt-10 text-center">{t(locale, "emptyHistory")}</p>
      ) : (
        <ol className="mt-12">
          {audit.map((entry, index) => (
            <li key={entry.id} className="relative pb-10 pl-2">
              {index < audit.length - 1 ? (
                <span className="absolute top-8 left-[1.15rem] h-[calc(100%-1.5rem)] w-px bg-[#160b24]/15" />
              ) : null}
              <div className="flex gap-4">
                <p
                  className={`gf-stamp w-16 shrink-0 text-2xl ${
                    entry.decision === "HOLD" ? "text-gf-hold" : "text-gf-clear"
                  }`}
                >
                  {entry.decision === "HOLD" ? t(locale, "hold") : t(locale, "clear")}
                </p>
                <div>
                  <p className="font-semibold">
                    {entry.lineName} · {entry.sku}
                  </p>
                  <p className="gf-whisper mt-1">{entry.summary}</p>
                  <p className="mt-2 text-xs font-semibold text-gf-muted">
                    {new Date(entry.at).toLocaleTimeString()} · {entry.actor}
                    {entry.overrideReason ? " · override" : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
