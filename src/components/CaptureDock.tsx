"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function CaptureDock({ onSnap }: { onSnap: () => void }) {
  const { locale } = useSession();

  return (
    <nav className="gf-dock">
      <Link href="/" className="text-center text-sm text-white/70">
        {t(locale, "home")}
      </Link>
      <button
        type="button"
        onClick={onSnap}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-gf-gold-2 shadow-lg"
        aria-label={t(locale, "takePhoto")}
      >
        <span className="h-11 w-11 rounded-full border-[3px] border-gf-gold" />
      </button>
      <Link href="/history" className="text-center text-sm text-white/70">
        {t(locale, "history")}
      </Link>
    </nav>
  );
}
