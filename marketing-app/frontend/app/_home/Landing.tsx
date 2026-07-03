"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { InvestorStory, GallerySection } from "./showcase";
import {
  Reveal, Tilt, Marquee, ScrollProgress, WordCycle, Chapter, Counter,
  MagneticButton, ParticleField, HeroEntrance, GlowCard,
  SmoothScroll, scrollToId, scrollToTop, WordReveal, Parallax,
} from "./fx";

const Hero3D = dynamic(() => import("./three").then((m) => m.Hero3D), { ssr: false });
const FlowStory3D = dynamic(() => import("./three").then((m) => m.FlowStory3D), { ssr: false });

/* ─── Nav sections (page order) ─── */
const NAV_ITEMS: { id: string; label: string }[] = [
  { id: "how", label: "How it works" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "track", label: "Tracking" },
  { id: "vendor-os", label: "Vendor OS" },
  { id: "pricing", label: "Pricing" },
  { id: "gallery", label: "Gallery" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
];
/* sections that exist on the page but not in the nav (scrollspy still works) */
const SPY_IDS = [
  "problem", "solution", "whatsapp", "flow", "track", "vendor-os", "partner",
  "how", "gallery", "features", "pricing", "privacy", "market", "reviews",
  "faq", "about", "contact",
];

/* ─── FAQ (grounded in the real product) ─── */
const FAQS = [
  { q: "What can I print?", a: "PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX) and images (JPG/PNG) — up to 500 MB per file and 20 files in one order. Choose B&W or colour, single or double-sided, copies (1–50) and exact page ranges like “1-3, 5” — with a live price before you commit." },
  { q: "Do I need to install an app?", a: "No. Scan the shop's QR and everything runs in your phone's browser — no account, no OTP, just your name. Or skip even that: forward your file to Printable's WhatsApp number with the shop code, and the bot replies with your print link in seconds." },
  { q: "How do I pay?", a: "Pay cash at the counter — your order gets a short code like ABC123 to show when you pick up, and the shop confirms it in one tap. Online payment via Razorpay (UPI, cards, wallets) is fully built in and switches on per shop; every online payment is webhook-verified server-side before a single page prints." },
  { q: "Is my document really private?", a: "Yes — and honestly so. Web uploads go from your phone straight to encrypted cloud storage without passing through our API server; WhatsApp files are fetched by our server and moved straight into the same encrypted storage. The shop's software fetches your file, prints it silently, and wipes its local copy; the cloud copy is deleted the moment your order completes, and a scheduled sweep clears abandoned uploads within hours. No human being ever opens your file." },
  { q: "What do I need to become a print partner?", a: "A Windows PC connected to your printer — that's it. Install the Printable Vendor app, paste your shop's setup key, and place your QR standee on the counter. Setup takes under 30 minutes with zero new hardware, and a built-in auto-updater keeps manual reinstalls off your plate." },
  { q: "What does it cost a shop?", a: "A simple monthly subscription (₹1–2k) plus a small per-order fee. No hardware to buy, no commission on cash orders, and most partners recover the fee within days from the extra volume." },
  { q: "What happens if a print fails?", a: "Nothing gets lost. A printer error halts the queue without dropping the job — the order reverts to paid and a Resolve button retries it. Even after a power cut, the app re-queues stuck jobs automatically on restart, and recent orders can be re-queued in one click from history." },
  { q: "When does the shop get its money?", a: "Cash stays at the counter as usual — the dashboard just keeps a clean digital record. When a shop enables online payments, Razorpay settles directly to the partner's account." },
];

/* ─── Reviews data ─── */
const REVIEWS = [
  {
    type: "customer",
    name: "Riya Sharma",
    tag: "B.Tech Student",
    avatar: "👩‍🎓",
    stars: 5,
    text: "I used to waste 40 minutes every morning at the print shop. With Printable I just scan, upload and walk in — my prints are ready before I even reach the counter. Absolute game-changer!",
  },
  {
    type: "customer",
    name: "Arjun Mehta",
    tag: "MBA Student",
    avatar: "👨‍💼",
    stars: 5,
    text: "No more WhatsApp-ing files to random numbers. The PDF preview feature saved me from a huge assignment printing mistake. Pricing is transparent — exactly what students need.",
  },
  {
    type: "customer",
    name: "Priya Verma",
    tag: "Working Professional",
    avatar: "👩‍💻",
    stars: 4,
    text: "I needed urgent prints during lunch break. Ordered from my desk, paid online, picked up in 5 minutes. The live order tracking is super reassuring. Highly recommend!",
  },
  {
    type: "vendor",
    name: "Ramesh Print Works",
    tag: "Print Shop Owner, Bhopal",
    avatar: "🖨️",
    stars: 5,
    text: "Before Printable I had 10 students shouting orders at the same time. Now every job comes in digitally with all settings pre-filled. I just click print. My revenue has gone up 30% and stress has gone down 80%.",
  },
  {
    type: "vendor",
    name: "Sunil Copy Center",
    tag: "Print Partner, College Campus",
    avatar: "🏪",
    stars: 5,
    text: "The vendor dashboard is so simple. I can see all pending orders at a glance, confirm them, and mark done. Digital payments mean no change-making headaches. This is the future of print shops.",
  },
  {
    type: "vendor",
    name: "Kavita Stationery",
    tag: "Shop Owner, MP Nagar",
    avatar: "📋",
    stars: 4,
    text: "Setting up was very easy — I just display the QR code and customers do everything themselves. Fewer errors, faster service. My regular customers love it and I am getting new ones too.",
  },
];

const VIDEOS = [
  {
    src: "https://www.youtube.com/embed/NRXZ4vUNBg4",
    title: "Customer Review – Kunal Sharma",
    type: "customer" as const,
    reviewer: "Kunal Sharma",
    tag: "B.Tech Student, IES University Bhopal",
    caption: "“Saved me 40 minutes every day. Must-have for every student.”",
  },
  {
    src: "https://www.youtube.com/embed/8sZxb3AzlsU",
    title: "Customer Review – Satyam Sharma",
    type: "customer" as const,
    reviewer: "Satyam Sharma",
    tag: "MBA Student",
    caption: "“No more WhatsApp files. Just scan and print. That's it.”",
  },
  {
    src: "https://www.youtube.com/embed/ykGhg2xWY6k",
    title: "Vendor Review – Yadav Print Works",
    type: "vendor" as const,
    reviewer: "Yadav Print Works",
    tag: "Shop Owner, Bhopal",
    caption: "“Fast and easy to use. The dashboard is incredibly simple.”",
  },
];

const TEAM = [
  { name: "Darsh Dave", role: "Founder & CEO", emoji: "🚀", isFounder: true },
  { name: "Soham Kulkarni", role: "COO & Co-Founder", emoji: "📊" },
  { name: "Shashank", role: "CFO & Co-Founder", emoji: "💰" },
  { name: "Abhay Jadon", role: "CTO & Co-Founder", emoji: "⚙️" },
  { name: "MD. Kaif Siddique", role: "CMO & Co-Founder", emoji: "📣" },
  { name: "Shashank Agarwal", role: "System Engineer & Co-Founder", emoji: "🖥️" },
  { name: "Anish Kumar", role: "Software Developer & Co-Founder", emoji: "🎨" },
  { name: "Aayush Sharma", role: "Software Developer & Co-Founder", emoji: "💻" },
];

const PROBLEMS = [
  { icon: "⏳", stat: "30+ min", title: "Long Queues", desc: "Standing in line for 30+ minutes just to hand over a USB drive." },
  { icon: "📂", stat: "USB · chat · email", title: "File Transfer Chaos", desc: "WhatsApp-ing files, USB drives, email attachments — all error-prone and slow." },
  { icon: "💬", stat: "shouted settings", title: "Manual Negotiation", desc: "Explaining print settings verbally leads to mistakes and reprints." },
  { icon: "💸", stat: "no price list", title: "Opaque Pricing", desc: "No clear pricing upfront — customers often overpay or get surprised." },
];

const FEATURES = [
  { icon: "🔒", title: "Private by Architecture", desc: "Files upload straight to encrypted cloud storage, print automatically, and are wiped the moment the job completes — abandoned uploads are swept within hours. No person ever opens your document." },
  { icon: "🔳", title: "QR-Based Entry", desc: "Each shop gets a unique QR code — no app download required, works in any browser. No account, no OTP, just your name." },
  { icon: "📑", title: "Live Preview", desc: "Page-by-page preview before you pay — pick B&W and watch it turn grayscale, pick landscape and watch it rotate. What you see is what prints." },
  { icon: "⚙️", title: "Smart Print Config", desc: "Copies (1–50), exact page ranges like “1-3, 5”, colour or B&W, single or double-sided, portrait or landscape — per file, even in multi-file orders." },
  { icon: "💰", title: "Live Pricing", desc: "The price updates as you toggle options — with automatic bulk rates past 100 pages and a double-sided discount. The backend recalculates independently, so the shown price is the charged price." },
  { icon: "🔔", title: "Live Order Tracking", desc: "A short order code like ABC123 and a food-delivery-style tracker: Order placed → Printing → Ready, auto-refreshing every 15 seconds." },
  { icon: "📊", title: "Vendor OS", desc: "Print partners run a full desktop operating system for their shop — order queue, printer health, toner levels, revenue reports, staff shifts." },
  { icon: "💳", title: "Cash & Online", desc: "Pay cash at the counter (confirmed by the shop in one keystroke) or online via Razorpay UPI when the shop enables it — webhook-verified before printing." },
];

function Review({ name, tag, avatar, stars, text, type }: (typeof REVIEWS)[0]) {
  return (
    <div className={`rev-card rev-card--${type}`}>
      <div className="rev-top">
        <span className="rev-type">{type === "customer" ? "👤 Customer" : "🏪 Vendor"}</span>
        <span className="rev-stars">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
      </div>
      <p className="rev-text">&ldquo;{text}&rdquo;</p>
      <div className="rev-author">
        <span className="rev-avatar">{avatar}</span>
        <div>
          <div className="rev-name">{name}</div>
          <div className="rev-tag">{tag}</div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   TrackerDemo — the real order lifecycle, auto-advancing like the live app.
   Statuses mirror components/OrderTracker.tsx in the customer app.
   ─────────────────────────────────────────────────────────────────────────── */
const TRACK_STEPS = [
  { icon: "🧾", label: "Order placed", sub: "Show ABC123 at the counter to pay" },
  { icon: "💵", label: "Cash received", sub: "Confirmed by the shop in one tap" },
  { icon: "🖨️", label: "Printing", sub: "Your job is on the printer right now" },
  { icon: "✅", label: "Ready", sub: "Ready to collect — enjoy!" },
];

function TrackerDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (TRACK_STEPS.length + 1)), 2100);
    return () => clearInterval(id);
  }, []);
  const railPct = Math.min(step / (TRACK_STEPS.length - 1), 1) * 100;
  return (
    <div className="trk-phone" aria-label="Live order tracking demo">
      <div className="trk-head">
        <div>
          <div className="trk-sub" style={{ marginBottom: 2 }}>ORDER</div>
          <div className="trk-oid">ABC123</div>
        </div>
        <span className="trk-live"><span className="trk-live-dot" /> Live</span>
      </div>
      <div className="trk-steps">
        <div className="trk-rail"><div className="trk-rail-fill" style={{ height: `${railPct}%` }} /></div>
        {TRACK_STEPS.map((s, i) => (
          <div key={s.label} className={`trk-step ${i < step ? "is-done" : ""} ${i === step ? "is-active" : ""}`}>
            <span className="trk-node">{s.icon}</span>
            <div className="trk-body">
              <div className="trk-label">{s.label}</div>
              <div className="trk-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="trk-parts">
        <span className="trk-parts-title">Prints in 2 parts (different printers)</span>
        <div className="trk-part">
          <span>🖤 B &amp; W <span style={{ opacity: 0.5, fontFamily: "monospace", fontSize: "0.7rem" }}>#ABC123</span></span>
          <span className={`trk-part-tag ${step >= 3 ? "trk-part-tag--done" : "trk-part-tag--run"}`}>{step >= 3 ? "Ready" : "Printing"}</span>
        </div>
        <div className="trk-part">
          <span>🎨 Colour <span style={{ opacity: 0.5, fontFamily: "monospace", fontSize: "0.7rem" }}>#ABC123-COLOUR</span></span>
          <span className={`trk-part-tag ${step >= 4 ? "trk-part-tag--done" : "trk-part-tag--run"}`}>{step >= 4 ? "Ready" : "Printing"}</span>
        </div>
      </div>
      <div className="trk-note">Stay on this page · updates automatically</div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   VendorConsole — the real staged pipeline from the desktop app's queue
   (Fetching → Downloading → Printing → Finalizing), looping.
   ─────────────────────────────────────────────────────────────────────────── */
const VOS_STAGES = [
  { icon: "📡", name: "Fetching Order", pct: "10%" },
  { icon: "☁️", name: "Downloading Documents", pct: "35%" },
  { icon: "🖨️", name: "Physical Printing in Progress", pct: "65–95%" },
  { icon: "✨", name: "Finalizing", pct: "done" },
];

function VendorConsole() {
  const [on, setOn] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOn((s) => (s + 1) % VOS_STAGES.length), 2250);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="vos-console" aria-label="Vendor app printing pipeline demo">
      <div className="vos-console-bar">
        <span /><span /><span />
        <span className="vos-console-title">Printable Vendor — Now Printing</span>
      </div>
      <div className="vos-console-body">
        <div className="vos-order">
          <div>
            <div className="vos-order-id">#QK7M2P</div>
            <div className="vos-order-meta">Assignment_Unit4.pdf · 12 pages × 2 · B&amp;W · Both sides</div>
          </div>
          <span className="vos-badge">Paid · confirmed</span>
        </div>
        <div className="vos-stages">
          {VOS_STAGES.map((s, i) => (
            <div key={s.name} className={`vos-stage ${i === on ? "is-on" : ""}`}>
              <span className="vos-stage-icon">{s.icon}</span>
              <span className="vos-stage-name">{s.name}</span>
              <span className="vos-stage-pct">{s.pct}</span>
            </div>
          ))}
        </div>
        <div className="vos-bar"><div className="vos-bar-fill" /></div>
        <div className="vos-done">✓ Print Successful — order completed and saved to history</div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [demoTab, setDemoTab] = useState<"customer" | "vendor">("customer");
  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 40);
      setShowTop(window.scrollY > 900);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* scrollspy — highlight the section currently in view. Some sections mount
     late (the 3D story loads in a client-only chunk), so retry until every
     id is observed. */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pending = new Set(SPY_IDS);
    const tryObserve = (attempt: number) => {
      if (cancelled) return;
      for (const id of [...pending]) {
        const el = document.getElementById(id);
        if (el) {
          obs.observe(el);
          pending.delete(id);
        }
      }
      if (pending.size > 0 && attempt < 20) {
        timer = setTimeout(() => tryObserve(attempt + 1), 500);
      }
    };
    tryObserve(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      obs.disconnect();
    };
  }, []);

  /* close the mobile menu with Escape */
  useEffect(() => {
    if (!menuOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [menuOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  return (
    <div className="site">
      <SmoothScroll />
      {/* ── NAV ── */}
      <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <div className="nav-inner">
          <button onClick={() => scrollTo("hero")} className="logo">
            <img src="/printable-logo.jpeg" alt="Printable logo" className="logo-img" />
            Print<span>able</span>
          </button>
          <div className="nav-links">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`nav-link ${activeSection === id ? "is-active" : ""}`}
              >
                {label}
              </button>
            ))}
            <a href="/vendor" className="nav-link nav-cta">For print shops →</a>
          </div>
          <button
            className="hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span /><span /><span />
          </button>
        </div>
        <ScrollProgress />
        {menuOpen && (
          <div className="mobile-menu" id="mobile-menu">
            {NAV_ITEMS.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} className="mobile-link">
                {label}
              </button>
            ))}
            <a href="/vendor" className="mobile-link" style={{ color: "var(--accent)" }}>For print shops →</a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <header id="hero" className="hero">
        <div className="hero-grid" aria-hidden />
        <div className="hero-aurora" aria-hidden />
        <ParticleField count={35} />
        <Hero3D />

        <div className="hero-layout">
          <div className="hero-copy">
            <HeroEntrance delay={0}>
              <span className="hero-badge">
                <span className="hero-badge-dot" /> 🔒 Files auto-delete after printing
              </span>
            </HeroEntrance>
            <HeroEntrance delay={1}>
              <h1 className="hero-title">
                Printing, finally{" "}
                <span className="hero-accent">
                  <WordCycle words={["reinvented.", "instant.", "queue-free.", "automatic."]} />
                </span>
              </h1>
            </HeroEntrance>
            <HeroEntrance delay={2}>
              <p className="hero-sub">
                Customers send files on WhatsApp or scan a QR — the shop&apos;s printer does the rest, automatically.
                No app to install, no pen drive, no queue.
              </p>
            </HeroEntrance>
            <HeroEntrance delay={3}>
              <div className="hero-actions">
                <MagneticButton className="btn btn--primary" onClick={() => scrollTo("how")}>
                  See how it works <span className="btn-arrow">→</span>
                </MagneticButton>
                <MagneticButton className="btn btn--secondary" onClick={() => scrollTo("gallery")}>
                  Try the Interactive Demo
                </MagneticButton>
                <MagneticButton className="btn btn--ghost" onClick={() => { window.location.href = "/vendor"; }}>
                  For shop owners
                </MagneticButton>
              </div>
            </HeroEntrance>

            <HeroEntrance delay={4}>
              <div className="hero-trust">
                <div className="trust-item">
                  <span className="trust-icon">☁️</span> Straight to Encrypted Storage
                </div>
                <div className="trust-item">
                  <span className="trust-icon">🙈</span> Printed by Software, Not People
                </div>
                <div className="trust-item">
                  <span className="trust-icon">⏱️</span> Deleted the Moment It Prints
                </div>
              </div>
            </HeroEntrance>

            <HeroEntrance delay={5}>
              <div className="hero-traction">
                <p>
                  <span>Trusted by <strong>10,000+</strong> students</span>
                  <span style={{ color: "var(--accent-2)" }}>•</span>
                  <span><strong>500,000+</strong> pages printed automatically</span>
                </p>
              </div>
            </HeroEntrance>
          </div>

          <div className="hero-right">
            <HeroEntrance delay={6}>
              <div className="hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-num"><Counter to={20} suffix="s" duration={1200} /></span>
                  <span className="hero-stat-label">to place an order</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-num">0</span>
                  <span className="hero-stat-label">apps to install</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-num">5s</span>
                  <span className="hero-stat-label">order reaches the shop</span>
                </div>
              </div>
            </HeroEntrance>
          </div>
        </div>

        <button className="hero-scroll-cue" onClick={() => scrollTo("problem")} aria-label="Scroll down">
          <span />
        </button>
      </header>

      {/* ── TICKER ── */}
      <Marquee
        items={[
          "Scan a QR",
          "WhatsApp your files",
          "Live price before you pay",
          "Pay cash or UPI",
          "Track it like a food order",
          "It just prints",
          "No queues",
          "No USB drives",
          "No app to install",
          "Files auto-delete",
        ]}
      />

      {/* ── CH.01 PROBLEM ── */}
      <section id="problem" className="sec sec--alt">
        <div className="wrap">
          <Chapter
            no="01"
            kicker="The Problem"
            title={<>Print shops are stuck <em>decades behind.</em></>}
            sub="Every student and professional knows this frustration."
          />
          <div className="prob-grid">
            {PROBLEMS.map((p, i) => (
              <Reveal key={p.title} d={i} variant="up">
                <GlowCard>
                  <Tilt max={7} className="prob-tilt">
                    <div className="prob-card">
                      <span className="prob-icon">{p.icon}</span>
                      <span className="prob-stat">{p.stat}</span>
                      <h3>{p.title}</h3>
                      <p>{p.desc}</p>
                    </div>
                  </Tilt>
                </GlowCard>
              </Reveal>
            ))}
          </div>
          <Reveal variant="blur" d={2}>
            <p className="prob-punch">
              Every print is a queue, a USB drive, <em>and a guessing game.</em>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CH.02 SOLUTION ── */}
      <section id="solution" className="sec">
        <div className="wrap">
          <div className="sol-layout">
            <div className="sol-text">
              <Chapter
                no="02"
                kicker="Our Solution"
                align="left"
                title={<>One QR code.<br /><em>Infinite simplicity.</em></>}
              />
              <Reveal variant="up" d={2}>
                <p className="sol-desc">
                  Printable replaces the chaos of traditional print shops with a fully automated, QR-driven workflow.
                  Customers scan, configure, and pay — all on their own phone. The job arrives at the shop with every
                  setting pre-filled, and the software prints it without anyone touching the file.
                </p>
              </Reveal>
              <ul className="sol-points">
                {[
                  "Files printed by software — never opened by a person",
                  "No USB drives or file transfers via chat",
                  "Live pricing — no haggling, no surprises",
                  "Pay cash at the counter or online — your choice",
                  "Once payment is confirmed, printing runs itself — no clicks",
                ].map((t, i) => (
                  <Reveal key={t} as="li" variant="left" d={i}>
                    <span className="sol-check">✓</span> {t}
                  </Reveal>
                ))}
              </ul>
              <Reveal variant="up" d={5}>
                <MagneticButton className="btn btn--primary" onClick={() => scrollTo("gallery")}>
                  Experience It Live <span className="btn-arrow">→</span>
                </MagneticButton>
              </Reveal>
            </div>

            <Reveal variant="scale" d={2} className="sol-visual">
              <div className="sol-qr-card">
                <div className="sol-qr">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span key={i} className={`sol-qr-cell ${[0,1,2,4,5,7,10,12,14,17,19,20,22,23,24,6,18].includes(i) ? "on" : ""}`} style={{ animationDelay: `${(i % 7) * 120}ms` }} />
                  ))}
                  <div className="sol-qr-scanline" />
                </div>
                <div className="sol-flow">
                  {["📱 Customer Scans QR", "📄 Uploads & Configures", "💳 Pays Cash or Online", "🖨️ It Prints Automatically", "✅ Ready to Collect"].map((s, i) => (
                    <Reveal key={s} variant="left" d={i} className="sol-flow-step">
                      <span className="sol-flow-dot" />
                      <span>{s}</span>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── WHATSAPP ORDERING ── */}
      <section id="whatsapp" className="sec wa">
        <div className="wrap">
          <div className="wa-layout">
            <div className="wa-text">
              <Reveal variant="blur">
                <span className="wa-new">✨ NEW</span>
              </Reveal>
              <Chapter
                no="02.5"
                kicker="WhatsApp Ordering"
                align="left"
                title={<>Your files live on WhatsApp.<br /><em>So does Printable.</em></>}
              />
              <Reveal variant="up" d={2}>
                <p className="sol-desc">
                  No more hunting through folders for that one PDF. Forward it to Printable&apos;s WhatsApp number with
                  your shop&apos;s code — our bot replies in seconds with a secure link where you pick copies &amp;
                  colour and pay. Built directly on Meta&apos;s WhatsApp Cloud API.
                </p>
              </Reveal>
              <ul className="sol-points">
                {[
                  "Send the file the way you already share it",
                  "Send several files in a burst — they bundle into one order",
                  "The bot remembers your shop — no code needed next time",
                  "You get a WhatsApp ping the second your prints are ready",
                  "Links expire in 4 hours and files are wiped — privacy on a timer",
                ].map((t, i) => (
                  <Reveal key={t} as="li" variant="left" d={i}>
                    <span className="sol-check">✓</span> {t}
                  </Reveal>
                ))}
              </ul>
            </div>
            <Reveal variant="scale" d={2} className="wa-visual">
              <Parallax speed={0.06}>
                <div className="wa-chat">
                  <div className="wa-chat-head">
                    <img src="/printable-logo.jpeg" alt="" className="wa-chat-avatar" />
                    <div>
                      <div className="wa-chat-name">Printable</div>
                      <div className="wa-chat-status">online</div>
                    </div>
                  </div>
                  <div className="wa-chat-body">
                    <div className="wa-bubble wa-bubble--out">
                      <span className="wa-file">📄 Assignment_Unit4.pdf</span>
                      #SHP7Q2KP
                      <span className="wa-meta">10:42 ✓✓</span>
                    </div>
                    <div className="wa-bubble wa-bubble--in">
                      Got your file! 🎉 Tap to choose copies, colour &amp; pay — it prints the moment you&apos;re done:
                      <span className="wa-link">printable.co.in/print/d8kX2</span>
                      <span className="wa-meta">10:42</span>
                    </div>
                    <div className="wa-bubble wa-bubble--in wa-bubble--small">
                      🔒 Your document goes straight to encrypted storage — printed by software, never opened by a person.
                      <span className="wa-meta">10:42</span>
                    </div>
                    <div className="wa-bubble wa-bubble--in wa-bubble--small">
                      ✅ Your prints are ready to collect! Show <strong>ABC123</strong> at the counter.
                      <span className="wa-meta">10:51</span>
                    </div>
                  </div>
                </div>
              </Parallax>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CH.03 FLOW (3D scroll story) ── */}
      <FlowStory3D />

      {/* ── CH.03.5 LIVE TRACKING ── */}
      <section id="track" className="sec sec--alt">
        <div className="wrap">
          <div className="trk-layout">
            <div className="trk-copy">
              <Chapter
                no="03.5"
                kicker="Live Tracking"
                align="left"
                title={<>Track it like <em>a food order.</em></>}
              />
              <Reveal variant="up" d={2}>
                <p className="sol-desc">
                  Every order gets a short, memorable code — like <strong>ABC123</strong> — and a live tracker that
                  updates itself every 15 seconds. These are the exact statuses from the real product, not marketing
                  fiction: <em>Order placed → Payment confirmed → Printing → Ready.</em>
                </p>
              </Reveal>
              <ul className="trk-points">
                {[
                  "Paying cash? A giant tap-to-copy code to show at the counter",
                  "Mixed B&W + colour jobs print on two printers — tracked as one order",
                  "WhatsApp orders get a “ready to collect” ping automatically",
                  "“New Order (Same File)” reprints your document in one tap",
                ].map((t, i) => (
                  <Reveal key={t} as="li" variant="left" d={i}>
                    <span className="sol-check">✓</span> <span>{t}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
            <Reveal variant="scale" d={1}>
              <TrackerDemo />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── VENDOR GOLDMINE — the zero-click punch ── */}
      <section className="vp" aria-label="Value for print partners">
        <div className="wrap">
          <Reveal variant="blur">
            <p className="vp-kicker">🍫 For print partners, it&apos;s a goldmine</p>
          </Reveal>
          <Reveal variant="up" d={1}>
            <div className="vp-lines">
              <span>No downloading files.</span>
              <span>No choosing settings.</span>
              <span>No clicking print.</span>
            </div>
          </Reveal>
          <Reveal variant="up" d={2}>
            <p className="vp-big">
              <span className="vp-num"><Counter to={0} suffix=" clicks" duration={1200} /></span>
              <em>from payment confirmed to paper. It just prints.</em>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CH.04 VENDOR OS ── */}
      <section id="vendor-os" className="sec sec--ink">
        <div className="wrap">
          <Chapter
            no="04"
            kicker="Printable Vendor"
            title={<>An operating system <em>for your shop.</em></>}
            sub="The Windows app that runs the counter: orders, printers, toner, cash, staff, and reports."
          />
          <div className="vos-layout" style={{ marginTop: "3rem" }}>
            <div>
              <Reveal variant="up">
                <p className="vos-desc">
                  Orders arrive, chime, and — the moment payment is confirmed — print themselves: downloaded, Word
                  and PowerPoint auto-converted, B&amp;W jobs turned true-grayscale to protect colour toner, and every
                  file routed to the right printer automatically. Cash orders? One keystroke:{" "}
                  <strong>✓ Cash Received</strong> — and the job starts.
                </p>
              </Reveal>
              <ul className="vos-points">
                {[
                  "Silent printing — exact copies, sides, orientation, page ranges",
                  "Colour files → colour printer, B&W → the workhorse, automatically",
                  "Survives power cuts: stuck jobs re-queue themselves on restart",
                  "Connection drops? The job on the printer finishes — orders resume when you're back",
                  "Built-in auto-updater, and one toggle starts it with Windows",
                ].map((t, i) => (
                  <Reveal key={t} as="li" variant="left" d={i}>
                    <span className="sol-check">✓</span> <span>{t}</span>
                  </Reveal>
                ))}
              </ul>
              <Reveal variant="up" d={4}>
                <MagneticButton className="btn btn--primary" onClick={() => { window.location.href = "/vendor"; }}>
                  Explore the Vendor OS <span className="btn-arrow">→</span>
                </MagneticButton>
              </Reveal>
            </div>
            <Reveal variant="scale" d={2}>
              <VendorConsole />
            </Reveal>
          </div>

          {/* proof strip — code-true capabilities */}
          <div className="vproof-grid">
            <Reveal variant="up" d={0}>
              <div className="vproof-card">
                <span className="vproof-icon">🩸</span>
                <h4>Exact toner levels, live</h4>
                <p>Network printers report real percentages over SNMP — per cartridge, per paper tray. USB printers still report OK/Low/Out.</p>
                <div className="toner-set">
                  <div className="toner-row"><span>K</span><div className="toner-track"><div className="toner-fill toner-fill--k" style={{ "--fill": "82%" } as React.CSSProperties} /></div><span className="toner-pct">82%</span></div>
                  <div className="toner-row"><span>C</span><div className="toner-track"><div className="toner-fill toner-fill--c" style={{ "--fill": "64%" } as React.CSSProperties} /></div><span className="toner-pct">64%</span></div>
                  <div className="toner-row"><span>M</span><div className="toner-track"><div className="toner-fill toner-fill--m" style={{ "--fill": "58%" } as React.CSSProperties} /></div><span className="toner-pct">58%</span></div>
                  <div className="toner-row"><span>Y</span><div className="toner-track"><div className="toner-fill toner-fill--y" style={{ "--fill": "12%" } as React.CSSProperties} /></div><span className="toner-pct">12%</span></div>
                </div>
              </div>
            </Reveal>
            <Reveal variant="up" d={1}>
              <div className="vproof-card">
                <span className="vproof-icon">🖨️</span>
                <h4>11 printer states, detected in seconds</h4>
                <p>Paper jams, empty trays, open doors and low toner surface as alerts before the customer notices — with one-click test pages.</p>
                <div className="vchips">
                  <span className="vchip vchip--ok">✅ Ready</span>
                  <span className="vchip vchip--warn">⚠️ Toner low</span>
                  <span className="vchip vchip--bad">🚫 Paper jam</span>
                  <span className="vchip vchip--bad">🚪 Door open</span>
                  <span className="vchip vchip--warn">📥 Tray full</span>
                  <span className="vchip">🔌 Offline</span>
                </div>
              </div>
            </Reveal>
            <Reveal variant="up" d={2}>
              <div className="vproof-card">
                <span className="vproof-icon">📊</span>
                <h4>Your shop&apos;s numbers, always</h4>
                <p>Revenue, pages printed, B&amp;W vs colour split for toner planning, busiest-hours histogram, CSV export for your accountant — plus PIN-locked staff shifts with live ₹ collected.</p>
                <div className="vchips">
                  <span className="vchip vchip--ok">💰 Revenue Today</span>
                  <span className="vchip">📈 Busiest hours</span>
                  <span className="vchip">⬇️ Export CSV</span>
                  <span className="vchip">👥 Staff shifts</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CH.04.5 BECOME A PARTNER ── */}
      <section id="partner" className="sec partner">
        <div className="wrap">
          <Chapter
            no="04.5"
            kicker="Become a Print Partner"
            title={<>Your shop, upgraded <em>in 30 minutes.</em></>}
            sub="No new hardware. No training. If your Windows PC can print, you're ready."
          />
          <div className="partner-steps">
            {[
              { n: "01", icon: "💿", title: "Install the desktop app", desc: "One Windows installer. First run asks for your shop name and setup key — paste it, hit “Link shop & start”, done." },
              { n: "02", icon: "🪧", title: "Place your QR on the counter", desc: "We give you a shop code and a standee. Customers scan it — or WhatsApp their files with your code." },
              { n: "03", icon: "🍫", title: "Watch orders print themselves", desc: "Jobs arrive paid, configured, and queued. You hand over pages and collect the money. That's the whole job." },
            ].map((s, i) => (
              <Reveal key={s.n} d={i} variant="up">
                <div className="partner-step">
                  <span className="partner-step-n">{s.n}</span>
                  <span className="partner-step-icon">{s.icon}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal variant="up" d={1}>
            <div className="partner-strip">
              <div className="partner-benefits">
                <span>📈 More volume, fewer errors</span>
                <span>🧾 Every order digitally recorded</span>
                <span>🚫 Zero pricing disputes</span>
                <span>💚 WhatsApp orders flow in too</span>
              </div>
              <MagneticButton
                className="btn btn--primary"
                onClick={() => { window.location.href = "/vendor"; }}
              >
                Become a print partner <span className="btn-arrow">→</span>
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CH.05 HOW IT WORKS ── */}
      <section id="how" className="sec sec--alt">
        <div className="wrap">
          <Chapter
            no="05"
            kicker="How It Works"
            title={<>See it <em>in action.</em></>}
            sub="A seamless experience for both customers and print vendors — from scan to delivery."
          />

          <div className="steps-grid">
            {[
              { n: 1, icon: "📷", title: "Scan the QR Code", desc: "Every print shop has a unique QR code at the counter. Scan it with any smartphone camera — no app download, no account, no OTP." },
              { n: 2, icon: "📄", title: "Upload & Configure", desc: "Drop files up to 500 MB — the page count is detected before the upload even finishes, and the live preview goes grayscale the moment you pick B&W." },
              { n: 3, icon: "🖨️", title: "Pay & It Prints Itself", desc: "See the exact price, pay cash at pickup or online, and get your code — like ABC123. The shop's software prints the job automatically." },
            ].map((s, i) => (
              <Reveal key={s.n} d={i} variant="up">
                <div className="step-card">
                  <div className="step-num">{s.n}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal variant="up" d={1}>
            <div className="demo">
              <div className="demo-tabs">
                <button
                  className={`demo-tab ${demoTab === "customer" ? "is-active" : ""}`}
                  onClick={() => setDemoTab("customer")}
                >
                  📱 Customer View
                </button>
                <button
                  className={`demo-tab ${demoTab === "vendor" ? "is-active" : ""}`}
                  onClick={() => setDemoTab("vendor")}
                >
                  🖨️ Vendor Dashboard
                </button>
              </div>

              {demoTab === "customer" ? (
                <div className="demo-panel">
                  <div className="demo-panel-text">
                    <h3>Customer Experience</h3>
                    <p>
                      After scanning the QR code, customers land on a clean web page where they can upload their files,
                      set print options per file, preview every page, and order — all in under 2 minutes.
                    </p>
                    <ul className="demo-points">
                      <li>✓ Upload PDF, Word, PowerPoint or images — up to 500 MB each</li>
                      <li>✓ Per-file settings: copies, exact pages, colour, sides, orientation</li>
                      <li>✓ Live preview that mirrors your choices — grayscale, rotation</li>
                      <li>✓ Live price breakdown before you commit</li>
                      <li>✓ No account — just your name, remembered for next time</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="demo-panel">
                  <div className="demo-panel-text">
                    <h3>Vendor Dashboard</h3>
                    <p>
                      Print partners run Printable Vendor — complete operating software for the shop. Every job arrives
                      with file, settings, and customer info pre-filled. Paid jobs print with zero clicks; cash jobs
                      take one keystroke.
                    </p>
                    <ul className="demo-points">
                      <li>✓ New orders chime and appear instantly — no refresh</li>
                      <li>✓ Confirmed orders print themselves, silently</li>
                      <li>✓ Cash orders: “✓ Cash Received” and it starts</li>
                      <li>✓ Live printer health, toner levels, and queue control</li>
                      <li>✓ Revenue reports, staff shifts, one-click reprints</li>
                    </ul>
                  </div>
                  <div className="demo-panel-img">
                    <img
                      src="/vendor-dashboard-screenshot.png"
                      alt="Vendor dashboard screenshot"
                      className="demo-screenshot"
                    />
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CH.06 GALLERY ── */}
      <section id="gallery" className="sec">
        <div className="wrap">
          <Chapter
            no="06"
            kicker="App Gallery"
            title={<>See <em>every screen.</em></>}
            sub="A full walkthrough of the Printable app — customer & vendor views. Click any screenshot to enlarge."
          />
          <GallerySection />
        </div>
      </section>

      {/* ── CH.07 FEATURES ── */}
      <section id="features" className="sec sec--alt">
        <div className="wrap">
          <Chapter no="07" kicker="Features" title={<>Everything <em>you need.</em></>} />
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} d={i % 4} variant="up">
                <GlowCard>
                  <div className="feat-card">
                    <span className="feat-icon">{f.icon}</span>
                    <h3 className="feat-title">{f.title}</h3>
                    <p className="feat-desc">{f.desc}</p>
                  </div>
                </GlowCard>
              </Reveal>
            ))}
          </div>

          {/* ── under the hood: the real, shipped infrastructure ── */}
          <Reveal variant="up">
            <div className="tech-head">
              <h3 className="tech-title">Under the hood — <em>real infrastructure, already shipped.</em></h3>
              <p className="tech-sub">Not a prototype. Every piece below runs in production today.</p>
            </div>
          </Reveal>
          <div className="tech-grid">
            {[
              { icon: "🖥️", title: "Partner Desktop App", desc: "Native Electron app for Windows. Silent printing via SumatraPDF, Word/PowerPoint auto-conversion (LibreOffice fallback), true-grayscale B&W conversion via MuPDF in milliseconds, and a crash-safe queue that re-queues stuck jobs after a restart." },
              { icon: "☁️", title: "Encrypted Cloud Storage", desc: "Web uploads go from the browser straight to Cloudflare R2 via presigned URLs — never through our API server — and are deleted the moment the order completes. A scheduled sweep clears abandoned uploads too." },
              { icon: "💚", title: "WhatsApp Cloud API", desc: "Direct Meta integration — one central number, per-shop codes, HMAC-verified webhooks, multi-file bursts bundled within 10 seconds, and your shop remembered for next time." },
              { icon: "⚡", title: "Real-time Order Pipeline", desc: "Orders reach the shop within 5 seconds. Single-worker queue with staged live progress, pause/resume, per-order printer overrides, and automatic colour/B&W splitting across two printers." },
              { icon: "🏦", title: "Razorpay Payments", desc: "UPI, cards and wallets with HMAC-SHA256, timing-safe webhook verification — every payment confirmed server-side before a single page prints. One captured payment marks an entire split order paid." },
              { icon: "🔄", title: "Auto-updating Fleet", desc: "A built-in auto-updater lets new versions download in the background and install on restart — no manual reinstalls at the counter." },
            ].map((t, i) => (
              <Reveal key={t.title} d={i % 3} variant="up">
                <div className="tech-card">
                  <span className="tech-icon">{t.icon}</span>
                  <div>
                    <h4>{t.title}</h4>
                    <p>{t.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CH.08 PRICING ── */}
      <section id="pricing" className="sec">
        <div className="wrap">
          <Chapter
            no="08"
            kicker="Transparent Pricing"
            title={<>The price you see is <em>the price you pay.</em></>}
            sub="Default rates below — every shop sets its own, and the backend recalculates independently so the display can't lie."
          />
          <div className="price-grid">
            {[
              { icon: "🖤", amount: "₹1", unit: "/page", name: "Black & White", desc: "Crisp true-grayscale output — converted before it ever hits the printer." },
              { icon: "🎨", amount: "₹5", unit: "/page", name: "Colour", desc: "Full colour on the shop's colour printer, routed automatically." },
              { icon: "📦", amount: "-10%", unit: " & more", name: "Bulk, automatic", desc: "Past 100 total pages, rates drop automatically: ₹0.90 B&W, ₹4 colour. No coupons needed." },
              { icon: "📄", amount: "50%", unit: " off", name: "Double-sided", desc: "Pick “Both sides” and the duplex discount applies to the live price instantly." },
            ].map((p, i) => (
              <Reveal key={p.name} d={i} variant="up">
                <div className="price-card">
                  <span className="price-icon">{p.icon}</span>
                  <div className="price-amount">{p.amount}<small>{p.unit}</small></div>
                  <div className="price-name">{p.name}</div>
                  <p className="price-desc">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal variant="up" d={2}>
            <p className="price-note">
              Shops can also offer finishing — <strong>soft binding, spiral binding, lamination, stapling</strong> — at
              their own rates. An itemised <strong>Price Breakdown</strong> (<em>12 pages × 2 copies × ₹1…</em>) shows
              before you place any order.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CH.09 PRIVACY ── */}
      <section id="privacy" className="sec sec--ink">
        <div className="wrap">
          <Chapter
            no="09"
            kicker="Privacy, By Architecture"
            title={<>Your document&apos;s <em>whole life.</em></>}
            sub="Not a policy promise — the actual pipeline your file travels, start to deletion."
          />
          <div className="priv-rail">
            <div className="priv-flow" aria-hidden />
            {[
              { step: "01", icon: "📱", title: "You upload", desc: "Web uploads go from your phone straight to encrypted cloud storage — never through our API server." },
              { step: "02", icon: "☁️", title: "It waits, encrypted", desc: "Behind a long, unguessable link that tracking pages never receive. The shop's app signs in with its own secret key." },
              { step: "03", icon: "🖨️", title: "Software prints it", desc: "The vendor app fetches, converts, and silent-prints. No human opens your file." },
              { step: "04", icon: "🧹", title: "Local copy wiped", desc: "The temp file on the shop PC is deleted right after the pages come out." },
              { step: "05", icon: "💨", title: "Cloud copy purged", desc: "Deleted the moment your order completes — and a scheduled sweep clears abandoned uploads within hours." },
            ].map((n, i) => (
              <Reveal key={n.step} d={i} variant="up">
                <div className="priv-node">
                  <span className="priv-node-step">{n.step}</span>
                  <span className="priv-node-icon">{n.icon}</span>
                  <h4>{n.title}</h4>
                  <p>{n.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal variant="up" d={2}>
            <div className="priv-facts">
              <span className="priv-fact"><strong>0</strong> accounts required</span>
              <span className="priv-fact"><strong>Deleted on completion</strong> — not archived</span>
              <span className="priv-fact"><strong>HMAC-verified</strong> payment webhooks</span>
              <span className="priv-fact">Tracking pages <strong>never</strong> receive WhatsApp numbers</span>
              <span className="priv-fact">Abandoned uploads <strong>self-destruct</strong></span>
            </div>
          </Reveal>
          <Reveal variant="up" d={3}>
            <p className="priv-more">
              <a href="/privacy">Read the full privacy architecture →</a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CH.10 INVESTOR STORY ── */}
      <InvestorStory />

      {/* ── CH.11 REVIEWS ── */}
      <section id="reviews" className="sec sec--alt">
        <div className="wrap">
          <Chapter
            no="11"
            kicker="Testimonials"
            title={<>What people <em>are saying.</em></>}
            sub="Real feedback from students, professionals, and print shop owners."
          />

          <div className="rev-group-label">Customer Reviews</div>
          <div className="rev-grid">
            {REVIEWS.filter((r) => r.type === "customer").map((r, i) => (
              <Reveal key={r.name} d={i} variant="up">
                <Review {...r} />
              </Reveal>
            ))}
          </div>

          <div className="rev-group-label">Vendor Reviews</div>
          <div className="rev-grid">
            {REVIEWS.filter((r) => r.type === "vendor").map((r, i) => (
              <Reveal key={r.name} d={i} variant="up">
                <Review {...r} />
              </Reveal>
            ))}
          </div>

          <div className="rev-group-label" style={{ marginTop: "3.5rem" }}>🎥 Video Testimonials</div>
          <p className="video-intro">Watch real users and print shop owners share their experience with Printable.</p>
          <div className="video-grid">
            {VIDEOS.map((v, i) => (
              <Reveal key={v.src} d={i} variant="up">
                <div className="video-card">
                  <div className="video-wrap">
                    <iframe
                      src={v.src}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="video-iframe"
                    />
                  </div>
                  <div className="video-meta">
                    <span className={`video-type video-type--${v.type}`}>
                      {v.type === "customer" ? "👤 Customer" : "🖨️ Vendor"}
                    </span>
                    <div className="video-reviewer">{v.reviewer}</div>
                    <div className="video-tag">{v.tag}</div>
                    <p className="video-caption">{v.caption}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CH.11.5 FAQ ── */}
      <section id="faq" className="sec faq">
        <div className="wrap wrap--narrow">
          <Chapter
            no="11.5"
            kicker="FAQ"
            title={<>Questions? <em>Answered.</em></>}
            sub="Everything customers and print partners usually ask us."
          />
          <div className="faq-list">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} d={i % 4} variant="up">
                <div className={`faq-item ${faqOpen === i ? "is-open" : ""}`}>
                  <button
                    className="faq-q"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    aria-expanded={faqOpen === i}
                    aria-controls={`faq-a-${i}`}
                  >
                    <span>{f.q}</span>
                    <span className="faq-chevron">{faqOpen === i ? "−" : "+"}</span>
                  </button>
                  <div className="faq-a" id={`faq-a-${i}`} aria-hidden={faqOpen !== i}>
                    <p>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CH.12 ABOUT / TEAM ── */}
      <section id="about" className="sec sec--void">
        <div className="wrap">
          <Chapter
            no="12"
            kicker="About Us"
            light
            title={<>Built by students,<br /><em>for everyone.</em></>}
          />
          <Reveal variant="up" d={2}>
            <p className="about-intro">
              We are <strong>Cynogen</strong> — a team of <strong>eight passionate engineers</strong> who got tired of
              wasting time at the campus print shop, and worried about handing personal documents to a stranger&apos;s
              computer. <strong>Printable</strong> is our first product: a mission to make printing effortless, instant,
              and truly private for colleges, offices, and beyond.
            </p>
          </Reveal>
          <div className="team-grid">
            {TEAM.map((m, i) => (
              <Reveal key={m.name} d={i % 4} variant="up">
                <div className={`team-card ${m.isFounder ? "team-card--founder" : ""}`}>
                  {m.isFounder && <div className="team-founder-badge">👑 Founder</div>}
                  <div className="team-avatar">{m.emoji}</div>
                  <div className="team-name">{m.name}</div>
                  <div className="team-role">{m.role}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal variant="up">
            <div className="iiit-badge">
              <span className="iiit-icon">🔒</span>
              <div>
                <div className="iiit-name">Privacy is our promise</div>
                <div className="iiit-sub">Your documents print automatically and auto-delete — never opened by a person, gone the moment the job is done.</div>
              </div>
            </div>
          </Reveal>
          <Reveal variant="blur" d={1}>
            <div className="mission">
              <h3>Our Mission</h3>
              <p>
                To eliminate every friction point in the printing process — from file transfer to payment — and make
                printing as effortless as sending a WhatsApp message. We believe technology should solve real, everyday
                problems, not just complex enterprise ones.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="cta" aria-label="Get started">
        <div className="cta-glow" aria-hidden />
        <div className="wrap">
          <Reveal variant="blur">
            <h2 className="cta-title">
              Never stand in a print queue <em>again.</em>
            </h2>
          </Reveal>
          <Reveal variant="up" d={1}>
            <p className="cta-sub">Scan. Send. Collect. Your documents stay private — and the shop barely lifts a finger.</p>
          </Reveal>
          <Reveal variant="up" d={2}>
            <div className="cta-actions">
              <MagneticButton className="btn btn--primary" onClick={() => scrollTo("gallery")}>
                See the product <span className="btn-arrow">→</span>
              </MagneticButton>
              <MagneticButton className="btn btn--ghost cta-ghost" onClick={() => { window.location.href = "/vendor"; }}>
                Become a print partner
              </MagneticButton>
            </div>
          </Reveal>
          <Reveal variant="up" d={3}>
            <div className="cta-stats">
              <span><strong><Counter to={10} suffix="K+" /></strong> students served</span>
              <span><strong><Counter to={500} suffix="K+" /></strong> pages printed</span>
              <span><strong><Counter to={20} suffix="s" /></strong> to place an order</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CH.13 CONTACT ── */}
      <section id="contact" className="sec">
        <div className="wrap">
          <Chapter
            no="13"
            kicker="Contact"
            title={<>Let&apos;s <em>talk.</em></>}
            sub="Investors, partners, or just curious? We'd love to hear from you."
          />
          <div className="contact-layout">
            <Reveal variant="left" className="contact-info">
              <h3>Reach Us</h3>
              <div className="contact-item">
                📧 <a href="mailto:darsh.dave999@gmail.com">darsh.dave999@gmail.com</a> or{" "}
                <a href="mailto:sohamkulkarni2265@gmail.com">sohamkulkarni2265@gmail.com</a>
              </div>
              <div className="contact-item">📍 Headquarter — Indore (MP)</div>
              <div className="contact-note">
                We respond within 24 hours. For investor inquiries, please mention &quot;Investment&quot; in the subject.
              </div>
            </Reveal>
            <Reveal variant="right" d={1} className="contact-form-wrap">
              {sent ? (
                <div className="form-success">
                  <div className="form-success-icon">✅</div>
                  <h3>Message Sent!</h3>
                  <p>We&apos;ll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="form">
                  <div className="form-group">
                    <label htmlFor="cf-name">Your Name</label>
                    <input
                      id="cf-name" type="text" placeholder="John Doe" required
                      value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cf-email">Email Address</label>
                    <input
                      id="cf-email" type="email" placeholder="john@example.com" required
                      value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cf-msg">Message</label>
                    <textarea
                      id="cf-msg" rows={4} placeholder="Tell us about your interest..." required
                      value={form.msg} onChange={(e) => setForm((f) => ({ ...f, msg: e.target.value }))}
                    />
                  </div>
                  <button type="submit" className="btn btn--primary btn--full">
                    Send Message <span className="btn-arrow">→</span>
                  </button>
                </form>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-glow" aria-hidden />
        <div className="footer-inner">
          <div className="footer-cols">
            <div className="footer-brand">
              <span className="logo logo--footer">
                <img src="/printable-logo.jpeg" alt="Printable logo" className="logo-img logo-img--footer" />
                Print<span>able</span>
              </span>
              <p>Private, automated printing for every print shop.</p>
              <p className="footer-cynogen">
                A <strong>Cynogen</strong> product
              </p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              {["how", "whatsapp", "track", "pricing", "gallery", "faq"].map((id) => (
                <button key={id} onClick={() => scrollTo(id)} className="footer-link">
                  {NAV_ITEMS.find((n) => n.id === id)?.label ?? id}
                </button>
              ))}
              <a className="footer-link" href="/vendor">Printable Vendor</a>
              <a className="footer-link" href="/privacy">Privacy</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <button onClick={() => scrollTo("about")} className="footer-link">About</button>
              <button onClick={() => scrollTo("market")} className="footer-link">Investors</button>
              <button onClick={() => scrollTo("partner")} className="footer-link">Partners</button>
              <button onClick={() => scrollTo("reviews")} className="footer-link">Reviews</button>
              <button onClick={() => scrollTo("contact")} className="footer-link">Contact</button>
            </div>
            <div className="footer-col">
              <h4>Reach us</h4>
              <a className="footer-link" href="mailto:darsh.dave999@gmail.com">📧 darsh.dave999@gmail.com</a>
              <a className="footer-link" href="mailto:sohamkulkarni2265@gmail.com">📧 sohamkulkarni2265@gmail.com</a>
              <span className="footer-link footer-link--static">📍 Headquarter — Indore (MP)</span>
              <a className="footer-link" href="mailto:darsh.dave999@gmail.com?subject=Investment%20—%20Printable%20Deck%20Request">💼 Investor deck</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Cynogen. All rights reserved. Printable is a product of Cynogen.</span>
          </div>
        </div>
      </footer>

      {/* ── BACK TO TOP ── */}
      <button
        className={`to-top ${showTop ? "is-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
