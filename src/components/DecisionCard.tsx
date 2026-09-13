import { t } from "@/lib/i18n";
import type { GateDecision, Locale } from "@/lib/types";

interface DecisionCardProps {
  decision: GateDecision;
  summary: string;
  locale: Locale;
}

export function DecisionCard({ decision, summary, locale }: DecisionCardProps) {
  const hold = decision === "HOLD";
  return (
    <section
      data-testid="decision-card"
      className={`rounded-3xl border px-5 py-6 ${
        hold
          ? "border-gf-hold/50 bg-gf-hold/10"
          : "border-gf-clear/50 bg-gf-clear/10"
      }`}
    >
      <p
        className={`font-mono text-xs tracking-[0.28em] uppercase ${
          hold ? "text-gf-hold" : "text-gf-clear"
        }`}
      >
        {hold ? t(locale, "hold") : t(locale, "clear")}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        {hold ? t(locale, "notClear") : t(locale, "clearToRun")}
      </h2>
      <p className="mt-3 text-base leading-7 text-gf-text">{summary}</p>
    </section>
  );
}
