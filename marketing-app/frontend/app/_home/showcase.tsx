"use client";

import { useState, useEffect, useRef } from "react";
import { Reveal, Counter, Chapter } from "./fx";

/* ───────────────────────────────────────────────────────────────────────────
   InvestorStory — the six-slide deck rebuilt as a scroll narrative with
   animated counters. Content unchanged.
   ─────────────────────────────────────────────────────────────────────────── */
type Metric = { counter?: { to: number; prefix?: string; suffix?: string }; v: string; l: string };
type Slide = {
  kicker: string;
  headline: string;
  body?: string;
  metrics?: Metric[];
  bullets?: string[];
};

const SLIDES: Slide[] = [
  {
    kicker: "The Market",
    headline: "A ₹4,000 Cr+ market still running on USB drives.",
    body: "India prints relentlessly — colleges, courts, offices, exam forms. The demand is enormous and almost entirely offline.",
    metrics: [
      { counter: { to: 4000, prefix: "₹", suffix: " Cr+" }, v: "₹4,000 Cr+", l: "Indian print-services market" },
      { counter: { to: 500, suffix: "M+" }, v: "500M+", l: "Print orders every year" },
      { counter: { to: 0, prefix: "~", suffix: "%" }, v: "~0%", l: "Currently digitised" },
    ],
  },
  {
    kicker: "The Problem",
    headline: "Every print is a queue, a USB, and a guessing game.",
    body: "Customers waste 30+ minutes per visit. Shop owners juggle shouted orders, wrong settings, and cash. It's friction on both sides.",
    bullets: [
      "Long queues & manual file transfer",
      "Verbal settings → costly reprints",
      "Opaque pricing, cash handling, no records",
    ],
  },
  {
    kicker: "The Wedge",
    headline: "One QR code turns any shop digital — instantly.",
    body: "Scan, upload, pay — all on the customer's phone. The shop gets a ready-to-print job in one click. No app to install, no hardware to buy.",
    bullets: [
      "Zero-download, works in any browser",
      "Auto-pricing + live preview kills errors",
      "Vendor dashboard: one-click print & track",
    ],
  },
  {
    kicker: "The Model",
    headline: "SaaS per shop + a slice of every print.",
    body: "A low monthly fee per shop plus a small per-order take. Margins compound as each shop's volume grows — and onboarding a shop costs us almost nothing.",
    metrics: [
      { counter: { to: 10000 }, v: "10,000", l: "Target shops across India" },
      { v: "₹1–2k", l: "Monthly recurring per shop" },
      { v: "Software", l: "margins, near-zero CAC via QR" },
    ],
  },
  {
    kicker: "Why Now",
    headline: "UPI made payments instant. We make printing instant.",
    body: "Smartphones, UPI and QR are now universal in India. The behaviour shift that powered fintech is the same one that makes Printable obvious — at exactly the right moment.",
    bullets: [
      "QR + UPI behaviour already mainstream",
      "Shops want digital, lack the tools",
      "First mover in an unbranded category",
    ],
  },
  {
    kicker: "The Ask",
    headline: "Back the team turning every print shop digital.",
    body: "We have a working product, live pilots, and a founding team of eight engineers. We're raising to build the sales engine and onboard shops city by city.",
    bullets: [
      "Live product + pilot traction",
      "Capital → sales team + shop onboarding",
      "Vision: the default print layer of India",
    ],
  },
];

