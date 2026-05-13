"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
  ScanLine,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSplits } from "@/lib/store";
import type { ScannedReceipt } from "@/lib/types";
import { TopBar } from "@/components/TopBar";
import { useT } from "@/lib/i18n";
import { enhanceReceiptImage } from "@/lib/image-enhance";
import { formatMoney } from "@/lib/utils";

type Status = "idle" | "preview" | "scanning" | "revealing" | "error";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export default function ScanPage() {
  const router = useRouter();
  const createFromScan = useSplits((s) => s.createFromScan);
  const t = useT();

  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [enhanced, setEnhanced] = useState<string | null>(null);
  const [reveal, setReveal] = useState<ScannedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > MAX_FILE_BYTES) {
        setError(t("scan.error.too_big"));
        return;
      }
      try {
        const rawDataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(r.error);
          r.readAsDataURL(file);
        });
        setPreview(rawDataUrl);
        setStatus("preview");
        const enhancedUrl = await enhanceReceiptImage(rawDataUrl);
        setEnhanced(enhancedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("scan.error.read"));
        setStatus("error");
      }
    },
    [t]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  async function handleScan() {
    if (!preview) return;
    setStatus("scanning");
    setError(null);
    try {
      const imageToScan = enhanced ?? preview;
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageToScan }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong");
      }
      const scanned = data as ScannedReceipt;
      if (scanned.items.length === 0) {
        const id = createFromScan(scanned, preview);
        router.push(`/split/${id}`);
        return;
      }
      setReveal(scanned);
      setStatus("revealing");
      window.setTimeout(() => {
        const id = createFromScan(scanned, preview);
        router.push(`/split/${id}`);
      }, 1700);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("scan.error.unknown"));
      setStatus("error");
    }
  }

  function reset() {
    setPreview(null);
    setEnhanced(null);
    setReveal(null);
    setStatus("idle");
    setError(null);
  }

  return (
    <main className="min-h-dvh">
      <TopBar
        right={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("scan.back")}
          </Link>
        }
      />

      <section className="mx-auto max-w-2xl px-4 pt-2 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {t("scan.title")}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">{t("scan.subtitle")}</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" || status === "error" ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div
                {...getRootProps()}
                className={`relative rounded-3xl border-2 border-dashed transition-all p-6 sm:p-10 text-center cursor-pointer
                  ${
                    isDragActive
                      ? "border-emerald-400 bg-emerald-400/5"
                      : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                  }`}
                onClick={open}
              >
                <input {...getInputProps()} />
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 grid place-items-center animate-float">
                  <Upload className="w-7 h-7 text-emerald-300" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t("scan.drop")}</h3>
                <p className="mt-1 text-sm text-zinc-400">{t("scan.drop.hint")}</p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      open();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white text-sm font-medium shadow-glow hover:-translate-y-0.5 transition-transform"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {t("scan.pick")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:glass-strong text-sm font-medium transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    {t("scan.camera")}
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 px-4 py-3 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-400">
                <Tip
                  icon={<ScanLine className="w-4 h-4 text-emerald-400" />}
                  title={t("scan.tip.align")}
                >
                  {t("scan.tip.align.body")}
                </Tip>
                <Tip
                  icon={<Sparkles className="w-4 h-4 text-violet-300" />}
                  title={t("scan.tip.shadows")}
                >
                  {t("scan.tip.shadows.body")}
                </Tip>
                <Tip
                  icon={<Upload className="w-4 h-4 text-sky-300" />}
                  title={t("scan.tip.frame")}
                >
                  {t("scan.tip.frame.body")}
                </Tip>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="relative rounded-3xl overflow-hidden glass">
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Paragon"
                    className="w-full max-h-[60vh] object-contain bg-black/40"
                  />
                )}
                {status === "scanning" && <ScanOverlay />}
                {status === "revealing" && reveal && (
                  <RevealOverlay reveal={reveal} />
                )}
                {status !== "scanning" && status !== "revealing" && (
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full glass-strong grid place-items-center hover:bg-white/10 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {status === "scanning" ? (
                <ScanningHint
                  lines={[t("scan.loading.1"), t("scan.loading.2"), t("scan.loading.3")]}
                />
              ) : status === "revealing" && reveal ? (
                <RevealHint reveal={reveal} />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleScan}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white font-medium shadow-glow hover:-translate-y-0.5 transition-transform"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t("scan.go")}
                  </button>
                  <button
                    onClick={reset}
                    className="px-4 py-3.5 rounded-2xl glass hover:glass-strong text-sm font-medium transition-colors"
                  >
                    {t("scan.change")}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function Tip({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl glass px-3 py-2.5 flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-zinc-200 text-[13px] font-medium">{title}</div>
        <div className="text-[12px] text-zinc-500 leading-snug">{children}</div>
      </div>
    </div>
  );
}

function ScanOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <CornerBrackets />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent" />
      <motion.div
        initial={{ y: "-10%" }}
        animate={{ y: "110%" }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_20px_8px_rgba(52,211,153,0.5)]"
      />
    </div>
  );
}

function CornerBrackets() {
  const cornerStyle = "absolute w-8 h-8 border-emerald-300";
  return (
    <>
      {[
        "top-3 left-3 border-t-2 border-l-2 rounded-tl-2xl",
        "top-3 right-3 border-t-2 border-r-2 rounded-tr-2xl",
        "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-2xl",
        "bottom-3 right-3 border-b-2 border-r-2 rounded-br-2xl",
      ].map((cls, i) => (
        <motion.div
          key={cls}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0.7, 1], scale: [0.5, 1.1, 1, 1] }}
          transition={{
            duration: 1.2,
            delay: i * 0.12,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 0.6,
          }}
          className={`${cornerStyle} ${cls} drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]`}
        />
      ))}
    </>
  );
}

