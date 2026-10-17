"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function HistoryScreen() {
  const router = useRouter();
  const { locale, audit, setNotice } = useSession();

  function goHome() {
    setNotice(null);
    router.push("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goHome}
          className="text-sm font-semibold text-gf-gold-2"
        >
          ← {t(locale, "back")}
        </button>
        <Link
          href="/"
          onClick={() => setNotice(null)}
          className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-gf-gold-2"
        >
          {t(locale, "home")}
        </Link>
      </div>

      <p className="mt-4 text-center text-sm font-semibold tracking-[0.16em] text-gf-gold uppercase">
        {t(locale, "history")}
      </p>
      <h1 className="gf-stamp mt-2 text-center text-5xl md:text-7xl">
        {locale === "hi" ? "शिफ्ट" : "This shift"}
      </h1>
      <p className="gf-whisper mx-auto mt-2 max-w-sm text-center text-sm">
        {locale === "hi"
          ? "HOLD / CLEAR लॉग। वापस जाने के लिए ऊपर बैक दबाएँ।"
          : "HOLD / CLEAR log for this shift. Use Back anytime to leave."}
      </p>

      {audit.length === 0 ? (
        <div className="mt-10 flex flex-1 flex-col items-center gap-4">
          <p className="gf-whisper text-center">{t(locale, "emptyHistory")}</p>
          <button
            type="button"
            onClick={goHome}
            className="gf-cta inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
          >
            ← {t(locale, "home")}
          </button>
        </div>
      ) : (
        <ol className="mt-8 flex-1 pb-28">
          {audit.map((entry) => (
            <li
              key={entry.id}
              className="mb-3 rounded-[1.4rem] bg-white/75 px-4 py-4 ring-1 ring-black/5"
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className={`gf-stamp text-3xl ${
                    entry.decision === "HOLD" ? "text-gf-hold" : "text-gf-clear"
                  }`}
                >
                  {entry.decision === "HOLD"
                    ? t(locale, "hold")
                    : t(locale, "clear")}
                </p>
                <p className="pt-1 text-right text-xs font-semibold text-gf-muted">
                  {new Date(entry.at).toLocaleTimeString()}
                  <br />
                  {entry.actor}
                  {entry.overrideReason ? " · override" : ""}
                </p>
              </div>
              <p className="mt-2 font-semibold text-gf-text">
                {entry.lineName} · {entry.sku}
              </p>
              <p className="gf-whisper mt-1 text-sm">{entry.summary}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="sticky bottom-4 z-20 mx-auto mt-auto flex w-full max-w-xl justify-center bg-gradient-to-t from-[#e8e0f4] via-[#e8e0f4]/95 to-transparent pt-6">
        <button
          type="button"
          onClick={goHome}
          className="gf-cta flex h-14 min-w-[220px] items-center justify-center rounded-full px-8 text-base font-semibold"
        >
          ← {t(locale, "home")}
        </button>
      </div>
    </div>
  );
}
