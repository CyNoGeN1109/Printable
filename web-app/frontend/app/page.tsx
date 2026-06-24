"use client";

// Printable — company landing. Bold, scroll-animated, 2D (Framer Motion).
// App routes (/upload, /checkout, /admin, /track) are untouched.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Flow from "@/components/landing/Flow";

const ACCENT = "#0C831F";

/* ── helpers ─────────────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

/* ── page ────────────────────────────────────────────────────────────────── */
export default function Landing() {
  const router = useRouter();
  const [trackId, setTrackId] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const track = () => {
    const id = trackId.trim().toUpperCase();
    if (id.length >= 4) router.push(`/track/${id}`);
  };

  return (
    <main className="bg-[#07070A] text-white overflow-x-hidden selection:bg-[#0C831F] selection:text-white">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#07070A]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-lg tracking-tight">
            <span className="w-7 h-7 rounded-lg bg-[#0C831F] flex items-center justify-center text-sm">🖨️</span>
            Printable
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-white/60">
            <a href="#flow" className="hover:text-white transition">How it works</a>
            <a href="#vendors" className="hover:text-white transition">For shops</a>
            <a href="#customers" className="hover:text-white transition">For customers</a>
            <a href="#market" className="hover:text-white transition">Why now</a>
          </div>
          <a href="#cta" className="bg-white text-black text-sm font-black px-4 py-2 rounded-xl hover:bg-white/90 transition">Get started</a>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* aurora */}
        <motion.div
          className="absolute -top-40 -left-32 w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-30"
          style={{ background: ACCENT }}
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-32 w-[36rem] h-[36rem] rounded-full blur-[120px] opacity-20 bg-blue-600"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div style={{ y: heroY, opacity: heroFade }} className="relative z-10 text-center max-w-3xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 border border-white/10 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" /> Built for India's print shops
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              Send a file on WhatsApp.
              <br />
              <span className="bg-gradient-to-r from-[#25D366] via-[#3ad17a] to-[#0C831F] bg-clip-text text-transparent">Pick it up printed.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 text-lg md:text-xl text-white/55 font-medium max-w-2xl mx-auto">
              No app to install, no pen drive, no queue. Customers send files over WhatsApp or scan a QR — the shop's printer does the rest, automatically.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="#cta" className="bg-[#0C831F] text-white font-black px-7 py-3.5 rounded-2xl hover:opacity-90 transition text-base">Bring it to your shop</a>
              <a href="#flow" className="border border-white/15 text-white font-black px-7 py-3.5 rounded-2xl hover:bg-white/5 transition text-base">See how it works ↓</a>
            </div>
          </Reveal>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-bold"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          scroll
        </motion.div>
      </section>

      {/* PROBLEM */}
      <section className="relative py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-sm font-black uppercase tracking-widest text-[#0C831F] mb-4">The problem</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Printing in India is still stuck in 2005.
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5 mt-14 text-left">
            {[
              { icon: "🔌", t: "Pen drives & cables", d: "Customers carry files on USB, email, or hunt for a cable at the counter." },
              { icon: "⏳", t: "Queues at peak", d: "Exam season chaos — staff juggling files, copies and cash by hand." },
              { icon: "💸", t: "Cash & confusion", d: "No record of who paid, what to print, or which job is whose." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 0.08}>
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-7 h-full">
                  <div className="text-3xl mb-4">{c.icon}</div>
                  <h3 className="font-black text-lg">{c.t}</h3>
                  <p className="text-white/50 text-sm font-medium mt-2">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FLOW */}
      <section id="flow" className="relative py-28 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-black uppercase tracking-widest text-[#0C831F] mb-4">How it works</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">From phone to printout in one tap.</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}><Flow /></Reveal>
        </div>
      </section>

      {/* FOR CUSTOMERS */}
      <section id="customers" className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-sm font-black uppercase tracking-widest text-[#25D366] mb-4">For customers</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight max-w-2xl">Order a print in 20 seconds — from anywhere.</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5 mt-14">
            {[
              { n: "01", t: "Send or scan", d: "WhatsApp your files to the shop's number, or scan the counter QR. Zero install." },
              { n: "02", t: "Set it up", d: "Choose copies, colour or B&W, single/double-side — see the price live." },
              { n: "03", t: "Pay your way", d: "UPI / card online, or cash at the counter. Your call." },
              { n: "04", t: "Track & collect", d: "Get a 'your prints are ready' message and pick them up. Done." },
            ].map((c, i) => (
              <Reveal key={c.n} delay={i * 0.06}>
                <div className="flex gap-5 bg-white/[0.03] border border-white/10 rounded-3xl p-7">
                  <div className="text-2xl font-black text-[#0C831F]">{c.n}</div>
                  <div>
                    <h3 className="font-black text-lg">{c.t}</h3>
                    <p className="text-white/50 text-sm font-medium mt-1.5">{c.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOR VENDORS */}
      <section id="vendors" className="relative py-28 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4">For shops</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight max-w-2xl">A complete operating system for your print shop.</h2>
            <p className="text-white/55 text-lg font-medium mt-5 max-w-2xl">Printable's desktop app runs on your shop PC and turns incoming orders into finished prints — while you run the counter.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5 mt-14">
            {[
              { icon: "⚡", t: "Auto-print queue", d: "Paid orders print themselves — colour to the colour printer, B&W to the B&W one." },
              { icon: "🖨️", t: "Live printer health", d: "Out-of-paper, low-toner, jam & offline alerts read straight from the printer." },
              { icon: "📊", t: "Reports & shifts", d: "Daily revenue, busiest hours, CSV export, staff accountability." },
              { icon: "🏪", t: "Multi-shop ready", d: "Each shop, its own QR, pricing and isolated orders — scale to a chain." },
              { icon: "🩸", t: "Real supply levels", d: "Exact toner & paper levels from networked printers via SNMP." },
              { icon: "🔔", t: "Never miss an order", d: "Audible alert + instant on-screen queue the moment a job comes in." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={(i % 3) * 0.06}>
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-7 h-full hover:border-white/20 transition">
                  <div className="text-2xl mb-3">{c.icon}</div>
                  <h3 className="font-black">{c.t}</h3>
                  <p className="text-white/50 text-sm font-medium mt-2">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MARKET */}
      <section id="market" className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <p className="text-sm font-black uppercase tracking-widest text-[#F59E0B] mb-4">Why now</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">A massive, untouched market.</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {[
              { v: <Counter to={300000} suffix="+" />, l: "print & xerox shops across India" },
              { v: <Counter to={750} prefix="₹" suffix=" Cr+" />, l: "spent on prints every year" },
              { v: <Counter to={0} suffix="%" />, l: "of them have software like this" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-10">
                  <div className="text-4xl md:text-5xl font-black text-white tracking-tight">{s.v}</div>
                  <p className="text-white/45 text-sm font-bold mt-3">{s.l}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="text-white/40 text-sm font-medium mt-8 max-w-xl mx-auto">Every shop is a recurring subscription and a transaction stream. Printable is the rails underneath India's most ignored everyday service.</p>
          </Reveal>
        </div>
      </section>

      {/* CTA + TRACK */}
      <section id="cta" className="relative py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#0C831F] to-[#075214] rounded-[2.5rem] p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <Reveal>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight relative z-10">Bring Printable to your shop.</h2>
              <p className="text-white/80 font-medium mt-4 relative z-10">Go live in a day. We'll set up your QR, pricing and printer.</p>
              <a href="mailto:darsh.dave999@gmail.com?subject=Printable%20for%20my%20shop"
                className="inline-block mt-8 bg-white text-[#0C831F] font-black px-8 py-4 rounded-2xl hover:bg-white/90 transition relative z-10">
                Get my shop online →
              </a>
            </Reveal>
          </div>

          {/* track widget */}
          <Reveal delay={0.1}>
            <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm font-black text-white/60 sm:mr-auto">Already ordered? Track it →</span>
              <input
                value={trackId}
                onChange={(e) => setTrackId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && track()}
                placeholder="Order ID (e.g. ABC123)"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#0C831F] w-full sm:w-auto"
              />
              <button onClick={track} className="bg-white text-black font-black text-sm px-5 py-2.5 rounded-xl w-full sm:w-auto">Track</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40 font-medium">
          <div className="flex items-center gap-2 font-black text-white">
            <span className="w-6 h-6 rounded-md bg-[#0C831F] flex items-center justify-center text-xs">🖨️</span>
            Printable
          </div>
          <p>© {new Date().getFullYear()} Printable — printing, reinvented for India.</p>
          <Link href="/admin" className="hover:text-white transition">Shop admin</Link>
        </div>
      </footer>
    </main>
  );
}
