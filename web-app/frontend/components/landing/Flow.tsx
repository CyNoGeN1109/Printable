"use client";

// Animated phone → Printable → shop printer flow. A document packet travels the
// pipeline on a loop while each stage lights up in sequence. Pure 2D / Framer
// Motion — reliable everywhere, no WebGL.

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const STAGES = [
  { icon: "📱", title: "Customer sends", sub: "Files on WhatsApp or a QR scan", glow: "#25D366" },
  { icon: "⚡", title: "Printable routes", sub: "Straight to the right shop", glow: "#0C831F" },
  { icon: "🖨️", title: "Shop auto-prints", sub: "No staff hunting for files", glow: "#3B82F6" },
  { icon: "📄", title: "Ready to collect", sub: "Customer picks it up", glow: "#F59E0B" },
];

export default function Flow() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Connector track */}
      <div className="absolute top-[40px] left-[12%] right-[12%] h-0.5 bg-white/10 hidden md:block">
        <motion.div
          className="h-full bg-gradient-to-r from-[#25D366] via-[#0C831F] to-[#F59E0B]"
          animate={{ width: `${(stage / (STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        {/* Travelling packet */}
        <motion.div
          className="absolute -top-3.5 -ml-3.5 w-7 h-7 rounded-full bg-white shadow-lg shadow-white/30 flex items-center justify-center text-sm"
          animate={{ left: `${(stage / (STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          📄
        </motion.div>
      </div>

      {/* Stages */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-2">
        {STAGES.map((s, i) => {
          const active = i === stage;
          return (
            <div key={s.title} className="flex flex-col items-center text-center px-2">
              <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl relative z-10 border"
                animate={{
                  scale: active ? 1.12 : 1,
                  backgroundColor: active ? `${s.glow}22` : "rgba(255,255,255,0.04)",
                  borderColor: active ? s.glow : "rgba(255,255,255,0.08)",
                  boxShadow: active ? `0 0 40px ${s.glow}66` : "0 0 0px transparent",
                }}
                transition={{ duration: 0.5 }}
              >
                {s.icon}
              </motion.div>
              <motion.h4
                className="mt-4 font-black text-white text-sm md:text-base"
                animate={{ opacity: active ? 1 : 0.55 }}
              >
                {s.title}
              </motion.h4>
              <p className="text-xs text-white/40 font-medium mt-1 max-w-[140px]">{s.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
