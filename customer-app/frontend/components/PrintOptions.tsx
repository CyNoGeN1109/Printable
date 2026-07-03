// FILE: apps/web/components/PrintOptions.tsx
// Print configuration — copies, colour/B&W, duplex toggle

"use client";

import type { PrintConfig } from "@/lib/types";

interface Props {
  config: PrintConfig;
  onChange: (config: PrintConfig) => void;
}

export default function PrintOptions({ config, onChange }: Props) {
  const set = (patch: Partial<PrintConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xs tracking-widest uppercase text-[#6b6860] mb-4">Print Options</h3>

      {/* Copies */}
      <div className="bg-[#1a1916] border border-[#2e2c28] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Copies</p>
          <p className="text-xs text-[#6b6860]">How many copies to print</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => set({ copies: Math.max(1, config.copies - 1) })}
            className="w-8 h-8 bg-[#0f0e0c] border border-[#2e2c28] rounded-lg text-[#a09c90] hover:border-[#e8642a] hover:text-[#e8642a] transition-colors text-lg font-bold flex items-center justify-center"
          >
            −
          </button>
          <span className="text-lg font-bold w-6 text-center">{config.copies}</span>
          <button
            onClick={() => set({ copies: Math.min(50, config.copies + 1) })}
            className="w-8 h-8 bg-[#0f0e0c] border border-[#2e2c28] rounded-lg text-[#a09c90] hover:border-[#e8642a] hover:text-[#e8642a] transition-colors text-lg font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Colour */}
      <div className="bg-[#1a1916] border border-[#2e2c28] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Colour printing</p>
          <p className="text-xs text-[#6b6860]">{config.colour ? "Full colour (+₹5/page)" : "Black & white"}</p>
        </div>
        <button
          onClick={() => set({ colour: !config.colour })}
          className={`w-12 h-6 rounded-full transition-colors relative ${config.colour ? "bg-[#e8642a]" : "bg-[#2e2c28]"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.colour ? "translate-x-6" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      {/* Duplex */}
      <div className="bg-[#1a1916] border border-[#2e2c28] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Double-sided (duplex)</p>
          <p className="text-xs text-[#6b6860]">{config.duplex ? "Printing both sides" : "Single-sided only"}</p>
        </div>
        <button
          onClick={() => set({ duplex: !config.duplex })}
          className={`w-12 h-6 rounded-full transition-colors relative ${config.duplex ? "bg-[#e8642a]" : "bg-[#2e2c28]"}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.duplex ? "translate-x-6" : "translate-x-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}