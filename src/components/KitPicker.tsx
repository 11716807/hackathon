"use client";

import Link from "next/link";
import { useState } from "react";
import { ALBUMS } from "@/lib/catalog";
import { t } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const LABELS: Record<string, { en: string; hi: string }> = {
  "line3-a17": { en: "Line 3 · Packaging", hi: "लाइन 3 · पैकेजिंग" },
  "cell2-brd440": { en: "Cell 2 · Electronics", hi: "सेल 2 · इलेक्ट्रॉनिक्स" },
};

type SheetMode = "create" | "edit";

export function KitPicker() {
  const {
    locale,
    albumId,
    setAlbumId,
    albums,
    addLine,
    updateLine,
    deleteLine,
    isCustomLine,
    lineIsTaught,
  } = useSession();
  const [sheet, setSheet] = useState<SheetMode | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [templateId, setTemplateId] = useState("line3-a17");
  const [busy, setBusy] = useState(false);

  const editingTaught = editId ? lineIsTaught(editId) : false;

  function closeSheet() {
    setSheet(null);
    setEditId(null);
    setName("");
    setSku("");
    setTemplateId("line3-a17");
    setBusy(false);
  }

  function openCreate() {
    setEditId(null);
    setName("");
    setSku("");
    setTemplateId("line3-a17");
    setSheet("create");
  }

  function openEdit(id: string) {
    const current = albums.find((item) => item.id === id);
    setEditId(id);
    setName(current?.lineName ?? "");
    setSku(current?.sku ?? "");
    setSheet("edit");
  }

  return (
    <div className="grid gap-3">
      <p className="text-center text-xs font-semibold tracking-[0.12em] text-gf-muted uppercase lg:text-left">
        {t(locale, "pickLineHint")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
        {albums.map((item) => {
          const on = item.id === albumId;
          const label = LABELS[item.id]?.[locale] ?? item.lineName;
          return (
            <div
              key={item.id}
              className={`inline-flex items-center rounded-full transition ${
                on
                  ? "bg-[#5b21b6] text-white"
                  : "bg-white/70 text-gf-gold-2 hover:bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => setAlbumId(item.id)}
                className="rounded-full py-2 pl-4 pr-2 text-sm font-semibold"
              >
                {label}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAlbumId(item.id);
                  openEdit(item.id);
                }}
                className={`mr-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  on
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-[#5b21b6]/10 text-gf-gold-2 hover:bg-[#5b21b6]/15"
                }`}
                aria-label={t(locale, "editLine")}
                title={t(locale, "editLine")}
              >
                <span aria-hidden>✎</span>
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full border border-dashed border-[#5b21b6]/40 px-4 py-2 text-sm font-semibold text-gf-gold-2"
        >
          + {t(locale, "newLine")}
        </button>
      </div>

      {sheet ? (
        <div
          className="gf-sheet-backdrop"
          role="presentation"
          onClick={closeSheet}
        >
          <div
            className="gf-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="line-sheet-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  id="line-sheet-title"
                  className="text-sm font-semibold tracking-[0.14em] text-gf-gold uppercase"
                >
                  {sheet === "create"
                    ? t(locale, "newLine")
                    : t(locale, "editLine")}
                </p>
                <p className="mt-1 text-sm text-gf-muted">
                  {sheet === "create"
                    ? t(locale, "newLineHint")
                    : t(locale, "editLineHint")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="text-sm font-semibold text-gf-gold-2"
              >
                {t(locale, "cancel")}
              </button>
            </div>

            <label className="mt-5 grid gap-1">
              <span className="text-xs font-semibold tracking-[0.12em] text-gf-muted uppercase">
                {t(locale, "lineName")}
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t(locale, "lineName")}
                className="rounded-2xl bg-white/90 px-4 py-3 text-sm outline-none ring-1 ring-black/5"
              />
            </label>

            <label className="mt-3 grid gap-1">
              <span className="text-xs font-semibold tracking-[0.12em] text-gf-muted uppercase">
                {t(locale, "sku")}
              </span>
              <input
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                placeholder={t(locale, "skuPlaceholder")}
                className="rounded-2xl bg-white/90 px-4 py-3 text-sm outline-none ring-1 ring-black/5"
              />
              <span className="text-xs text-gf-muted">{t(locale, "skuHint")}</span>
            </label>

            {sheet === "create" ? (
              <label className="mt-3 grid gap-1">
                <span className="text-xs font-semibold text-gf-muted">
                  {t(locale, "copyFrom")}
                </span>
                <select
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  className="rounded-2xl bg-white/90 px-4 py-3 text-sm outline-none ring-1 ring-black/5"
                >
                  <option value="">{t(locale, "copyBlank")}</option>
                  {ALBUMS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {LABELS[item.id]?.[locale] ?? item.lineName}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-left ring-1 ring-black/5">
                <p className="text-xs font-semibold tracking-[0.12em] text-gf-muted uppercase">
                  {t(locale, "goldens")}
                </p>
                <p className="mt-1 text-sm text-gf-text">
                  {editingTaught
                    ? t(locale, "taughtReady")
                    : t(locale, "taughtMissing")}
                </p>
                <div className="mt-3">
                  {editingTaught ? (
                    <Link
                      href="/goldens/teach"
                      onClick={closeSheet}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-gf-gold-2"
                    >
                      <span aria-hidden>✎</span>
                      {t(locale, "editGoldens")}
                    </Link>
                  ) : (
                    <Link
                      href="/goldens/teach"
                      onClick={closeSheet}
                      className="gf-cta inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
                    >
                      {t(locale, "teachGoldens")}
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2">
              {sheet === "create" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    addLine({
                      name: name || "New packaging line",
                      sku,
                      templateId: templateId || undefined,
                    });
                    closeSheet();
                  }}
                  className="gf-cta h-12 rounded-full text-sm font-semibold"
                >
                  {t(locale, "createLine")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy || !editId}
                    onClick={() => {
                      if (!editId) return;
                      setBusy(true);
                      updateLine({ id: editId, name, sku });
                      closeSheet();
                    }}
                    className="gf-cta h-12 rounded-full text-sm font-semibold"
                  >
                    {t(locale, "saveLine")}
                  </button>
                  {editId && isCustomLine(editId) ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!editId) return;
                        const ok = window.confirm(t(locale, "deleteLineConfirm"));
                        if (!ok) return;
                        setBusy(true);
                        void deleteLine(editId).then(closeSheet);
                      }}
                      className="h-12 rounded-full text-sm font-semibold text-gf-hold"
                    >
                      {t(locale, "deleteLine")}
                    </button>
                  ) : (
                    <p className="text-center text-xs text-gf-muted">
                      {t(locale, "catalogLineNote")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
