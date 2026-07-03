// FILE: apps/web/lib/price.ts - Updated for deployment
// Price calculation logic — single source of truth for frontend estimates.
// Backend recalculates independently; this is for live UI display only.

import type { PrintConfig } from "@/lib/types";
import storeConfig from "../store.config.json";

interface Pricing {
  bwPerPage: number;
  colorPerPage: number;
  duplexDiscountPercent: number;
  bulkThreshold: number;
  bulkBwPerPage: number;
  bulkColorPerPage: number;
}

const GLOBAL_PRICING: Pricing = {
  bwPerPage:             storeConfig.pricing.bwPerPage,
  colorPerPage:          storeConfig.pricing.colorPerPage,
  duplexDiscountPercent: storeConfig.pricing.duplexDiscountPercent,
  bulkThreshold:         100,
  bulkBwPerPage:         0.9,
  bulkColorPerPage:      4,
};

// The active shop's pricing (set when an order page loads its shop, via the
// "shopPricing" sessionStorage key). Falls back to the global defaults.
function getActivePricing(): Pricing {
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem("shopPricing");
      if (raw) return { ...GLOBAL_PRICING, ...JSON.parse(raw) };
    } catch {}
  }
  return GLOBAL_PRICING;
}

interface PriceLine {
  label: string;
  amount: number;
}

interface PriceResult {
  perPageCost: number;
  pageCount: number;
  subtotal: number;
  total: number;
  breakdown: PriceLine[];
}

/**
 * Parse a page range string like "all", "1-3", "1,3,5", "2-4,7"
 * and return the count of unique selected pages.
 * `totalPages` is the actual PDF page count for "all" resolution.
 */
export function countPagesInRange(pageRange: string, totalPages: number): number {
  if (!pageRange || pageRange.toLowerCase() === "all") return totalPages;

  const pages = new Set<number>();
  const parts = pageRange.split(",").map((s) => s.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let i = start; i <= end; i++) pages.add(i);
    } else {
      const p = parseInt(part, 10);
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
  }

  return pages.size || 1;
}

export function calculatePrice(config: PrintConfig, orderTotalPages: number = 0): PriceResult {
  const p = getActivePricing();
  const pageCount = countPagesInRange(config.pageRange, config.totalPages);

  const isBulk = orderTotalPages > p.bulkThreshold;
  const perPageCost = config.colour
    ? (isBulk ? p.bulkColorPerPage : p.colorPerPage)
    : (isBulk ? p.bulkBwPerPage : p.bwPerPage);

  const subtotal = perPageCost * pageCount * config.copies;

  const breakdown: PriceLine[] = [
    {
      label: `${pageCount} page${pageCount > 1 ? "s" : ""} × ${config.copies} cop${config.copies > 1 ? "ies" : "y"} × ${storeConfig.currencySymbol}${perPageCost}`,
      amount: subtotal,
    },
  ];

  // Duplex discount
  let total = subtotal;
  if (config.duplex && pageCount > 1) {
    const discount = Math.round(subtotal * (p.duplexDiscountPercent / 100));
    breakdown.push({ label: `Duplex discount (−${p.duplexDiscountPercent}%)`, amount: -discount });
    total -= discount;
  }

  return { perPageCost, pageCount, subtotal, total, breakdown };
}