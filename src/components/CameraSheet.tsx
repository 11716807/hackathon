"use client";

import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { compressImage } from "@/lib/image";
import type { Locale, SlotSpec } from "@/lib/types";

interface CameraSheetProps {
  open: boolean;
  slot: SlotSpec;
  locale: Locale;
  goldenSrc: string;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export function CameraSheet({
  open,
  slot,
  locale,
  goldenSrc,
  onClose,
  onCapture,
}: CameraSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) setError(t(locale, "cameraError"));
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, locale]);

  async function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas");
      ctx.drawImage(video, 0, 0);
      const raw = canvas.toDataURL("image/jpeg", 0.86);
      onCapture(await compressImage(raw));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onCapture(await compressImage(file));
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;
  const title = locale === "hi" ? slot.titleHi : slot.titleEn;
  const hint = locale === "hi" ? slot.hintHi : slot.hintEn;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#140f1c] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#d8c4ff] uppercase">
              {title}
            </p>
            <p className="mt-1 text-sm font-medium text-white">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white"
          >
            {t(locale, "cancel")}
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/20 bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-label={title}
          />
          <div className="pointer-events-none absolute inset-4 rounded-2xl border border-gf-gold/50" />
          <img
            src={goldenSrc}
            alt=""
            className="pointer-events-none absolute right-4 bottom-4 h-20 w-20 rounded-xl border border-white/30 object-cover opacity-70"
          />
        </div>

        {error ? (
          <p className="mt-3 text-sm text-gf-warn">{error}</p>
        ) : null}

        <div className="mt-4 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            {t(locale, "uploadInstead")}
          </button>
          <button
            type="button"
            onClick={snap}
            disabled={busy || Boolean(error)}
            className="gf-shutter h-20 w-20 rounded-full border-4 border-gf-gold bg-white disabled:opacity-40"
            aria-label={t(locale, "snap")}
          />
          <span className="w-16 font-mono text-xs font-semibold text-white">
            {t(locale, "snap")}
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0])}
        />
      </div>
    </div>
  );
}
