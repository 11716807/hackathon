"use client";

import { useState } from "react";
import { ALBUMS } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const LABELS: Record<string, { en: string; hi: string }> = {
  "desk-charge": { en: "Desk kit", hi: "डेस्क किट" },
  "line3-a17": { en: "Packaging line", hi: "पैकेजिंग लाइन" },
  "cell2-brd440": { en: "Electronics cell", hi: "इलेक्ट्रॉनिक्स सेल" },
};

export function KitPicker() {
  const { locale, albumId, setAlbumId, albums, addLine } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [templateId, setTemplateId] = useState("line3-a17");

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
        {albums.map((item) => {
          const on = item.id === albumId;
          const label = LABELS[item.id]?.[locale] ?? item.lineName;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setAlbumId(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                on
                  ? "bg-[#5b21b6] text-white"
                  : "bg-white/70 text-gf-gold-2 hover:bg-white"
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full px-4 py-2 text-sm font-semibold text-gf-gold-2"
        >
          + {t(locale, "newLine")}
        </button>
      </div>

      {open ? (
        <div className="grid max-w-md gap-2 text-left">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t(locale, "lineName")}
            className="rounded-2xl bg-white/80 px-4 py-3 text-sm outline-none"
          />
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            placeholder="SKU"
            className="rounded-2xl bg-white/80 px-4 py-3 text-sm outline-none"
          />
          <label className="text-xs font-semibold text-gf-muted">
            {t(locale, "copyFrom")}
          </label>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className="rounded-2xl bg-white/80 px-4 py-3 text-sm outline-none"
          >
            <option value="">{t(locale, "copyBlank")}</option>
            {ALBUMS.map((item) => (
              <option key={item.id} value={item.id}>
                {LABELS[item.id]?.[locale] ?? item.lineName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              addLine({
                name: name || "New packaging line",
                sku,
                templateId: templateId || undefined,
              });
              setName("");
              setSku("");
              setOpen(false);
            }}
            className="gf-cta h-12 rounded-full text-sm font-semibold"
          >
            {t(locale, "createLine")}
          </button>
          <p className="text-xs text-gf-muted">{t(locale, "newLineHint")}</p>
        </div>
      ) : null}
    </div>
  );
}
