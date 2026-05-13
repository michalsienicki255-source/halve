"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Share2,
  Copy,
  PartyPopper,
} from "lucide-react";
import { useSplits } from "@/lib/store";
import type { Split } from "@/lib/types";
import { Avatar } from "../Avatar";
import { colorByKey } from "@/lib/colors";
import { computeSummary, unassignedItemsCount } from "@/lib/split-math";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { fireConfetti } from "../ConfettiBurst";
import { brand } from "@/app/config";
import { plural, useLocaleStore, useT } from "@/lib/i18n";
import { ShareModal } from "../ShareModal";
import { haptic } from "@/lib/haptics";

export function StepSummary({ split }: { split: Split }) {
  const markDone = useSplits((s) => s.markDone);
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const moneyLocale = locale === "pl" ? "pl-PL" : "en-US";
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const firedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  const summaries = useMemo(
    () => computeSummary(split.receipt, split.people.map((p) => p.id)),
    [split.receipt, split.people]
  );

  const unassigned = unassignedItemsCount(split.receipt);
  const peopleTotal = summaries.reduce((acc, s) => acc + s.total, 0);
  const allAssigned = unassigned === 0 && split.receipt.items.length > 0;
  const grandTotal = split.receipt.total;

  useEffect(() => {
    if (allAssigned && !firedRef.current && split.people.length > 0) {
      firedRef.current = true;
      fireConfetti();
      haptic("success");
      markDone(split.id);
    }
  }, [allAssigned, split.id, split.people.length, markDone]);

  function buildShareText(): string {
    const lines: string[] = [];
    lines.push(`${brand.name} · ${split.title}`);
    lines.push(formatDate(split.createdAt, moneyLocale));
    lines.push("");
    summaries.forEach((s) => {
      const person = split.people.find((p) => p.id === s.personId);
      if (!person) return;
      lines.push(
        `${person.name}: ${formatMoney(s.total, split.receipt.currency, moneyLocale)}`
      );
    });
    lines.push("");
    lines.push(
      `${t("summary.total")}: ${formatMoney(grandTotal, split.receipt.currency, moneyLocale)}`
    );
    return lines.join("\n");
  }

  async function handleShare() {
    const text = buildShareText();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: split.title, text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "rounded-3xl p-5 relative overflow-hidden",
          allAssigned
            ? "bg-gradient-to-br from-emerald-500/20 to-violet-500/20 border border-emerald-400/30"
            : "glass"
        )}
      >
        {allAssigned && (
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl" />
        )}
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-400">
              {allAssigned ? t("summary.done") : t("summary.title")}
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {split.title}
            </h2>
            <div className="mt-0.5 text-xs text-zinc-500">
              {formatDate(split.createdAt, moneyLocale)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">{t("summary.total")}</div>
            <div className="text-2xl font-semibold tabular-nums text-gradient">
              {formatMoney(grandTotal, split.receipt.currency, moneyLocale)}
            </div>
          </div>
        </div>
        {allAssigned ? (
          <div className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
            <PartyPopper className="w-4 h-4" />
            {t("summary.all_assigned")}
          </div>
        ) : unassigned > 0 ? (
          <div className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
            <AlertTriangle className="w-4 h-4" />
            {t("summary.unassigned", { n: unassigned })}
          </div>
        ) : null}
      </motion.div>

      <div className="space-y-2">
        {summaries.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-400">
            {t("summary.empty")}
          </div>
        ) : (
          summaries.map((s) => {
            const person = split.people.find((p) => p.id === s.personId);
            if (!person) return null;
            const c = colorByKey(person.colorKey);
            const isOpen = expanded === person.id;
            const items = split.receipt.items.filter((it) =>
              it.ownerIds.includes(person.id)
            );
            return (
              <motion.div
                key={person.id}
                layout
                onMouseEnter={() => setHovered(person.id)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "rounded-2xl border overflow-hidden transition-all duration-300",
                  c.border,
                  isOpen || hovered === person.id
                    ? `bg-gradient-to-br ${c.gradient} bg-opacity-[0.08] shadow-2xl ${c.glow}`
                    : "bg-white/[0.03]",
                  expanded && expanded !== person.id && "opacity-50 saturate-50",
                  hovered && hovered !== person.id && !expanded && "opacity-60"
                )}
                style={
                  isOpen || hovered === person.id
                    ? { background: `linear-gradient(135deg, var(--surface-strong), var(--surface-strong))` }
                    : undefined
                }
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : person.id)}
                  className="w-full px-3.5 py-3 flex items-center gap-3"
                >
                  <Avatar name={person.name} colorKey={person.colorKey} size="md" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="font-medium truncate">{person.name}</div>
                    <div className="text-xs text-zinc-500">
                      {items.length}{" "}
                      {plural(items.length, {
                        one: t("summary.positions.one"),
                        few: t("summary.positions.few"),
                        many: t("summary.positions.many"),
                      })}
                      {s.taxShare + s.tipShare > 0 && (
                        <>
                          {" · "}
                          {formatMoney(
                            s.taxShare + s.tipShare,
                            split.receipt.currency,
                            moneyLocale
                          )}{" "}
                          {t("summary.tax_tip")}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-lg font-semibold tabular-nums", c.text)}>
                      {formatMoney(s.total, split.receipt.currency, moneyLocale)}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-zinc-500 transition-transform shrink-0",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 px-3.5 py-2.5 space-y-1.5"
                  >
                    {items.length === 0 ? (
                      <div className="text-xs text-zinc-500 py-1">
                        {t("summary.no_items")}
                      </div>
                    ) : (
                      items.map((it) => {
                        const share =
                          (it.unitPrice * it.quantity) / it.ownerIds.length;
                        return (
                          <div
                            key={it.id}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 flex-1 truncate text-zinc-300">
                              {it.name}
                              {it.ownerIds.length > 1 && (
                                <span className="text-zinc-500">
                                  {" "}
                                  · 1/{it.ownerIds.length}
                                </span>
                              )}
                            </div>
                            <div className="tabular-nums text-zinc-400 shrink-0">
                              {formatMoney(
                                share,
                                split.receipt.currency,
                                moneyLocale
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    {(s.taxShare > 0 || s.tipShare > 0) && (
                      <>
                        <div className="border-t border-white/5 my-1.5" />
                        {s.taxShare > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">{t("summary.tax")}</span>
                            <span className="tabular-nums text-zinc-400">
                              {formatMoney(
                                s.taxShare,
                                split.receipt.currency,
                                moneyLocale
                              )}
                            </span>
                          </div>
                        )}
                        {s.tipShare > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">{t("summary.tip")}</span>
                            <span className="tabular-nums text-zinc-400">
                              {formatMoney(
                                s.tipShare,
                                split.receipt.currency,
                                moneyLocale
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {Math.abs(peopleTotal - grandTotal) > 0.02 && (
        <div className="glass rounded-2xl px-4 py-3 text-xs text-amber-200 border border-amber-500/30">
          {t("summary.mismatch", {
            sum: formatMoney(peopleTotal, split.receipt.currency, moneyLocale),
            total: formatMoney(grandTotal, split.receipt.currency, moneyLocale),
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShareOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white text-sm font-medium shadow-glow hover:-translate-y-0.5 transition-transform"
        >
          <Share2 className="w-4 h-4" />
          {t("summary.share")}
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(buildShareText());
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            } catch {
              await handleShare();
            }
          }}
          className="px-4 py-3.5 rounded-2xl glass hover:glass-strong text-sm font-medium transition-colors"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      <ShareModal
        split={split}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
