"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, album, notice, setNotice } = useSession();
  const pathname = usePathname();
  const showNav = pathname !== "/";

  return (
    <div className="gf-app">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <Link href="/" className="block">
              <p className="font-mono text-xs font-bold tracking-[0.22em] text-gf-gold uppercase">
                {t(locale, "brand")}
              </p>
              <p className="mt-1 text-sm font-medium text-gf-muted">{t(locale, "plant")}</p>
            </Link>
            {showNav ? (
              <p className="mt-2 font-mono text-xs font-semibold text-gf-gold-2">
                {album.lineName} · {album.sku}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="rounded-full border border-gf-line bg-white px-3 py-1.5 font-mono text-xs font-semibold text-gf-gold-2"
              aria-label="Toggle language"
            >
              {locale === "en" ? "EN · हि" : "हि · EN"}
            </button>
          </div>
        </header>

        {notice ? (
          <div className="mb-4 rounded-2xl border border-gf-gold/40 bg-white px-4 py-3 text-sm font-medium text-gf-gold-2">
            <div className="flex items-start justify-between gap-3">
              <p>{notice}</p>
              <button
                type="button"
                className="text-gf-muted"
                onClick={() => setNotice(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ) : null}

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
