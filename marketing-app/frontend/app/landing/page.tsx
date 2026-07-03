"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { InvestorStory, GallerySection } from "./_showcase";
import { Reveal, Tilt, Marquee, ScrollProgress, WordCycle, Chapter, Counter, MagneticButton, ParticleField, HeroEntrance, GlowCard } from "./_fx";

const Hero3D = dynamic(() => import("./_three").then((m) => m.Hero3D), { ssr: false });
const FlowStory3D = dynamic(() => import("./_three").then((m) => m.FlowStory3D), { ssr: false });

/* ─── Nav sections (page order) ─── */
const NAV_ITEMS: { id: string; label: string }[] = [
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "flow", label: "Flow" },
  { id: "partner", label: "Partners" },
  { id: "how", label: "How" },
  { id: "gallery", label: "Gallery" },
  { id: "features", label: "Features" },
  { id: "market", label: "Investors" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

/* ─── FAQ (grounded in the real product) ─── */
const FAQS = [
  { q: "What can I print?", a: "PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX) and images. Choose B&W or colour, single or double-sided, copies and exact page ranges — with a live price before you pay." },
  { q: "Do I need to install an app?", a: "No. Scan the shop's QR and everything runs in your phone's browser. Or skip even that — just forward your file to Printable's WhatsApp number with the shop code." },
  { q: "How do I pay?", a: "UPI, cards and wallets through Razorpay — every payment is webhook-verified before a single page prints. Prefer cash? Pay at the counter and the partner confirms it in one tap." },
  { q: "Is my document really private?", a: "Yes — this is our core promise. Your file uploads to encrypted cloud storage, streams directly to the printer, and auto-deletes. It is never downloaded to, opened on, or stored on the shop's computer." },
  { q: "What do I need to become a print partner?", a: "A Windows PC connected to your printer — that's it. Install the Printable desktop app, place your QR standee on the counter, and you're live. Setup takes under 30 minutes with zero new hardware." },
  { q: "What does it cost a shop?", a: "A simple monthly subscription (₹1–2k) plus a small per-order fee. No hardware to buy, no commission on cash orders, and most partners recover the fee within days from the extra volume." },
  { q: "What happens if a print fails?", a: "The desktop app's crash-safe queue auto-recovers stuck jobs — even after a power cut — and any order can be reprinted in one click. Customers can track their order status live the whole time." },
  { q: "When does the shop get its money?", a: "Online payments settle directly to the partner's account through Razorpay. Cash payments stay at the counter as usual — the dashboard just keeps a clean digital record of everything." },
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
  { icon: "🔒", title: "Private by Design", desc: "Your documents are never saved to or opened on the print partner's computer. They print directly and auto-delete — nobody ever sees your files." },
  { icon: "🔳", title: "QR-Based Entry", desc: "Each shop gets a unique QR code — no app download required, works in any browser." },
  { icon: "📑", title: "PDF Preview", desc: "Customers preview their document before printing to avoid costly mistakes." },
  { icon: "⚙️", title: "Smart Print Config", desc: "Select pages, copies, color mode, single/double-sided — all with an intuitive UI." },
  { icon: "💰", title: "Auto Pricing", desc: "Transparent, auto-calculated pricing based on selections. No surprises." },
  { icon: "🔔", title: "Live Order Tracking", desc: "Unique order IDs let customers track their job status in real time." },
  { icon: "📊", title: "Partner Dashboard", desc: "Print partners see all pending jobs, can confirm, print, and mark complete with one tap." },
  { icon: "💳", title: "Flexible Payments", desc: "Integrated gateway for UPI, cards and wallets — or pay with cash at the counter." },
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

  /* scrollspy — highlight the section currently in view */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="site">
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
          </div>
          <button className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
        <ScrollProgress />
        {menuOpen && (
          <div className="mobile-menu">
            {NAV_ITEMS.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} className="mobile-link">
                {label}
              </button>
            ))}
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
                <span className="hero-badge-dot" /> 🔒 Your documents stay 100% private
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
                <MagneticButton className="btn btn--ghost" onClick={() => scrollTo("contact")}>
                  For shop owners
                </MagneticButton>
              </div>
            </HeroEntrance>
            
            <HeroEntrance delay={4}>
              <div className="hero-trust">
                <div className="trust-item">
                  <span className="trust-icon">🔒</span> End-to-End Encrypted
                </div>
                <div className="trust-item">
                  <span className="trust-icon">🙈</span> Never Shared with the Shop
                </div>
                <div className="trust-item">
                  <span className="trust-icon">⏱️</span> Auto-Deletes after 24h
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
                  <span className="hero-stat-num">24/7</span>
                  <span className="hero-stat-label">self-serve printing</span>
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
          "Upload from your phone",
          "Pay with UPI",
          "It just prints",
          "No queues",
          "No USB drives",
          "No app to install",
          "Order on WhatsApp",
          "Transparent pricing",
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
              Half a billion print jobs a year — <em>still moved by hand.</em>
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
                  Customers scan, configure, and pay — all on their own phone. The print partner receives a ready-to-print
                  job with a single click, while your document stays completely private.
                </p>
              </Reveal>
              <ul className="sol-points">
                {[
                  "Files never shared with the print partner's system",
                  "No USB drives or file transfers via chat",
                  "Automated pricing — no haggling",
                  "Pay online or with cash — your choice",
                  "Print partner dashboard — one-click operations",
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
                  {["📱 Customer Scans QR", "📄 Uploads & Configures", "💳 Pays Online or Cash", "🖨️ Partner Clicks Print", "✅ Order Done"].map((s, i) => (
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

      {/* ── WHATSAPP ORDERING (new) ── */}
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
                  "One number for every Printable shop — just add the shop code",
                  "Bot replies instantly with your print link",
                  "File goes straight to encrypted storage — never to a person",
                ].map((t, i) => (
                  <Reveal key={t} as="li" variant="left" d={i}>
                    <span className="sol-check">✓</span> {t}
                  </Reveal>
                ))}
              </ul>
            </div>
            <Reveal variant="scale" d={2} className="wa-visual">
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
                    #SHP123
                    <span className="wa-meta">10:42 ✓✓</span>
                  </div>
                  <div className="wa-bubble wa-bubble--in">
                    Got your file! 🎉 Tap to choose copies, colour &amp; pay — it prints the moment you&apos;re done:
                    <span className="wa-link">printable.link/d/8kX2</span>
                    <span className="wa-meta">10:42</span>
                  </div>
                  <div className="wa-bubble wa-bubble--in wa-bubble--small">
                    🔒 Your document goes straight to the printer — never shared with the shop.
                    <span className="wa-meta">10:42</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CH.03 FLOW (3D scroll story) ── */}
      <FlowStory3D />

      {/* ── VENDOR GOLDMINE — the 90% punch ── */}
      <section className="vp" aria-label="Value for print partners">
        <div className="wrap">
          <Reveal variant="blur">
            <p className="vp-kicker">🍫 For print partners, it&apos;s a goldmine</p>
          </Reveal>
          <Reveal variant="up" d={1}>
            <div className="vp-lines">
              <span>No downloading files.</span>
              <span>No setting configurations.</span>
              <span>No sending to printer.</span>
            </div>
          </Reveal>
          <Reveal variant="up" d={2}>
            <p className="vp-big">
              <span className="vp-num"><Counter to={90} suffix="%" duration={2000} /></span>
              <em>of the vendor&apos;s job — gone. It just prints.</em>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── CH.03.5 BECOME A PARTNER ── */}
      <section id="partner" className="sec partner">
        <div className="wrap">
          <Chapter
            no="03.5"
            kicker="Become a Print Partner"
            title={<>Your shop, upgraded <em>in 30 minutes.</em></>}
            sub="No new hardware. No training. If your Windows PC can print, you're ready."
          />
          <div className="partner-steps">
            {[
              { n: "01", icon: "💿", title: "Install the desktop app", desc: "One Windows installer. It finds your printers, auto-updates itself, and recovers jobs even after a power cut." },
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
                <span>📈 Up to 30% more revenue</span>
                <span>🧾 Every order digitally recorded</span>
                <span>🚫 Zero pricing disputes</span>
                <span>💚 WhatsApp orders flow in too</span>
              </div>
              <MagneticButton
                className="btn btn--primary"
                onClick={() => { window.location.href = "mailto:darsh.dave999@gmail.com?subject=Print%20Partner%20—%20Onboard%20my%20shop"; }}
              >
                Become a print partner <span className="btn-arrow">→</span>
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CH.04 HOW IT WORKS ── */}
      <section id="how" className="sec sec--alt">
        <div className="wrap">
          <Chapter
            no="04"
            kicker="How It Works"
            title={<>See it <em>in action.</em></>}
            sub="A seamless experience for both customers and print vendors — from scan to delivery."
          />

          <div className="steps-grid">
            {[
              { n: 1, icon: "📷", title: "Scan the QR Code", desc: "Every print shop has a unique QR code at the counter. Scan it with any smartphone camera — no app download needed." },
              { n: 2, icon: "📄", title: "Upload & Configure", desc: "Upload your PDF, choose B&W or Color, select pages & copies, and see the price auto-calculated instantly." },
              { n: 3, icon: "🖨️", title: "Pay & Print's Yours", desc: "Pay securely online or with cash at the counter. The partner's dashboard shows your job instantly — one click and it's printed." },
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
                      After scanning the QR code, customers land on a clean web page where they can upload their file,
                      set print options, preview the document, and pay — all in under 2 minutes.
                    </p>
                    <ul className="demo-points">
                      <li>✓ Upload PDF directly from phone</li>
                      <li>✓ Pick B&W / Color, pages, copies</li>
                      <li>✓ See live price before paying</li>
                      <li>✓ Pay via UPI, card, wallet or cash</li>
                      <li>✓ Files stay private — never seen by the shop</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="demo-panel">
                  <div className="demo-panel-text">
                    <h3>Vendor Dashboard</h3>
                    <p>
                      Print partners get a clean, distraction-free dashboard showing all incoming orders. Every job has
                      file, settings, and customer info pre-filled — no downloading, no configuring, no sending to the
                      printer. Printable removes ~90% of the counter work.
                    </p>
                    <ul className="demo-points">
                      <li>✓ See all pending orders at a glance</li>
                      <li>✓ Print settings pre-filled — files stay private</li>
                      <li>✓ One-click Print Now button</li>
                      <li>✓ Mark orders complete instantly</li>
                      <li>✓ Accept digital payments or cash</li>
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

      {/* ── CH.05 GALLERY ── */}
      <section id="gallery" className="sec">
        <div className="wrap">
          <Chapter
            no="05"
            kicker="App Gallery"
            title={<>See <em>every screen.</em></>}
            sub="A full walkthrough of the Printable app — customer & vendor views. Click any screenshot to enlarge."
          />
          <GallerySection />
        </div>
      </section>

      {/* ── CH.06 FEATURES ── */}
      <section id="features" className="sec sec--alt">
        <div className="wrap">
          <Chapter no="06" kicker="Features" title={<>Everything <em>you need.</em></>} />
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
              { icon: "🖥️", title: "Partner Desktop App", desc: "Native Electron app for Windows. Silent printing via SumatraPDF, DOC/PPT auto-conversion, true-grayscale B&W with MuPDF, and a crash-safe queue that auto-recovers stuck jobs." },
              { icon: "☁️", title: "Encrypted Cloud Storage", desc: "Files upload to Cloudflare R2, stream straight to the printer, and auto-delete. Nothing is ever saved on the shop's computer." },
              { icon: "💚", title: "WhatsApp Cloud API", desc: "Direct Meta integration — one central number, per-shop codes, webhook-verified messages, media pulled server-side into encrypted storage." },
              { icon: "⚡", title: "Real-time Order Pipeline", desc: "Orders reach the shop within 5 seconds. Priority queue with live progress, pause/resume, and per-order printer overrides." },
              { icon: "🏦", title: "Razorpay Payments", desc: "UPI, cards and wallets with HMAC-verified webhooks — every payment confirmed server-side before a single page prints." },
              { icon: "🔄", title: "Auto-updating Fleet", desc: "Every partner machine updates itself silently — 10,000 shops stay on the latest version with zero support calls." },
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

      {/* ── CH.07 INVESTOR STORY ── */}
      <InvestorStory />

      {/* ── CH.08 REVIEWS ── */}
      <section id="reviews" className="sec sec--alt">
        <div className="wrap">
          <Chapter
            no="08"
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

      {/* ── CH.08.5 FAQ ── */}
      <section id="faq" className="sec faq">
        <div className="wrap wrap--narrow">
          <Chapter
            no="08.5"
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
                  >
                    <span>{f.q}</span>
                    <span className="faq-chevron">{faqOpen === i ? "−" : "+"}</span>
                  </button>
                  <div className="faq-a">
                    <p>{f.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CH.09 ABOUT / TEAM ── */}
      <section id="about" className="sec sec--void">
        <div className="wrap">
          <Chapter
            no="09"
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
                <div className="iiit-sub">Your documents print directly and auto-delete — never stored, never shared.</div>
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
              <MagneticButton className="btn btn--ghost cta-ghost" onClick={() => scrollTo("partner")}>
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

      {/* ── CH.10 CONTACT ── */}
      <section id="contact" className="sec">
        <div className="wrap">
          <Chapter
            no="10"
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
              {["solution", "whatsapp", "flow", "gallery", "features", "faq"].map((id) => (
                <button key={id} onClick={() => scrollTo(id)} className="footer-link">
                  {NAV_ITEMS.find((n) => n.id === id)?.label}
                </button>
              ))}
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              {["about", "market", "partner", "reviews", "contact"].map((id) => (
                <button key={id} onClick={() => scrollTo(id)} className="footer-link">
                  {NAV_ITEMS.find((n) => n.id === id)?.label}
                </button>
              ))}
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
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
