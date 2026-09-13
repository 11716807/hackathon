"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DecisionCard } from "@/components/DecisionCard";
import { t } from "@/lib/i18n";
import { formatInr } from "@/lib/impact";
import { useSession } from "@/lib/session";
import type { Finding, Severity } from "@/lib/types";

function tone(severity: Severity): string {
  if (severity === "must_fix" || severity === "retake") return "text-gf-hold";
  if (severity === "warn") return "text-gf-warn";
  return "text-gf-clear";
}

function FindingList({
  title,
  items,
}: {
  title: string;
  items: Finding[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <p className="gf-label mb-2">
        {title}
      </p>
      <div className="grid gap-2">
        {items.map((item) => (
          <article
            key={`${item.slotId}-${item.code}`}
            className="rounded-2xl border border-gf-line bg-gf-card px-4 py-3"
          >
            <p className={`text-sm font-semibold ${tone(item.severity)}`}>
              {item.title}
            </p>
            <p className="mt-1 text-sm leading-6 text-gf-muted">{item.detail}</p>
            <p className="mt-2 font-mono text-xs font-medium text-gf-gold">
              SOP · {item.sopCite}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ResultScreen() {
  const router = useRouter();
  const {
    locale,
    role,
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

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-gf-muted">No gate yet.</p>
        <Link href="/check" className="font-semibold text-gf-gold">
          {t(locale, "startCheck")}
        </Link>
      </div>
    );
  }

  const must = result.findings.filter(
    (item) => item.severity === "must_fix" || item.severity === "retake",
  );
  const warns = result.findings.filter((item) => item.severity === "warn");
  const ok = result.findings.filter((item) => item.severity === "ok");
  const compareSlots = album.slots.filter((slot) => captures[slot.id]);

  function persist(decision: "HOLD" | "CLEAR", overrideReason?: string) {
    logGate({
      albumId: album.id,
      sku: album.sku,
      lineName: album.lineName,
      decision,
      actor: role,
      summary: overrideReason
        ? `Override: ${overrideReason}`
        : result!.summary,
      overrideReason,
      findingCodes: result!.findings.map((item) => item.code),
    });
    setNotice(t(locale, "logged"));
    router.push("/history");
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <DecisionCard
        decision={result.decision}
        summary={result.summary}
        locale={locale}
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-gf-line bg-gf-card px-3 py-3">
          <p className="gf-label">
            {t(locale, "holdCost")}
          </p>
          <p className="mt-1 text-lg font-semibold text-gf-text">
            {formatInr(result.impact.holdCostInr)}
          </p>
          <p className="text-sm font-medium text-gf-muted">
            {result.impact.holdMinutes} {t(locale, "minutes")}
          </p>
        </div>
        <div className="rounded-2xl border border-gf-line bg-gf-card px-3 py-3">
          <p className="gf-label">
            {t(locale, "escapeCost")}
          </p>
          <p className="mt-1 text-lg font-semibold text-gf-text">
            {formatInr(result.impact.escapeCostInr)}
          </p>
          <p className="text-sm font-medium text-gf-muted">recall + scrap</p>
        </div>
      </div>

      <section>
        <p className="gf-label mb-2">
          Golden · today
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {compareSlots.map((slot) => (
            <div key={slot.id} className="w-36 shrink-0">
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gf-line">
                <img
                  src={goldenSrc(slot.id)}
                  alt=""
                  className="aspect-square object-cover"
                />
                <img
                  src={captures[slot.id]?.dataUrl}
                  alt=""
                  className="aspect-square object-cover"
                />
              </div>
              <p className="mt-1 text-center text-xs font-medium text-gf-muted">
                {locale === "hi" ? slot.titleHi : slot.titleEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      <FindingList title={t(locale, "mustFix")} items={must} />
      <FindingList title={t(locale, "warnings")} items={warns} />
      <FindingList title={t(locale, "matched")} items={ok} />

      <button
        type="button"
        onClick={() => setTraceOpen((value) => !value)}
        className="text-left text-sm font-semibold text-gf-gold"
      >
        {t(locale, "toolTrace")}
      </button>
      {traceOpen ? (
        <ol className="rounded-2xl border border-gf-line bg-white px-4 py-3 font-mono text-sm leading-7 text-gf-text">
          {result.toolTrace.map((step, index) => (
            <li key={step}>
              {index + 1}. {step}
            </li>
          ))}
          <li>
            Engine {result.engine}
            {result.model ? ` · ${result.model}` : ""}
          </li>
        </ol>
      ) : null}

      {result.decision === "HOLD" ? (
        <>
          <Link
            href="/check"
            className="gf-cta flex h-14 items-center justify-center rounded-2xl text-base font-semibold"
          >
            {t(locale, "recheck")}
          </Link>
          <button
            type="button"
            onClick={() => persist("HOLD")}
            className="h-12 rounded-2xl border border-gf-hold/40 text-sm text-gf-hold"
          >
            {t(locale, "approveHold")}
          </button>
          {role === "supervisor" ? (
            <div className="rounded-2xl border border-gf-line bg-gf-card p-4">
              <label className="text-sm font-semibold text-gf-text" htmlFor="override">
                {t(locale, "overrideReason")}
              </label>
              <textarea
                id="override"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={2}
                className="mt-2 w-full rounded-xl border border-gf-line bg-gf-bg px-3 py-2 text-sm outline-none"
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
                className="mt-3 w-full text-sm font-semibold text-gf-gold"
              >
                {t(locale, "override")}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={() => persist("CLEAR")}
          className="flex h-14 items-center justify-center rounded-2xl bg-gf-clear text-base font-semibold text-gf-ink"
        >
          {t(locale, "approveClear")}
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          resetCaptures();
          router.push("/");
        }}
        className="text-center text-sm font-semibold text-gf-muted"
      >
        {t(locale, "home")}
      </button>
    </div>
  );
}
