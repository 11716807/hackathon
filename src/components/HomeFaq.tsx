"use client";

import { useState } from "react";
import { t, type CopyKey } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const ITEMS: { id: string; question: CopyKey; answer?: CopyKey; bullets?: CopyKey[] }[] =
  [
    {
      id: "stop",
      question: "faqStopQ",
      bullets: ["solvesSku", "solvesGuard", "solvesHopper", "solvesPiece"],
    },
    {
      id: "theme",
      question: "faqThemeQ",
      answer: "faqThemeA",
    },
    {
      id: "who",
      question: "faqWhoQ",
      answer: "faqWhoA",
    },
  ];

export function HomeFaq({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState("stop");

  return (
    <section className="gf-qa">
      <p className="text-center text-xs font-semibold tracking-[0.16em] text-gf-gold uppercase">
        {t(locale, "faqTitle")}
      </p>
      <div className="mt-4 overflow-hidden rounded-[1.7rem] bg-white/75">
        {ITEMS.map((item, index) => {
          const expanded = open === item.id;
          return (
            <div
              key={item.id}
              className={index === 0 ? "" : "border-t border-[#5b21b6]/10"}
            >
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? "" : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-base font-semibold tracking-tight text-gf-text">
                  {t(locale, item.question)}
                </span>
                <span
                  className="shrink-0 text-lg font-semibold text-gf-gold-2"
                  aria-hidden
                >
                  {expanded ? "–" : "+"}
                </span>
              </button>
              {expanded ? (
                <div className="px-5 pb-5 text-sm leading-6 text-gf-muted">
                  {item.answer ? <p>{t(locale, item.answer)}</p> : null}
                  {item.bullets ? (
                    <ul className="grid gap-1.5">
                      {item.bullets.map((key) => (
                        <li key={key} className="flex gap-2.5">
                          <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-gf-hold" />
                          <span>{t(locale, key)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
