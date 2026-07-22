"use client";

import type { ReactNode } from "react";

/* ───────────────────────────────────────────────────────────────────────────
   Icon — single monoline SVG set (24×24, stroke-based) replacing emojis so
   every platform renders the same crisp marks. Colour comes from CSS
   `currentColor`, so existing chip tints keep working.
   ─────────────────────────────────────────────────────────────────────────── */

const P = (d: string, key?: string) => <path key={key ?? d.slice(0, 12)} d={d} />;

const ICONS: Record<string, ReactNode> = {
  clock: [<circle key="c" cx="12" cy="12" r="9" />, P("M12 7v5l3.2 2")],
  folder: [P("M3 7a2 2 0 0 1 2-2h4l2 2.4h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z")],
  message: [P("M21 11.6a8.6 8.6 0 0 1-8.6 8.6H4l1.9-2.9A8.6 8.6 0 1 1 21 11.6z")],
  banknote: [<rect key="r" x="2.5" y="6" width="19" height="12" rx="2" />, <circle key="c" cx="12" cy="12" r="2.6" />, P("M6 9.5v.01M18 14.5v.01")],
  lock: [<rect key="r" x="5" y="11" width="14" height="9" rx="2" />, P("M8 11V8a4 4 0 0 1 8 0v3")],
  qr: [
    <rect key="a" x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />,
    <rect key="b" x="14" y="3.5" width="6.5" height="6.5" rx="1" />,
    <rect key="c" x="3.5" y="14" width="6.5" height="6.5" rx="1" />,
    P("M14 14h3v3h-3zM20.5 14v.01M14 20.5h.01M17.5 17.5l3 3"),
  ],
  eye: [P("M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"), <circle key="c" cx="12" cy="12" r="3" />],
  eyeoff: [P("M3 3l18 18"), P("M10.7 5.2A10 10 0 0 1 12 5.1c6 0 9.5 6.9 9.5 6.9a17.6 17.6 0 0 1-2.9 3.8M6.7 6.7C3.9 8.6 2.5 12 2.5 12S6 18.9 12 18.9a10 10 0 0 0 4.3-1"), P("M9.9 9.9a3 3 0 0 0 4.2 4.2")],
  sliders: [P("M4 7h9M17 7h3M4 17h3M11 17h9"), <circle key="a" cx="15" cy="7" r="2.2" />, <circle key="b" cx="9" cy="17" r="2.2" />],
  rupee: [P("M7 4h10M7 8.5h10M8 4c5.5 0 7.5 1.6 7.5 4.5S13.5 13 8 13l7.5 7")],
  bell: [P("M6 9.5a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4s2-1.5 2-6.5"), P("M10.4 20a2 2 0 0 0 3.2 0")],
  monitor: [<rect key="r" x="2.5" y="4" width="19" height="13" rx="2" />, P("M8.5 21h7M12 17v4")],
  card: [<rect key="r" x="2.5" y="5" width="19" height="14" rx="2" />, P("M2.5 10h19M6.5 15h4")],
  receipt: [P("M5.5 3h13v18l-2.2-1.4-2.2 1.4-2.1-1.4-2.1 1.4-2.2-1.4L5.5 21z"), P("M9 8.5h6M9 12.5h6")],
  printer: [P("M7 8V3.5h10V8"), <rect key="r" x="3.5" y="8" width="17" height="9" rx="2" />, P("M7 14h10v6.5H7z"), P("M17.2 11.2h.01")],
  check: [P("M4.5 12.5l5 5L19.5 6.5")],
  radio: [<circle key="c" cx="12" cy="12" r="2" />, P("M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4"), P("M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5")],
  cloud: [P("M17.5 18.5a4.5 4.5 0 0 0 .4-8.98 6 6 0 0 0-11.7 1.6A4 4 0 0 0 6.5 18.5z")],
  sparkles: [P("M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"), P("M18.8 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z")],
  download: [P("M12 4v10M8 10.5l4 4 4-4M4.5 19.5h15")],
  sign: [P("M12 21.5v-7.5"), P("M5 4.5h11.5l3 2.75-3 2.75H5z")],
  coffee: [P("M5 9.5h11V15a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"), P("M16 10.5h1.8a2.5 2.5 0 0 1 0 5H16"), P("M8.5 5.5c0-1 .9-1 .9-2M12.3 5.5c0-1 .9-1 .9-2")],
  camera: [<rect key="r" x="2.5" y="7" width="19" height="13" rx="2" />, <circle key="c" cx="12" cy="13.2" r="3.6" />, P("M7.5 7l1.6-3h5.8L16.5 7")],
  file: [P("M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5z"), P("M14 2.5v5h5M9 13.5h6M9 17h6")],
  zap: [P("M13 2.5L4.5 14H11l-1.2 7.5L18.5 10H12z")],
  landmark: [P("M3 21.5h18M4.5 18h15M6.5 18v-7.5M10.2 18v-7.5M13.8 18v-7.5M17.5 18v-7.5"), P("M3.5 8L12 3l8.5 5z")],
  refresh: [P("M20.5 12a8.5 8.5 0 1 1-2.5-6"), P("M20.5 3.5V9H15")],
  smartphone: [<rect key="r" x="7" y="2.5" width="10" height="19" rx="2.4" />, P("M10.8 18h2.4")],
  eraser: [P("M19.5 20.5H8.5l-4.7-4.7a1.8 1.8 0 0 1 0-2.6l8.5-8.5a1.8 1.8 0 0 1 2.6 0l4.4 4.4a1.8 1.8 0 0 1 0 2.6l-6.8 6.8"), P("M7.2 11.6l5.2 5.2")],
  wind: [P("M4 8.5h9.5a2.8 2.8 0 1 0-2.8-2.8"), P("M4 12.5h13.7a2.8 2.8 0 1 1-2.8 2.8"), P("M4 16.5h6")],
  contrast: [<circle key="c" cx="12" cy="12" r="8.7" />, P("M12 3.3v17.4"), <path key="f" d="M12 3.3a8.7 8.7 0 0 1 0 17.4z" fill="currentColor" stroke="none" />],
  droplet: [P("M12 3.2s6.2 6.6 6.2 10.9a6.2 6.2 0 0 1-12.4 0C5.8 9.8 12 3.2 12 3.2z")],
  package: [P("M21 8l-9-4.8L3 8v8.5l9 4.8 9-4.8z"), P("M3 8l9 4.8L21 8M12 12.8v8.5")],
  copy: [<rect key="r" x="9" y="9" width="11.5" height="11.5" rx="2" />, P("M5 14.5V5a2 2 0 0 1 2-2h9.5")],
  chevron: [P("M6 9.5l6 6 6-6")],
  timer: [<circle key="c" cx="12" cy="13.5" r="7.8" />, P("M12 10v4M9.5 2.5h5")],
  whatsapp: [P("M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3z"), P("M8.7 9c.3 3 3.3 5.9 6.3 6.3l1.5-1.5-2.2-1.2-1 .6a5.6 5.6 0 0 1-2.5-2.5l.6-1L10.2 7.5z")],
  shield: [P("M12 2.8l7.5 3v6c0 4.8-3.2 8.3-7.5 9.7-4.3-1.4-7.5-4.9-7.5-9.7v-6z"), P("M8.8 12l2.2 2.2 4.2-4.2")],
};

export function Icon({
  name,
  size = 22,
  strokeWidth = 2,
  className = "",
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const glyph = ICONS[name];
  if (!glyph) return null;
  return (
    <svg
      className={`icn ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {glyph}
    </svg>
  );
}
