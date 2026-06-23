// FILE: apps/web/app/print/[draftId]/page.tsx
// WhatsApp draft → configure & checkout. Opened from the link the bot sends.
// A draft may hold MULTIPLE files (collected from one WhatsApp burst). Shows a
// tab per file with its own print settings, then hands off to /checkout.

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PrintOptionCard from "@/components/PrintOptionCard";
import PageRangeSelector from "@/components/PageRangeSelector";
import PriceCalc from "@/components/PriceCalc";
import { api } from "@/lib/api";
import { calculatePrice, countPagesInRange } from "@/lib/price";
import type { PrintConfig } from "@/lib/types";
import storeConfig from "../../../store.config.json";

const PdfPreview = dynamic(() => import("@/components/PdfPreview"), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-[#E8E8E8] rounded-2xl min-h-[380px] flex items-center justify-center shadow-sm">
      <div style={{ width: 28, height: 28, border: "3px solid #E8E8E8", borderTopColor: "#0C831F", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  ),
});

const DEFAULT_CONFIG: PrintConfig = {
  pageRange: "all",
  totalPages: 1,
  pages: 1,
  copies: 1,
  colour: false,
  duplex: false,
  orientation: "portrait",
};

interface DraftFile { fileName: string; fileUrl: string; }
interface Draft { draftId: string; shopCode: string; files: DraftFile[]; userName: string; }

export default function PrintDraftPage() {
  const { draftId } = useParams<{ draftId: string }>();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [configs, setConfigs] = useState<Record<number, PrintConfig>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [shopName, setShopName] = useState("");

  // Prefetch checkout so "Add to cart" navigates instantly.
  useEffect(() => { router.prefetch("/checkout"); }, [router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getDraft(draftId)
      .then(async (d) => {
        if (cancelled) return;
        setDraft(d);
        const init: Record<number, PrintConfig> = {};
        (d.files ?? []).forEach((_, i) => { init[i] = { ...DEFAULT_CONFIG }; });
        setConfigs(init);
        // Load the shop's pricing so the displayed price matches the charge.
        try {
          if (d.shopCode) {
            const s = await api.getShopPublic(d.shopCode);
            if (s?.pricing) sessionStorage.setItem("shopPricing", JSON.stringify(s.pricing));
            if (s?.name) setShopName(s.name);
          } else {
            sessionStorage.removeItem("shopPricing");
          }
        } catch { /* fall back to global pricing */ }
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setLoadError("This print link has expired or is invalid."); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [draftId]);

  const files = draft?.files ?? [];
  const activeFile = files[activeIdx];
  const activeConfig = configs[activeIdx] ?? DEFAULT_CONFIG;

  const update = (patch: Partial<PrintConfig>) =>
    setConfigs((prev) => ({ ...prev, [activeIdx]: { ...(prev[activeIdx] ?? DEFAULT_CONFIG), ...patch } }));

  // File type of the ACTIVE file
  const name = (activeFile?.fileName ?? "").toLowerCase();
  const isPdf = name.endsWith(".pdf");
  const isImage = /\.(jpe?g|png|webp|gif|bmp|heic)$/.test(name);
  const isDocx = name.endsWith(".docx") || name.endsWith(".doc");
  const isPpt = name.endsWith(".ppt") || name.endsWith(".pptx");
  const isDocument = isPdf || isDocx || isPpt;

  // R2 has no CORS, so pdf.js loads via the same-origin proxy. Images load fine in
  // an <img>. Orders always use the real R2 url.
  const previewUrl = activeFile ? `/api/file?url=${encodeURIComponent(activeFile.fileUrl)}` : "";

  // Combined totals across all files (for bulk pricing + the grand total)
  const totalPagesInOrder = files.reduce((sum, _, i) => {
    const c = configs[i] ?? DEFAULT_CONFIG;
    return sum + countPagesInRange(c.pageRange, c.totalPages) * c.copies;
  }, 0);
  const grandTotal = files.reduce((sum, _, i) => sum + calculatePrice(configs[i] ?? DEFAULT_CONFIG, totalPagesInOrder).total, 0);

  const handleNext = () => {
    if (!draft) return;
    const jobs = files.map((f, i) => ({
      fileUrl: f.fileUrl,
      fileName: f.fileName,
      config: configs[i] ?? DEFAULT_CONFIG,
    }));
    sessionStorage.setItem("printJobs", JSON.stringify(jobs));
    sessionStorage.setItem("whatsappDraftId", draft.draftId); // lets the backend message the customer when ready
    if (draft.userName) sessionStorage.setItem("userName", draft.userName);
    router.push("/checkout");
  };

  return (
    <main className="min-h-screen bg-[#F2F3F7] text-[#1A1A1A] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#F2F3F7] border-b border-[#E8E8E8]">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#E8E8E8] hover:bg-[#F8FDF8] transition-colors shadow-sm"
          >
            <span className="text-lg text-[#1A1A1A]">‹</span>
          </button>
          <h1 className="text-sm font-bold flex items-center gap-1.5">
            <span className="text-base">{shopName ? "🏪" : "💬"}</span> {shopName || "From WhatsApp"}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3 animate-fadeUp">
            <div className="h-[380px] bg-white border border-[#E8E8E8] rounded-2xl animate-pulse" />
            <div className="h-16 bg-white border border-[#E8E8E8] rounded-2xl animate-pulse" />
            <div className="h-40 bg-white border border-[#E8E8E8] rounded-2xl animate-pulse" />
          </div>
        )}

        {/* Error */}
        {!loading && loadError && (
          <div className="bg-white border border-[#E8E8E8] rounded-2xl p-8 text-center animate-fadeUp">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-[#D32F2F] text-sm font-bold mb-1">Link not available</p>
            <p className="text-[#999] text-xs leading-relaxed max-w-[260px] mx-auto">{loadError}</p>
            <p className="text-[#999] text-xs mt-3">Send the file again on WhatsApp to get a fresh link.</p>
          </div>
        )}

        {/* Loaded */}
        {!loading && draft && activeFile && (
          <div className="space-y-4 animate-fadeUp">
            {/* File tabs (only when more than one file) */}
            {files.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {files.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveIdx(i); setCurrentPage(1); }}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                      activeIdx === i
                        ? "bg-[#0C831F] text-white border-transparent shadow-md shadow-[#0C831F]/20"
                        : "bg-white text-[#666] border-[#E8E8E8]"
                    }`}
                    title={f.fileName}
                  >
                    File {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* File name banner */}
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-lg">📎</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#0C831F] uppercase tracking-wider">
                  {files.length > 1 ? `File ${activeIdx + 1} of ${files.length}` : "Your file"}
                </p>
                <p className="text-sm font-semibold text-[#1B5E20] truncate">{activeFile.fileName}</p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-[#F2F3F7] rounded-2xl">
              {isPdf ? (
                <PdfPreview
                  key={`${activeIdx}-${activeFile.fileUrl}`}
                  fileUrl={previewUrl}
                  colour={activeConfig.colour}
                  orientation={activeConfig.orientation}
                  currentPage={currentPage}
                  totalPages={activeConfig.totalPages}
                  onTotalPages={(n) => update({ totalPages: n, pages: countPagesInRange(activeConfig.pageRange, n) })}
                  onPageChange={setCurrentPage}
                />
              ) : isImage ? (
                <div className="relative bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-4 text-center">
                  <div className="flex items-center justify-center min-h-[300px]">
                    <img
                      key={activeFile.fileUrl}
                      src={activeFile.fileUrl}
                      alt={activeFile.fileName}
                      className="max-w-full max-h-[350px] rounded-lg shadow-md object-contain"
                      style={{
                        filter: activeConfig.colour ? "none" : "grayscale(100%)",
                        transform: activeConfig.orientation === "landscape" ? "rotate(-90deg) scale(0.75)" : "none",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-8 text-center overflow-hidden">
                  <div className="flex flex-col items-center justify-center min-h-[280px] gap-6">
                    <div className={`w-24 h-32 bg-gradient-to-br ${isDocx ? "from-[#4285F4] to-[#1967D2]" : isPpt ? "from-[#FF5722] to-[#D84315]" : "from-[#666] to-[#444]"} rounded-xl flex flex-col items-center justify-center shadow-2xl`}>
                      <span className="text-white text-4xl mb-2 drop-shadow-md">{isPpt ? "📊" : "📄"}</span>
                      <div className="bg-black/10 py-1 px-2 rounded">
                        <span className="text-white text-[12px] font-black uppercase tracking-[0.2em]">
                          {isDocx ? "DOCX" : isPpt ? "PPT" : activeFile.fileName.split(".").pop()?.toUpperCase() || "FILE"}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-[#1A1A1A] truncate px-4 max-w-[320px]">{activeFile.fileName}</h3>
                  </div>
                </div>
              )}
            </div>

            {/* Copies */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E8E8] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Number of copies</p>
                <p className="text-xs text-[#999] mt-0.5">{activeConfig.totalPages} page{activeConfig.totalPages > 1 ? "s" : ""}</p>
              </div>
              <div className="flex items-center gap-3 bg-[#0C831F] text-white rounded-xl px-2 py-1 shadow-md shadow-[#0C831F]/20">
                <button onClick={() => update({ copies: Math.max(1, activeConfig.copies - 1) })} className="w-7 h-7 flex items-center justify-center text-lg font-bold">−</button>
                <span className="font-bold w-4 text-center">{activeConfig.copies}</span>
                <button onClick={() => update({ copies: Math.min(50, activeConfig.copies + 1) })} className="w-7 h-7 flex items-center justify-center text-lg font-bold">+</button>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8E8E8] space-y-5">
              {isDocument && activeConfig.totalPages > 1 && (
                <div className="pb-5 border-b border-[#F2F3F7]">
                  <PageRangeSelector
                    totalPages={activeConfig.totalPages}
                    pageRange={activeConfig.pageRange}
                    onChange={(range) => update({ pageRange: range, pages: countPagesInRange(range, activeConfig.totalPages) })}
                  />
                </div>
              )}

              <PrintOptionCard
                title="Choose print color"
                options={[
                  { value: "colour", label: "Coloured", sublabel: `${storeConfig.currencySymbol}${storeConfig.pricing.colorPerPage}/page`, icon: "🎨" },
                  { value: "bw", label: "B & W", sublabel: `${storeConfig.currencySymbol}${storeConfig.pricing.bwPerPage}/page`, icon: "🖤" },
                ]}
                value={activeConfig.colour ? "colour" : "bw"}
                onChange={(v) => update({ colour: v === "colour" })}
              />

              <PrintOptionCard
                title="Choose print sides"
                options={[
                  { value: "single", label: "Single side", icon: "📃" },
                  { value: "double", label: "Both sides", icon: "📄" },
                ]}
                value={activeConfig.duplex ? "double" : "single"}
                onChange={(v) => update({ duplex: v === "double" })}
              />

              <PrintOptionCard
                title="Choose print orientation"
                options={[
                  { value: "portrait", label: "Portrait", sublabel: "8.3 x 11.7 in", icon: "📄" },
                  { value: "landscape", label: "Landscape", sublabel: "11.7 x 8.3 in", icon: "🖼️" },
                ]}
                value={activeConfig.orientation}
                onChange={(v) => update({ orientation: v as "portrait" | "landscape" })}
              />

              <div className="mt-4">
                <PriceCalc config={activeConfig} orderTotalPages={totalPagesInOrder} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {!loading && draft && activeFile && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#F2F3F7] z-50 border-t border-[#E8E8E8]">
          <div className="max-w-lg mx-auto flex">
            <div className="w-1/3 p-4 flex flex-col justify-center">
              <span className="text-xs text-[#666] font-semibold">
                {files.length > 1 ? `${files.length} files` : "Total"}
              </span>
              <p className="text-lg font-black text-[#1A1A1A]">{storeConfig.currencySymbol}{grandTotal}</p>
            </div>
            <div className="w-2/3 p-4">
              <button
                onClick={handleNext}
                className="w-full bg-[#0C831F] hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0C831F]/20"
              >
                Add to cart <span className="text-sm">›</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
