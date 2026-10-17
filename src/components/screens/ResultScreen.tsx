"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DecisionCard } from "@/components/DecisionCard";
import { Polaroid } from "@/components/Polaroid";
import { t } from "@/lib/i18n";
import { formatInr } from "@/lib/impact";
import { useSession } from "@/lib/session";
import type { Finding } from "@/lib/types";

export function ResultScreen() {
  const router = useRouter();
  const {
    locale,
    album,
    result,
    captures,
    logGate,
    setNotice,
    resetCaptures,
    goldenSrc,
  } = useSession();
  const [reason, setReason] = useState("");
  const [traceOpen, setTraceOpen] = useState(false);
  const [flipped, setFlipped] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="gf-stamp text-4xl text-gf-gold-2">
          {locale === "hi" ? "जाँच बाकी" : "Check first"}
        </p>
        <p className="gf-whisper">
          {locale === "hi"
            ? "HOLD / CLEAR यहाँ तभी दिखेगा जब आप चेंजओवर जाँच पूरा करें। पुराने गेट History में हैं।"
            : "HOLD / CLEAR shows here after you finish a changeover check. Logged gates are under History."}
        </p>
        <Link
          href="/check"
          className="gf-cta inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold"
        >
          {t(locale, "startCheck")}
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-gf-gold-2">
          <Link href="/history">{t(locale, "history")}</Link>
          <Link href="/">← {t(locale, "home")}</Link>
        </div>
      </div>
    );
  }

  const must = result.findings.filter(
    (item) => item.severity === "must_fix" || item.severity === "retake",
  );
  const warns = result.findings.filter((item) => item.severity === "warn");
  const okCount = result.findings.filter((item) => item.severity === "ok").length;
  const compareSlots = album.slots.filter((slot) => captures[slot.id]);
  const hold = result.decision === "HOLD";

  function persist(decision: "HOLD" | "CLEAR", overrideReason?: string) {
    logGate({
      albumId: album.id,
      sku: album.sku,
      lineName: album.lineName,
      decision,
      actor: overrideReason ? "supervisor" : "operator",
      summary: overrideReason ? `Override: ${overrideReason}` : result!.summary,
      overrideReason,
      findingCodes: result!.findings.map((item) => item.code),
    });
    setNotice(t(locale, "logged"));
    router.push("/history");
  }

  function lines(items: Finding[]) {
    return items.map((item) => (
      <p key={`${item.slotId}-${item.code}`} className="gf-whisper">
        {item.title}. {item.detail}
      </p>
    ));
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <DecisionCard
        decision={result.decision}
        summary={result.summary}
        locale={locale}
      />

      <p className="mt-6 text-center text-sm font-semibold text-gf-gold-2">
        {t(locale, "holdCost")} {formatInr(result.impact.holdCostInr)} ·{" "}
        {result.impact.holdMinutes} {t(locale, "minutes")}
        <span className="mx-2 text-gf-muted/40">/</span>
        {t(locale, "escapeCost")} {formatInr(result.impact.escapeCostInr)}
      </p>

      <div className="mt-10 flex w-full items-end justify-center overflow-x-auto px-2 pb-4">
        {compareSlots.map((slot, index) => {
          const title = locale === "hi" ? slot.titleHi : slot.titleEn;
          const showToday = flipped === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setFlipped(showToday ? null : slot.id)}
              className="w-[150px] shrink-0 md:w-[180px]"
              style={{
                marginLeft: index === 0 ? 0 : -36,
                zIndex: showToday ? 20 : index,
                transform: `rotate(${(index - 2) * 5}deg) translateY(${showToday ? -18 : 8}px)`,
              }}
            >
              <Polaroid
                src={showToday ? captures[slot.id]!.dataUrl : goldenSrc(slot.id)}
                caption={`${title} · ${showToday ? "today" : "golden"}`}
                stamp={
                  must.some((item) => item.slotId === slot.id)
                    ? "HOLD"
                    : undefined
                }
                stampTone="hold"
              />
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs font-semibold text-gf-muted">
        Tap a print to flip golden → today
      </p>

      <div className="mt-8 grid max-w-lg gap-3 text-center">
        {lines(must)}
        {lines(warns)}
        {okCount > 0 && must.length === 0 ? (
          <p className="gf-whisper">
            {okCount} {t(locale, "matched").toLowerCase()}.
          </p>
        ) : null}
      </div>

      <div className="mt-10 flex w-full max-w-md flex-col items-center gap-3">
        {hold ? (
          <>
            <Link
              href="/check"
              className="gf-cta flex h-14 w-full items-center justify-center rounded-full text-base font-semibold"
            >
              {t(locale, "recheck")}
            </Link>
            <button
              type="button"
              onClick={() => persist("HOLD")}
              className="text-sm font-semibold text-gf-hold"
            >
              {t(locale, "approveHold")}
            </button>
            <div className="w-full pt-2">
              <textarea
                id="override"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
                placeholder={t(locale, "overrideReason")}
                className="w-full resize-none bg-transparent text-center text-sm outline-none placeholder:text-gf-muted"
              />
              <button
                type="button"
                onClick={() => {
                  if (!reason.trim()) {
                    setNotice(t(locale, "overrideNeeded"));
                    return;
                  }
                  persist("CLEAR", reason.trim());
                }}
                className="mt-2 w-full text-sm font-semibold text-gf-gold-2"
              >
                {t(locale, "override")}
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => persist("CLEAR")}
            className="flex h-14 w-full items-center justify-center rounded-full bg-gf-clear text-base font-semibold text-white"
          >
            {t(locale, "approveClear")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setTraceOpen((value) => !value)}
          className="text-sm font-semibold text-gf-muted"
        >
          {t(locale, "toolTrace")}
        </button>
        {traceOpen ? (
          <p className="text-center text-sm leading-7 text-gf-muted">
            {result.toolTrace.join(" → ")}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            resetCaptures();
            router.push("/");
          }}
          className="text-sm font-semibold text-gf-muted"
        >
          {t(locale, "home")}
        </button>
      </div>
    </div>
  );
}
