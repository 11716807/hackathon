"use client";

import { motion } from "motion/react";
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
    <motion.section
      data-testid="decision-card"
      initial={{ opacity: 0, scale: 0.86, rotate: hold ? -6 : 4 }}
      animate={{ opacity: 1, scale: 1, rotate: hold ? -3 : 2 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="text-center"
    >
      <p
        className={`gf-stamp text-[5.5rem] md:text-[8rem] ${
          hold ? "text-gf-hold" : "text-gf-clear"
        }`}
      >
        {hold ? t(locale, "hold") : t(locale, "clear")}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-4xl">
        {hold ? t(locale, "notClear") : t(locale, "clearToRun")}
      </h2>
      <p className="gf-whisper mx-auto mt-4 max-w-lg">{summary}</p>
    </motion.section>
  );
}
