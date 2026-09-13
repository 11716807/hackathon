"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function HistoryScreen() {
  const { locale, audit } = useSession();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t(locale, "history")}</h1>
        <Link href="/" className="text-sm font-semibold text-gf-gold">
          {t(locale, "home")}
        </Link>
      </div>
      {audit.length === 0 ? (
        <p className="text-sm text-gf-muted">{t(locale, "emptyHistory")}</p>
      ) : (
        <ol className="grid gap-2">
          {audit.map((entry) => (
            <li
              key={entry.id}
              className="rounded-2xl border border-gf-line bg-gf-card px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`font-mono text-sm font-bold ${
                    entry.decision === "HOLD" ? "text-gf-hold" : "text-gf-clear"
                  }`}
                >
                  {entry.decision}
                </p>
                <p className="font-mono text-xs font-semibold text-gf-muted">
                  {new Date(entry.at).toLocaleTimeString()}
                </p>
              </div>
              <p className="mt-1 text-sm">
                {entry.lineName} · {entry.sku}
              </p>
              <p className="mt-1 text-sm text-gf-muted">{entry.summary}</p>
              <p className="mt-1 font-mono text-xs font-semibold text-gf-gold">
                {entry.actor}
                {entry.overrideReason ? " · override" : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
