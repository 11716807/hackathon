import { requireAlbum } from "./catalog";
import type { ImpactEstimate } from "./types";

export function estimateImpact(albumOrId: string | { holdMinutes: number; hourlyOverheadInr: number; unitMarginInr: number; scrapUnitsIfEscape: number; recallReserveInr: number }): ImpactEstimate {
  const album =
    typeof albumOrId === "string" ? requireAlbum(albumOrId) : albumOrId;
  const holdCostInr = Math.round(
    (album.holdMinutes / 60) * album.hourlyOverheadInr,
  );
  const escapeCostInr =
    album.scrapUnitsIfEscape * album.unitMarginInr + album.recallReserveInr;

  return {
    holdMinutes: album.holdMinutes,
    holdCostInr,
    escapeCostInr,
    currency: "INR",
  };
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