function RevealOverlay({ reveal }: { reveal: ScannedReceipt }) {
  const items = reveal.items.slice(0, 6);
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70 grid place-items-center p-4 pointer-events-none">
      <div className="relative w-full max-w-xs">
        {items.map((it, i) => (
          <motion.div
            key={`${it.name}-${i}`}
            initial={{
              opacity: 0,
              scale: 0.6,
              y: 80,
              rotate: (i % 2 ? -1 : 1) * 4,
            }}
            animate={{ opacity: 1, scale: 1, y: i * -6, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 22,
              delay: 0.08 * i,
            }}
            className="glass-strong rounded-xl p-2.5 mb-1.5 flex items-center justify-between shadow-2xl"
            style={{ zIndex: 10 + i }}
          >
            <span className="text-xs font-medium truncate flex-1">{it.name}</span>
            <span className="text-[11px] tabular-nums text-emerald-300 ml-2">
              {formatMoney(it.unitPrice * it.quantity, reveal.currency || "PLN")}
            </span>
          </motion.div>
        ))}
        {reveal.items.length > items.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-zinc-400 mt-2"
          >
            +{reveal.items.length - items.length} more
          </motion.div>
        )}
      </div>
    </div>
  );
}

function RevealHint({ reveal }: { reveal: ScannedReceipt }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl px-5 py-4 flex items-center gap-3 border border-emerald-400/30"
    >
      <div className="w-10 h-10 rounded-full bg-emerald-500/30 grid place-items-center shrink-0">
        <Check className="w-5 h-5 text-emerald-200" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">
          Found <span className="text-emerald-300">{reveal.items.length}</span> items
        </div>
        <div className="text-xs text-zinc-400">
          {reveal.store ? `${reveal.store} · ` : ""}
          {formatMoney(reveal.total, reveal.currency || "PLN")}
        </div>
      </div>
    </motion.div>
  );
}

function ScanningHint({ lines }: { lines: string[] }) {
  return (
    <div className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
      <div className="relative w-10 h-10 shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-violet-500/30 animate-pulse" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-emerald-400 border-r-violet-400 animate-spin-slow" />
        <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-emerald-300" />
      </div>
      <div className="overflow-hidden h-5">
        <motion.div
          animate={{ y: [0, -20, -40, -20, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {lines.map((l) => (
            <div key={l} className="h-5 text-sm text-zinc-300">
              {l}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
