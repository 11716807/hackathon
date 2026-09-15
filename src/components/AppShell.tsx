"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PageEnter } from "@/components/PageEnter";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, notice, setNotice, layoutMode, setLayoutMode } =
    useSession();

  return (
    <div className={`gf-app gf-app-${layoutMode}`}>
      <div className="gf-shell">
        <div className="gf-device">
          <div className="gf-notch" />
          <div className="gf-canvas flex min-h-dvh flex-col px-5 pb-6 pt-5 md:px-8 md:pt-8">
            <header className="mb-4 flex items-center justify-between gap-3">
              <Link href="/" className="font-semibold tracking-tight text-gf-gold-2">
                {t(locale, "brand")}
              </Link>
              <div className="flex shrink-0 items-center gap-2.5 text-[13px] font-semibold text-gf-muted sm:gap-4 sm:text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setLayoutMode(layoutMode === "phone" ? "auto" : "phone")
                  }
                  className={layoutMode === "phone" ? "text-gf-gold-2" : ""}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLayoutMode(layoutMode === "laptop" ? "auto" : "laptop")
                  }
                  className={layoutMode === "laptop" ? "text-gf-gold-2" : ""}
                >
                  Laptop
                </button>
                <button
                  type="button"
                  onClick={() => setLocale(locale === "en" ? "hi" : "en")}
                  aria-label="Toggle language"
                >
                  {locale === "en" ? "हि" : "EN"}
                </button>
              </div>
            </header>

            {notice ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 text-left text-sm font-semibold text-gf-gold-2"
                onClick={() => setNotice(null)}
              >
                {notice}
              </motion.button>
            ) : null}

            <PageEnter>{children}</PageEnter>
          </div>
        </div>
      </div>
    </div>
  );
}
