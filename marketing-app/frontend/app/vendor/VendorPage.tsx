"use client";
import { useState, useEffect } from "react";
import {
  Reveal, Chapter, MagneticButton, SmoothScroll, Counter, scrollToTop, scrollToId,
} from "../_home/fx";

/* ───────────────────────────────────────────────────────────────────────────
   The real staged pipeline from the desktop app's queue — looping demo.
   Stages mirror src/main/queue.ts in the vendor app.
   ─────────────────────────────────────────────────────────────────────────── */
const STAGES = [
  { icon: "📡", name: "Fetching Order", pct: "10%" },
  { icon: "☁️", name: "Downloading Documents", pct: "35%" },
  { icon: "🖨️", name: "Physical Printing in Progress", pct: "65–95%" },
  { icon: "✨", name: "Finalizing", pct: "done" },
];

function PipelineConsole() {
  const [on, setOn] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOn((s) => (s + 1) % STAGES.length), 2250);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="vos-console" aria-label="Printing pipeline demo">
      <div className="vos-console-bar">
        <span /><span /><span />
        <span className="vos-console-title">Printable Vendor — Now Printing</span>
      </div>
      <div className="vos-console-body">
        <div className="vos-order">
          <div>
            <div className="vos-order-id">#QK7M2P</div>
            <div className="vos-order-meta">Assignment_Unit4.pdf · 12 pages × 2 · B&amp;W · Both sides · Pages 1-3, 5</div>
          </div>
          <span className="vos-badge">Paid · confirmed</span>
        </div>
        <div className="vos-stages">
          {STAGES.map((s, i) => (
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

const SETUP_STEPS = [
  { n: "01", title: "Install", desc: <>Run <code>Printable_Setup.exe</code> on any Windows PC that can print. Desktop shortcut, start-menu entry, done.</> },
  { n: "02", title: "Link your shop", desc: <>The first-run screen — <em>“Welcome to Printable”</em> — asks for your shop name and your <code>sk_…</code> setup key from onboarding.</> },
  { n: "03", title: "Start receiving orders", desc: <>Hit <em>“Link shop &amp; start.”</em> The app polls for your shop&apos;s orders every 5 seconds, can start with Windows automatically, and ships with a built-in auto-updater.</> },
];

const AUTOMATION = [
  { icon: "🔔", title: "Orders chime in — no refresh", desc: <>The app checks for new orders every 5 seconds and plays a two-tone chime the moment one lands. Once payment is confirmed, the job queues itself — <strong>zero clicks</strong> after that.</> },
  { icon: "💵", title: "Cash is one keystroke", desc: <>Walk-in cash order? A <em>“New Cash Order”</em> card shows every file and <em>“Collect from customer ₹X”</em>. Press Enter — <em>“✓ Cash Received”</em> — and the job starts printing.</> },
  { icon: "📄", title: "Word & PowerPoint handled", desc: <>DOC/DOCX and PPT/PPTX auto-convert to PDF via Microsoft Office — with a headless LibreOffice fallback if Office isn&apos;t installed. 16 file formats handled end to end.</> },
  { icon: "🖤", title: "True grayscale B&W", desc: <>B&amp;W jobs are converted to real grayscale with MuPDF in milliseconds before printing — so your colour toner is never wasted on black pages.</> },
  { icon: "🔀", title: "Two printers, zero thinking", desc: <>Assign a B&amp;W printer and a colour printer. Mixed orders split automatically — <code>ABC123</code> + <code>ABC123-COLOUR</code> — and each file routes to the right machine.</> },
  { icon: "🎛️", title: "Full queue control", desc: <>A live <em>Now Printing</em> bar with staged progress, plus Pause / Resume / Stop Job. Cancelling reverts the order to paid so nothing is ever lost.</> },
];

const RESILIENCE = [
  { icon: "⚡", title: "Survives power cuts", desc: "Killed mid-print? On restart, orders stuck in “printing” reset to paid and re-queue themselves. No lost jobs, no confused customers." },
  { icon: "📶", title: "Rides out outages", desc: "The job on the printer isn't interrupted when the internet drops — its file is already on disk. The moment you're back online, waiting orders pick up automatically." },
  { icon: "🛠️", title: "Errors halt, never drop", desc: "A printer error pauses the queue without dropping the job. Fix the jam, hit Resolve, and it retries. Selecting a new printer auto-retries too." },
  { icon: "🔁", title: "One-click reprint", desc: "The last 50 orders live in searchable history — find a recent job by customer name, order ID, or file name and re-queue it in one click." },
];

const BUSINESS = [
  { icon: "📊", title: "Reports that run the shop", desc: "Revenue, completed orders, pages printed and average order value for today, 7 days or 30 days — plus a busiest-hours histogram so you staff the rush." },
  { icon: "🩸", title: "Toner planning built in", desc: "Every report splits B&W vs colour pages, and CSV export gives your accountant per-order lines: ID, customer, payment, page counts, amount." },
  { icon: "👥", title: "Staff & Shifts, PIN-locked", desc: "Add counter staff with numeric PINs. Each shift shows who's on, live elapsed time, orders handled, and ₹ collected — accountability without paperwork." },
  { icon: "🎀", title: "Finishing charges", desc: "Record your own prices for soft binding, spiral binding, lamination and stapling right in the app — your rates, always at hand at the counter." },
  { icon: "🔑", title: "Your key, your orders only", desc: "Every request your app makes is signed with your shop's secret key and scoped to your shop's own orders." },
  { icon: "🌙", title: "Open and close in one switch", desc: "A master System online/offline toggle halts order intake and the queue when you close the shutter — and resumes everything in the morning." },
];

export default function VendorPage() {
  return (
    <div className="site">
      <SmoothScroll />

      {/* ── minimal nav ── */}
      <nav className="nav nav--scrolled">
        <div className="nav-inner">
          <a href="/" className="logo" style={{ textDecoration: "none" }}>
            <img src="/printable-logo.jpeg" alt="Printable logo" className="logo-img" />
            Print<span>able</span>
          </a>
          <div className="nav-links nav-links--always">
            <a href="/" className="nav-link">← Home</a>
            <a href="/privacy" className="nav-link nav-hide-sm">Privacy</a>
            <a
              href="mailto:darsh.dave999@gmail.com?subject=Print%20Partner%20—%20Onboard%20my%20shop"
              className="nav-link nav-cta"
            >
              Get your setup key →
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="vd-hero">
        <div className="wrap" style={{ width: "100%" }}>
          <div className="vd-hero-layout">
            <div>
              <Reveal variant="blur">
                <span className="vd-kicker">🖥️ Printable Vendor · Windows</span>
              </Reveal>
              <Reveal variant="up" d={1}>
                <h1 className="vd-title">
                  Your print shop,<br /><em>on autopilot.</em>
                </h1>
              </Reveal>
              <Reveal variant="up" d={2}>
                <p className="vd-sub">
                  Complete operating software for print shops. Orders chime in and print themselves —
                  downloaded, converted, routed to the right printer, and marked done — while you just
                  hand over pages and collect the money.
                </p>
              </Reveal>
              <Reveal variant="up" d={3}>
                <div className="vd-actions">
                  <MagneticButton
                    className="btn btn--primary"
                    onClick={() => { window.location.href = "mailto:darsh.dave999@gmail.com?subject=Print%20Partner%20—%20Onboard%20my%20shop&body=Shop%20name%3A%0ACity%3A%0APrinters%20(B%26W%2Fcolour)%3A"; }}
                  >
                    Become a print partner <span className="btn-arrow">→</span>
                  </MagneticButton>
                  <MagneticButton
                    className="btn btn--ghost cta-ghost"
                    onClick={() => scrollToId("setup")}
                  >
                    See the 5-minute setup
                  </MagneticButton>
                </div>
              </Reveal>
              <Reveal variant="up" d={4}>
                <div className="vd-req">
                  <span>✓ Any Windows PC that can print</span>
                  <span>✓ No new hardware</span>
                  <span>✓ Built-in auto-updater</span>
                </div>
              </Reveal>
            </div>
            <Reveal variant="scale" d={2}>
              <div className="vd-shot">
                <img src="/screenshots/screen-11.png" alt="Printable Vendor dashboard — live orders, revenue and queue" />
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ── SETUP ── */}
      <section id="setup" className="vd-sec">
        <div className="wrap">
          <Chapter
            no="01"
            kicker="Setup"
            title={<>Live in <em>five minutes.</em></>}
            sub="If your PC can print, you're three steps from receiving orders."
          />
          <div className="vd-steps">
            {SETUP_STEPS.map((s, i) => (
              <Reveal key={s.n} d={i} variant="up">
                <div className="vd-step">
                  <span className="vd-step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section className="vd-sec vd-sec--alt">
        <div className="wrap">
          <Chapter
            no="02"
            kicker="The Pipeline"
            title={<>Paid orders print with <em>zero clicks.</em></>}
            sub="The exact staged pipeline running at every counter — fetch, download, print, finish."
          />
          <div className="vos-layout" style={{ marginTop: "2.5rem" }}>
            <Reveal variant="left">
              <PipelineConsole />
            </Reveal>
            <div>
              <Reveal variant="up" d={1}>
                <p className="sol-desc" style={{ marginBottom: "1.5rem" }}>
                  When an online-paid order arrives, the app fetches it, downloads the documents,
                  converts what needs converting, and silent-prints with the exact settings the
                  customer chose — copies, single or double-sided, portrait or landscape, A4, and
                  page ranges like <code style={{ background: "var(--surface-2)", padding: "0.1rem 0.4rem", borderRadius: 6, border: "1px solid var(--border)", fontSize: "0.85em" }}>1-3, 5</code>.
                  No dialogs ever open. No one touches the mouse.
                </p>
              </Reveal>
              <ul className="sol-points">
                {[
                  "Live progress paced to your job — about 3 seconds per page",
                  "Downloaded files wiped after every print",
                  "Order marked completed on the backend automatically",
                  "WhatsApp customers get a ping: “✅ Your prints are ready to collect!”",
                  "A native “Print Successful” notification at the counter",
                ].map((t, i) => (
                  <Reveal key={t} as="li" variant="left" d={i + 1}>
                    <span className="sol-check">✓</span> <span>{t}</span>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── AUTOMATION GRID ── */}
      <section className="vd-sec">
        <div className="wrap">
          <Chapter
            no="03"
            kicker="Automation"
            title={<>The counter work <em>does itself.</em></>}
          />
          <div className="vd-feat-grid">
            {AUTOMATION.map((f, i) => (
              <Reveal key={f.title} d={i % 2} variant="up">
                <div className="vd-feat">
                  <span className="vd-feat-icon">{f.icon}</span>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARDWARE BAND ── */}
      <section className="vd-band">
        <div className="wrap">
          <Reveal variant="blur">
            <h2>It watches your printers <em>so you don&apos;t have to.</em></h2>
          </Reveal>
          <Reveal variant="up" d={1}>
            <p>
              Paper jams, empty trays, open doors, low toner — 11 distinct printer states detected every
              few seconds, surfaced as alerts before the customer notices. Network printers report exact
              supply percentages over SNMP, per cartridge and per paper tray.
            </p>
          </Reveal>
          <div className="vproof-grid" style={{ maxWidth: 960, margin: "0 auto" }}>
            <Reveal variant="up" d={0}>
              <div className="vproof-card">
                <span className="vproof-icon">🩸</span>
                <h4>Live supply levels</h4>
                <p>Exact percentages straight from the printer — not a vague low-ink light.</p>
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
                <span className="vproof-icon">🚨</span>
                <h4>Problems, named</h4>
                <p>Every state has a plain-language message — “Paper jam — clear the printer”, “Out of paper — refill tray”.</p>
                <div className="vchips">
                  <span className="vchip vchip--ok">✅ Ready</span>
                  <span className="vchip vchip--warn">⚠️ Toner low</span>
                  <span className="vchip vchip--bad">🚫 Paper jam</span>
                  <span className="vchip vchip--bad">🚪 Door open</span>
                  <span className="vchip vchip--warn">📥 Tray full</span>
                  <span className="vchip vchip--bad">🛠️ Needs service</span>
                </div>
              </div>
            </Reveal>
            <Reveal variant="up" d={2}>
              <div className="vproof-card">
                <span className="vproof-icon">🧪</span>
                <h4>One-click checks</h4>
                <p>Fire a test page on any printer, see jobs waiting in each spooler, and set your B&amp;W and colour defaults right from the Hardware page.</p>
                <div className="vchips">
                  <span className="vchip">🖤 Set B&amp;W</span>
                  <span className="vchip">🎨 Set Colour</span>
                  <span className="vchip vchip--ok">🧪 Test page</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── RESILIENCE ── */}
      <section className="vd-sec vd-sec--alt">
        <div className="wrap">
          <Chapter
            no="04"
            kicker="Reliability"
            title={<>It never loses <em>an order.</em></>}
            sub="Built for real shops: power cuts, flaky Wi-Fi, jammed printers, and rush hours."
          />
          <div className="vd-feat-grid">
            {RESILIENCE.map((f, i) => (
              <Reveal key={f.title} d={i % 2} variant="up">
                <div className="vd-feat">
                  <span className="vd-feat-icon">{f.icon}</span>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUSINESS ── */}
      <section className="vd-sec">
        <div className="wrap">
          <Chapter
            no="05"
            kicker="Business Tools"
            title={<>Run the shop, <em>not spreadsheets.</em></>}
          />
          <div className="vd-feat-grid">
            {BUSINESS.map((f, i) => (
              <Reveal key={f.title} d={i % 2} variant="up">
                <div className="vd-feat">
                  <span className="vd-feat-icon">{f.icon}</span>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="vd-band">
        <div className="wrap">
          <Reveal variant="blur">
            <h2>Ready to put your counter <em>on autopilot?</em></h2>
          </Reveal>
          <Reveal variant="up" d={1}>
            <p>
              A Windows PC, your printers, and a setup key — that&apos;s the whole requirement.
              Most shops are live in under <strong style={{ color: "var(--bright)" }}><Counter to={30} suffix=" minutes" /></strong>.
            </p>
          </Reveal>
          <Reveal variant="up" d={2}>
            <div className="cta-actions" style={{ justifyContent: "center" }}>
              <MagneticButton
                className="btn btn--primary"
                onClick={() => { window.location.href = "mailto:darsh.dave999@gmail.com?subject=Print%20Partner%20—%20Onboard%20my%20shop&body=Shop%20name%3A%0ACity%3A%0APrinters%20(B%26W%2Fcolour)%3A"; }}
              >
                Get your setup key <span className="btn-arrow">→</span>
              </MagneticButton>
              <MagneticButton className="btn btn--ghost cta-ghost" onClick={() => { window.location.href = "/"; }}>
                Back to Printable.com
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-glow" aria-hidden />
        <div className="footer-inner">
          <div className="footer-bottom" style={{ borderTop: "none", paddingTop: 0 }}>
            <span>© 2026 Cynogen. All rights reserved. Printable is a product of Cynogen. · <a href="/" style={{ color: "inherit" }}>Home</a> · <a href="/privacy" style={{ color: "inherit" }}>Privacy</a></span>
          </div>
        </div>
      </footer>

      <button className="to-top is-visible" onClick={scrollToTop} aria-label="Back to top">↑</button>
    </div>
  );
}
