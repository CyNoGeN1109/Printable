"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from "react";

/* ───────────────────────────────────────────────────────────────────────────
   useInView — returns [ref, visible] once the element enters the viewport
   ─────────────────────────────────────────────────────────────────────────── */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

/* ───────────────────────────────────────────────────────────────────────────
   Reveal — scroll-triggered entrance. Variants: up (default), left, right,
   scale, blur. Delay steps of 90ms via d={1..6}.
   ─────────────────────────────────────────────────────────────────────────── */
export function Reveal({
  children,
  variant = "up",
  d = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  variant?: "up" | "left" | "right" | "scale" | "blur";
  d?: number;
  className?: string;
  as?: "div" | "span" | "section" | "li";
}) {
  const [ref, visible] = useInView<HTMLDivElement>(0.15);
  return (
    <Tag
      ref={ref as never}
      className={`fx-reveal fx-reveal--${variant} ${visible ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${d * 90}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Counter — animates a number from 0 when scrolled into view.
   Keeps prefix/suffix so "₹4,000 Cr+" style values read identically.
   ─────────────────────────────────────────────────────────────────────────── */
export function Counter({
  to,
  prefix = "",
  suffix = "",
  duration = 1600,
  decimals = 0,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [ref, visible] = useInView<HTMLSpanElement>(0.4);
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, to, duration]);

  const formatted = val.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span ref={ref} className="fx-counter">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   ScrollProgress — thin gradient bar under the nav showing page progress
   ─────────────────────────────────────────────────────────────────────────── */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const fn = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        el.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
      });
    };
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => {
      window.removeEventListener("scroll", fn);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="fx-progress" aria-hidden />;
}

/* ───────────────────────────────────────────────────────────────────────────
   Marquee — infinite horizontal ticker (content duplicated for a seamless loop)
   ─────────────────────────────────────────────────────────────────────────── */
export function Marquee({
  items,
  reverse = false,
}: {
  items: string[];
  reverse?: boolean;
}) {
  const row = (key: string, hidden: boolean) => (
    <div className="fx-marquee-row" aria-hidden={hidden} key={key}>
      {items.map((it, i) => (
        <span className="fx-marquee-item" key={i}>
          {it}
          <span className="fx-marquee-dot">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`fx-marquee ${reverse ? "fx-marquee--reverse" : ""}`}>
      <div className="fx-marquee-track">
        {row("a", false)}
        {row("b", true)}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Tilt — pointer-tracking 3D tilt with a moving specular highlight
   ─────────────────────────────────────────────────────────────────────────── */
export function Tilt({
  children,
  max = 10,
  className = "",
}: {
  children: ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--tilt-x", `${(0.5 - py) * max}deg`);
      el.style.setProperty("--tilt-y", `${(px - 0.5) * max}deg`);
      el.style.setProperty("--glare-x", `${px * 100}%`);
      el.style.setProperty("--glare-y", `${py * 100}%`);
    },
    [max]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }, []);

  return (
    <div
      ref={ref}
      className={`fx-tilt ${className}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      <div className="fx-tilt-glare" aria-hidden />
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   WordCycle — rotates through words with a vertical roll (hero accent)
   ─────────────────────────────────────────────────────────────────────────── */
export function WordCycle({ words, interval = 2400 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);
  return (
    <span className="fx-wordcycle" aria-live="polite">
      {words.map((w, idx) => (
        <span key={w} className={`fx-wordcycle-word ${idx === i ? "is-on" : ""}`}>
          {w}
        </span>
      ))}
      {/* widest word reserves layout space */}
      <span className="fx-wordcycle-ghost" aria-hidden>
        {words.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>
    </span>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Chapter — editorial chapter heading: number, rule, kicker, title
   ─────────────────────────────────────────────────────────────────────────── */
export function Chapter({
  no,
  kicker,
  title,
  sub,
  light = false,
  align = "center",
}: {
  no: string;
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  light?: boolean;
  align?: "center" | "left";
}) {
  return (
    <div className={`chapter chapter--${align} ${light ? "chapter--light" : ""}`}>
      <Reveal variant="blur">
        <div className="chapter-meta">
          <span className="chapter-no">{no}</span>
          <span className="chapter-rule" />
          <span className="chapter-kicker">{kicker}</span>
        </div>
      </Reveal>
      <Reveal variant="up" d={1}>
        <h2 className="chapter-title">{title}</h2>
      </Reveal>
      {sub && (
        <Reveal variant="up" d={2}>
          <p className="chapter-sub">{sub}</p>
        </Reveal>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   MagneticButton — buttons subtly attract toward cursor with spring physics
   ─────────────────────────────────────────────────────────────────────────── */
export function MagneticButton({
  children,
  className = "",
  onClick,
  strength = 0.3,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "";
  }, []);

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   ParticleField — subtle floating CSS dots for hero background
   ─────────────────────────────────────────────────────────────────────────── */
export function ParticleField({ count = 30 }: { count?: number }) {
  const [particles, setParticles] = useState<
    { id: number; left: number; top: number; size: number; delay: number; duration: number; opacity: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 6,
        duration: 8 + Math.random() * 10,
        opacity: 0.1 + Math.random() * 0.25,
      }))
    );
  }, [count]);

  if (!particles.length) return null;

  return (
    <div className="particle-field" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   GlowCard — wrapper that adds cursor-following spotlight glow to its children
   ─────────────────────────────────────────────────────────────────────────── */
export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--glow-x", `${x}%`);
    el.style.setProperty("--glow-y", `${y}%`);
    el.style.setProperty("--glow-opacity", "1");
  }, []);

  const handleLeave = useCallback(() => {
    ref.current?.style.setProperty("--glow-opacity", "0");
  }, []);

  return (
    <div
      ref={ref}
      className={`glow-card-wrap ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   HeroEntrance — choreographed staggered entrance for hero elements
   ─────────────────────────────────────────────────────────────────────────── */
export function HeroEntrance({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), 200 + delay * 150);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <div
      className={`hero-entrance ${show ? "is-in" : ""}`}
      style={{ transitionDelay: `${delay * 80}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