export function InvestorStory() {
  return (
    <section id="market" className="sec sec--void deck-sec">
      {/* real founders-at-work footage behind the numbers (Mixkit free license) */}
      <video className="market-video" src="/market-hustle.mp4" autoPlay muted loop playsInline aria-hidden />
      <div className="market-veil" aria-hidden />
      <div className="wrap">
        <Chapter
          no="07"
          kicker="For Investors"
          title={<>The opportunity, <em>in six slides.</em></>}
          sub="Fragmented. Offline. Massive. Ready for its UPI moment."
          light
        />
        <div className="bento-grid">
          <Reveal variant="up" d={0} className="bento-item bento-item--large bento-market">
            <div className="bento-content">
              <span className="bento-kicker">The Market</span>
              <h3 className="bento-title">₹4,000 Cr+ Indian Market</h3>
              <p className="bento-desc">Fragmented, offline, and ready for its UPI moment.</p>
              <div className="bento-metrics">
                <div className="bento-stat">
                  <h4><Counter to={15} suffix="M+" /></h4>
                  <p>Students</p>
                </div>
                <div className="bento-stat">
                  <h4><Counter to={250} suffix="K+" /></h4>
                  <p>Print Shops</p>
                </div>
                <div className="bento-stat">
                  <h4><Counter to={40} suffix="M+" /></h4>
                  <p>Daily Pages</p>
                </div>
              </div>
            </div>
            <div className="bento-glow" />
          </Reveal>

          <Reveal variant="up" d={1} className="bento-item bento-saas">
            <div className="bento-content">
              <span className="bento-kicker">The Model</span>
              <h3 className="bento-title">Hardware-Free SaaS</h3>
              <p className="bento-desc">Zero capex. We don't sell printers; we upgrade them.</p>
              <ul className="bento-list">
                <li>✓ Plug-and-play setup</li>
                <li>✓ Subscription & transaction rev-share</li>
                <li>✓ Extremely low CAC via viral loops</li>
              </ul>
            </div>
            <div className="bento-glow" />
          </Reveal>

          <Reveal variant="up" d={2} className="bento-item bento-traction">
            <div className="bento-content">
              <span className="bento-kicker">Traction</span>
              <h3 className="bento-title">Live & Scaling</h3>
              <p className="bento-desc">Proven product-market fit with live campus pilots.</p>
              <div className="bento-metrics">
                <div className="bento-stat">
                  <h4><Counter to={10} suffix="K+" /></h4>
                  <p>Users</p>
                </div>
                <div className="bento-stat">
                  <h4><Counter to={500} suffix="K+" /></h4>
                  <p>Prints</p>
                </div>
              </div>
            </div>
            <div className="bento-glow" />
          </Reveal>

          <Reveal variant="up" d={1} className="bento-item bento-whynow">
            <div className="bento-content">
              <span className="bento-kicker">Why Now</span>
              <h3 className="bento-title">The WhatsApp Wedge</h3>
              <p className="bento-desc">
                UPI made India QR-native. And India&apos;s files already live on WhatsApp — our direct Meta Cloud API
                integration turns the country&apos;s biggest chat app into our ordering channel.
              </p>
              <ul className="bento-list">
                <li>✓ 500M+ Indians on WhatsApp — zero behaviour change</li>
                <li>✓ One number, every shop — infinitely scalable routing</li>
                <li>✓ QR + UPI + WhatsApp: all three rails, one product</li>
              </ul>
            </div>
            <div className="bento-glow" />
          </Reveal>

          <Reveal variant="up" d={2} className="bento-item bento-ask">
            <div className="bento-content">
              <span className="bento-kicker">The Ask</span>
              <h3 className="bento-title">Own the Print Layer of India</h3>
              <p className="bento-desc">
                Working product, live pilots, shipped infrastructure. We&apos;re raising to onboard shops city by
                city, scale WhatsApp automation, and build the sales engine.
              </p>
              <a className="bento-cta" href="mailto:darsh.dave999@gmail.com?subject=Investment%20—%20Printable%20Deck%20Request">
                Request the investor deck →
              </a>
            </div>
            <div className="bento-glow" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Screenshot Gallery — phone / desktop frames + lightbox
   ─────────────────────────────────────────────────────────────────────────── */
const CUSTOMER_SCREENS = [
  { src: "/screenshots/screen-01.png", step: 1,  label: "Home",              desc: "QR code scan entry point — customers land here after scanning the shop's QR code." },
  { src: "/screenshots/screen-02.png", step: 2,  label: "Select Files",      desc: "Choose files to print — from local storage, Google Drive, or photo library." },
  { src: "/screenshots/screen-03.png", step: 3,  label: "Media Sources",     desc: "Seamlessly pick from multiple sources: Drive, local files, or device library." },
  { src: "/screenshots/screen-04.png", step: 4,  label: "File Browser",      desc: "Internal file browser opens for quick document selection." },
  { src: "/screenshots/screen-05.png", step: 5,  label: "Uploaded Files",    desc: "Preview all uploaded files before proceeding — no surprises." },
  { src: "/screenshots/screen-06.png", step: 6,  label: "Document Preview",  desc: "Full page-by-page preview of the uploaded document." },
  { src: "/screenshots/screen-07.png", step: 7,  label: "Print Settings",    desc: "Choose B&W or Color, single/double-sided, and print orientation." },
  { src: "/screenshots/screen-08.png", step: 8,  label: "Copies & Options",  desc: "Fine-tune copy count, page range, and final print configuration." },
  { src: "/screenshots/screen-09.png", step: 9,  label: "Checkout",          desc: "Transparent price breakdown with UPI, card, and wallet payment options." },
  { src: "/screenshots/screen-10.png", step: 10, label: "Order History",     desc: "Confirmed order with unique tracking ID — monitor status anytime." },
];

const VENDOR_SCREENS = [
  { src: "/screenshots/screen-11.png", step: 1, label: "Dashboard Overview", desc: "Real-time analytics: total revenue, orders processed, and shop performance at a glance." },
  { src: "/screenshots/screen-12.png", step: 2, label: "Order History",      desc: "Complete log of all past orders — searchable and filterable by date or status." },
  { src: "/screenshots/screen-13.png", step: 3, label: "Print Queue",        desc: "Live queue of incoming jobs — see file details, settings, and trigger printing instantly." },
  { src: "/screenshots/screen-14.png", step: 4, label: "Final Overview",     desc: "Comprehensive summary view of shop operations, daily stats, and revenue trends." },
];

const ALL_SCREENS = [
  ...CUSTOMER_SCREENS.map((s) => ({ ...s, type: "Customer" as const })),
  ...VENDOR_SCREENS.map((s) => ({ ...s, type: "Vendor" as const })),
];

function PhoneFrame({ src, alt, onClick, step, label, desc, index }: {
  src: string; alt: string; onClick: () => void;
  step: number; label: string; desc: string; index: number;
}) {
  return (
    <Reveal variant="up" d={index % 5} className="glr-phone-col">
      <button className="glr-phone-btn" onClick={onClick} title={`View: ${label}`}>
        <div className="glr-phone-frame">
          <div className="glr-phone-notch" />
          <img src={src} alt={alt} className="glr-phone-img" loading="lazy" />
          <div className="glr-hover"><span>⤢</span></div>
        </div>
      </button>
      <div className="glr-caption">
        <span className="glr-badge">Step {step}</span>
        <strong className="glr-cap-label">{label}</strong>
        <p className="glr-cap-desc">{desc}</p>
      </div>
    </Reveal>
  );
}

function DesktopFrame({ src, alt, onClick, step, label, desc, index }: {
  src: string; alt: string; onClick: () => void;
  step: number; label: string; desc: string; index: number;
}) {
  return (
    <Reveal variant="up" d={index % 4} className="glr-desk-col">
      <button className="glr-desk-btn" onClick={onClick} title={`View: ${label}`}>
        <div className="glr-desk-frame">
          <div className="glr-desk-bar">
            <span /><span /><span />
            <div className="glr-desk-url">printable.in/vendor</div>
          </div>
          <img src={src} alt={alt} className="glr-desk-img" loading="lazy" />
          <div className="glr-hover"><span>⤢</span></div>
        </div>
      </button>
      <div className="glr-caption">
        <span className="glr-badge glr-badge--vendor">Screen {step}</span>
        <strong className="glr-cap-label">{label}</strong>
        <p className="glr-cap-desc">{desc}</p>
      </div>
    </Reveal>
  );
}

function Lightbox({ screens, activeIndex, onClose, onPrev, onNext }: {
  screens: typeof ALL_SCREENS; activeIndex: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, onPrev, onNext]);

  /* modal basics: lock page scroll (also stops Lenis, which drives native
     scroll), move focus in on open and back to the trigger on close */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  const s = screens[activeIndex];
  return (
    <div className="lb" onClick={onClose} role="dialog" aria-modal data-lenis-prevent>
      <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="lb-close" onClick={onClose} aria-label="Close">✕</button>
        <button className="lb-nav lb-nav--prev" onClick={onPrev} aria-label="Previous">‹</button>
        <img src={s.src} alt={s.label} className={`lb-img ${s.type === "Vendor" ? "lb-img--wide" : ""}`} />
        <button className="lb-nav lb-nav--next" onClick={onNext} aria-label="Next">›</button>
        <div className="lb-caption">
          <span className={`lb-type ${s.type === "Vendor" ? "lb-type--vendor" : ""}`}>
            {s.type === "Customer" ? "👤 Customer" : "🖨️ Vendor"}
          </span>
          <span>{s.label} — {s.desc}</span>
          <span className="lb-counter">{activeIndex + 1} / {screens.length}</span>
        </div>
      </div>
    </div>
  );
}

export function GallerySection() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (idx: number) => { setActiveIndex(idx); setOpen(true); };
  const prev = () => setActiveIndex((i) => (i - 1 + ALL_SCREENS.length) % ALL_SCREENS.length);
  const next = () => setActiveIndex((i) => (i + 1) % ALL_SCREENS.length);

  return (
    <>
      <Reveal>
        <div className="glr-header">
          <div className="glr-pill">📱 Customer Journey</div>
          <h3 className="glr-title">10 Screens · From QR Scan to Order Placed</h3>
          <p className="glr-sub">Every step a customer takes — scan, upload, configure, pay, and track.</p>
        </div>
      </Reveal>
      <div className="glr-phone-grid">
        {CUSTOMER_SCREENS.map((s, i) => (
          <PhoneFrame key={s.src} {...s} alt={s.label} index={i} onClick={() => openLightbox(i)} />
        ))}
      </div>

      <div className="glr-divider" />

      <Reveal>
        <div className="glr-header">
          <div className="glr-pill glr-pill--vendor">🖨️ Vendor Dashboard</div>
          <h3 className="glr-title">4 Screens · Full Shop Management</h3>
          <p className="glr-sub">Everything the print partner needs — analytics, queue, history, and overview.</p>
        </div>
      </Reveal>
      <div className="glr-desk-grid">
        {VENDOR_SCREENS.map((s, i) => (
          <DesktopFrame key={s.src} {...s} alt={s.label} index={i} onClick={() => openLightbox(CUSTOMER_SCREENS.length + i)} />
        ))}
      </div>

      {open && (
        <Lightbox
          screens={ALL_SCREENS}
          activeIndex={activeIndex}
          onClose={() => setOpen(false)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}
