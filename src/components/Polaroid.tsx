"use client";

import type { ReactNode } from "react";

interface PolaroidProps {
  src: string;
  caption?: string;
  faded?: boolean;
  stamp?: string;
  stampTone?: "hold" | "clear" | "ok";
  children?: ReactNode;
  className?: string;
}

export function Polaroid({
  src,
  caption,
  faded,
  stamp,
  stampTone = "ok",
  children,
  className = "",
}: PolaroidProps) {
  const tone =
    stampTone === "hold"
      ? "text-gf-hold"
      : stampTone === "clear"
        ? "text-gf-clear"
        : "text-gf-gold-2";

  return (
    <figure className={`gf-print relative ${className}`}>
      <img
        src={src}
        alt=""
        className={faded ? "opacity-45" : ""}
      />
      {stamp ? (
        <span
          className={`gf-stamp absolute top-3 left-3 rotate-[-8deg] text-2xl ${tone}`}
        >
          {stamp}
        </span>
      ) : null}
      {children}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
