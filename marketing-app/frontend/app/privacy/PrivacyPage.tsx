"use client";
import { Reveal, SmoothScroll, scrollToTop } from "../_home/fx";

export default function PrivacyPage() {
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
            <a href="/vendor" className="nav-link">For print shops</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="pv-hero">
        <div className="wrap">
          <Reveal variant="blur">
            <h1>Privacy, <em>by architecture.</em></h1>
          </Reveal>
          <Reveal variant="up" d={1}>
            <p>
              Most privacy pages ask you to trust a policy. Ours describes a pipeline. Here is exactly
              what happens to your document from the moment you upload it — and when it stops existing.
            </p>
          </Reveal>
        </div>
      </header>

      <section className="pv-sec">
        <div className="wrap wrap--narrow">
          <Reveal variant="up">
            <div className="pv-card">
              <h2>📱 Your file&apos;s lifecycle</h2>
              <ul>
                <li><span className="sol-check">1.</span><span><strong>Upload goes straight to encrypted cloud storage.</strong> On the web, your browser uploads directly to Cloudflare R2 using a short-lived, pre-signed link (valid 15 minutes) — the file never passes through our API servers. Files sent on WhatsApp are fetched from Meta by our server and moved straight into the same encrypted storage.</span></li>
                <li><span className="sol-check">2.</span><span><strong>It waits, out of sight.</strong> The file sits behind a long, unguessable storage link. The public tracking API never returns storage links, and the shop&apos;s desktop app signs in with its own secret key — requests made with a shop&apos;s key can only see and act on that shop&apos;s orders.</span></li>
                <li><span className="sol-check">3.</span><span><strong>Software prints it — not a person.</strong> The shop&apos;s Printable Vendor app downloads the file, converts it if needed, and prints it silently with your exact settings. Nobody opens, reads, or previews your document at the counter.</span></li>
                <li><span className="sol-check">4.</span><span><strong>The local copy is wiped.</strong> The temporary file on the shop&apos;s PC is deleted immediately after printing.</span></li>
                <li><span className="sol-check">5.</span><span><strong>The cloud copy is purged.</strong> The moment your order is completed (or cancelled), the file is deleted from cloud storage. A scheduled sweep also runs every 4 hours and removes anything older than 4 hours — so even an upload you abandoned halfway is gone within about 8 hours at the outside. WhatsApp draft links expire after 4 hours.</span></li>
              </ul>
              <p className="pv-note">
                To be precise: files are processed briefly on the shop&apos;s computer in order to print — that&apos;s
                how printing works — but they are handled entirely by software, never displayed, and wiped right after.
              </p>
            </div>
          </Reveal>

          <Reveal variant="up" d={1}>
            <div className="pv-card">
              <h2>🗂️ What we keep (and what we don&apos;t)</h2>
              <ul>
                <li><span className="sol-check">✓</span><span><strong>Order metadata:</strong> file names, page counts, print settings, amount, your first name, and a short order ID like ABC123 — so the shop can hand you the right prints and keep clean records.</span></li>
                <li><span className="sol-check">✓</span><span><strong>No accounts, no passwords, no OTPs.</strong> Ordering asks only for your name. There is nothing to sign up for and no profile to leak.</span></li>
                <li><span className="sol-check">✓</span><span><strong>WhatsApp numbers stay server-side.</strong> If you order via WhatsApp, your number is used to send you the &quot;ready to collect&quot; message — the public tracking API never returns it.</span></li>
                <li><span className="sol-check">✗</span><span><strong>We do not keep your documents.</strong> Deleted on completion, and a cleanup job sweeps everything else on a 4-hour cycle — abandoned uploads are gone within hours, not days.</span></li>
              </ul>
            </div>
          </Reveal>

          <Reveal variant="up" d={2}>
            <div className="pv-card">
              <h2>🛡️ Security practices</h2>
              <ul>
                <li><span className="sol-check">✓</span><span><strong>Signed webhooks:</strong> both Razorpay payment confirmations and WhatsApp messages are verified with HMAC-SHA256 signatures (timing-safe comparison) before we act on them.</span></li>
                <li><span className="sol-check">✓</span><span><strong>Scoped shop keys:</strong> requests made with a shop&apos;s key can only see and act on that shop&apos;s own orders — cross-shop access is rejected.</span></li>
                <li><span className="sol-check">✓</span><span><strong>Hardened API:</strong> security headers, a CORS allowlist, per-endpoint rate limits, strict order-ID validation, and SSRF protection on file URLs.</span></li>
                <li><span className="sol-check">✓</span><span><strong>Payments verified before printing:</strong> an online order only prints after the payment-captured event is verified server-side.</span></li>
              </ul>
            </div>
          </Reveal>

          <Reveal variant="up" d={3}>
            <div className="pv-card">
              <h2>✉️ Questions?</h2>
              <p>
                Privacy questions, deletion requests, or a security report? Write to{" "}
                <a href="mailto:darsh.dave999@gmail.com" style={{ color: "var(--accent)", fontWeight: 700 }}>
                  darsh.dave999@gmail.com
                </a>{" "}
                — we respond within 24 hours.
              </p>
              <p className="pv-note">Printable is a product of Cynogen · Indore (MP), India.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-glow" aria-hidden />
        <div className="footer-inner">
          <div className="footer-bottom" style={{ borderTop: "none", paddingTop: 0 }}>
            <span>© 2026 Cynogen. All rights reserved. · <a href="/" style={{ color: "inherit" }}>Home</a> · <a href="/vendor" style={{ color: "inherit" }}>For print shops</a></span>
          </div>
        </div>
      </footer>

      <button className="to-top is-visible" onClick={scrollToTop} aria-label="Back to top">↑</button>
    </div>
  );
}
