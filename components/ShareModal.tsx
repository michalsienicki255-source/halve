"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  Download,
  Share2,
  QrCode,
} from "lucide-react";
import * as htmlToImage from "html-to-image";
import QRCode from "qrcode";
import { WrappedPoster } from "./WrappedPoster";
import { Avatar } from "./Avatar";
import type { Split } from "@/lib/types";
import { buildShareUrl } from "@/lib/share";
import { useLocaleStore, useT } from "@/lib/i18n";
import { brand } from "@/app/config";
import { computeSummary } from "@/lib/split-math";
import { formatMoney } from "@/lib/utils";

type Mode = "poster" | "qr";

export function ShareModal({
  split,
  open,
  onClose,
}: {
  split: Split;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const moneyLocale = locale === "pl" ? "pl-PL" : "en-US";
  const [mode, setMode] = useState<Mode>("poster");
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  const shareLink = buildShareUrl(split, activePersonId ?? undefined);
  const summaries = computeSummary(
    split.receipt,
    split.people.map((p) => p.id)
  );

  useEffect(() => {
    if (mode !== "qr") return;
    QRCode.toDataURL(shareLink, {
      margin: 1,
      width: 360,
      color: { dark: "#ffffff", light: "#0000" },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [shareLink, mode]);

  async function downloadPoster() {
    if (!posterRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await htmlToImage.toPng(posterRef.current, {
        pixelRatio: 1,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${brand.shortName}-${split.id.slice(-6)}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function sharePoster() {
    if (!posterRef.current) return;
    setBusy(true);
    try {
      const blob = await htmlToImage.toBlob(posterRef.current, {
        pixelRatio: 1,
        cacheBust: true,
      });
      if (!blob) return;
      const file = new File([blob], `${brand.shortName}-${split.id.slice(-6)}.png`, {
        type: "image/png",
      });
      const navAny = navigator as Navigator & {
        canShare?: (d: { files?: File[] }) => boolean;
      };
      if (
        navAny.canShare &&
        navAny.canShare({ files: [file] }) &&
        "share" in navigator
      ) {
        await navigator.share({ title: split.title, files: [file] });
      } else {
        await downloadPoster();
      }
    } catch {
      /* user cancelled */
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-strong rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-semibold">{t("share.title")}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-3">
              <div className="glass rounded-2xl p-1 flex">
                <button
                  onClick={() => setMode("poster")}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                    mode === "poster" ? "bg-white/10 text-white" : "text-zinc-400"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  {t("share.tab.poster")}
                </button>
                <button
                  onClick={() => setMode("qr")}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                    mode === "qr" ? "bg-white/10 text-white" : "text-zinc-400"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {t("share.tab.qr")}
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 pb-5">
              {mode === "poster" ? (
                <div className="space-y-3">
                  <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-black/50 border border-white/5">
                    <div className="w-full h-full origin-top-left" style={{
                      transform: "scale(var(--poster-scale))",
                    }}>
                      <PosterScale>
                        <WrappedPoster ref={posterRef} split={split} locale={moneyLocale} />
                      </PosterScale>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 text-center">
                    {t("share.poster.hint")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={sharePoster}
                      disabled={busy}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white text-sm font-medium shadow-glow disabled:opacity-60 transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      {t("share.poster.share")}
                    </button>
                    <button
                      onClick={downloadPoster}
                      disabled={busy}
                      className="px-4 py-3 rounded-2xl glass hover:glass-strong text-sm transition-colors disabled:opacity-60"
                      aria-label="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
                      {t("share.qr.focus")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setActivePersonId(null)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                          !activePersonId
                            ? "bg-white/10 text-white"
                            : "bg-white/5 text-zinc-400 hover:bg-white/10"
                        }`}
                      >
                        {t("share.qr.all")}
                      </button>
                      {split.people.map((p) => {
                        const s = summaries.find((x) => x.personId === p.id);
                        const isActive = activePersonId === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setActivePersonId(p.id)}
                            className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors ${
                              isActive
                                ? "bg-white/10 text-white"
                                : "bg-white/5 text-zinc-300 hover:bg-white/10"
                            }`}
                          >
                            <Avatar
                              name={p.name}
                              colorKey={p.colorKey}
                              size="xs"
                            />
                            <span>{p.name}</span>
                            {s && (
                              <span className="text-zinc-500">
                                {formatMoney(
                                  s.total,
                                  split.receipt.currency,
                                  moneyLocale
                                )}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-4 flex flex-col items-center gap-3">
                    {qrUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrUrl}
                        alt="QR"
                        className="w-48 h-48 rounded-xl bg-white/[0.03] p-2"
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-xl bg-white/5 animate-shimmer" />
                    )}
                    <p className="text-xs text-zinc-400 text-center">
                      {activePersonId
                        ? t("share.qr.hint_person")
                        : t("share.qr.hint_all")}
                    </p>
                  </div>

                  <div className="glass rounded-2xl p-3 flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <div className="text-[11px] text-zinc-400 flex-1 truncate font-mono">
                      {shareLink}
                    </div>
                    <button
                      onClick={copyLink}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg shrink-0 transition-colors ${
                        copied
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/5 hover:bg-white/10 text-zinc-200"
                      }`}
                    >
                      {copied ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> {t("common.copied")}
                        </span>
                      ) : (
                        t("common.copy")
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PosterScale({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const parent = el.parentElement?.parentElement;
      if (!parent) return;
      const scale = parent.clientWidth / 1080;
      parent.style.setProperty("--poster-scale", String(scale));
    });
    if (el.parentElement?.parentElement) {
      ro.observe(el.parentElement.parentElement);
    }
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ transformOrigin: "top left" }}>
      {children}
    </div>
  );
}
