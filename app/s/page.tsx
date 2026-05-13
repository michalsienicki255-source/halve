"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Receipt as ReceiptIcon, Users } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/Avatar";
import { decodeSplit, parseShareUrl } from "@/lib/share";
import type { Split } from "@/lib/types";
import { computeSummary } from "@/lib/split-math";
import { useLocaleStore, useT } from "@/lib/i18n";
import { formatDate, formatMoney } from "@/lib/utils";
import { colorByKey } from "@/lib/colors";
import { brand } from "../config";

export default function SharedSplitPage() {
  return (
    <Suspense fallback={null}>
      <SharedView />
    </Suspense>
  );
}

function SharedView() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const moneyLocale = locale === "pl" ? "pl-PL" : "en-US";
  const [data, setData] = useState<{
    split: Split | null;
    meIndex: number | null;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { encoded, meIndex } = parseShareUrl(window.location.hash);
    if (!encoded) {
      setData({ split: null, meIndex: null });
      return;
    }
    const split = decodeSplit(encoded);
    setData({ split, meIndex });
  }, []);

  if (!data) {
    return (
      <main className="min-h-dvh">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 pt-6 space-y-3">
          <div className="h-24 rounded-2xl glass animate-shimmer" />
          <div className="h-40 rounded-2xl glass animate-shimmer" />
        </div>
      </main>
    );
  }

  if (!data.split) {
    return (
      <main className="min-h-dvh">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 pt-10 text-center">
          <p className="text-sm text-zinc-400">{t("shared.broken")}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-300 hover:text-emerald-200"
          >
            {t("shared.go_home")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <SharedSplitView
      split={data.split}
      meIndex={data.meIndex}
      t={t}
      moneyLocale={moneyLocale}
    />
  );
}

function SharedSplitView({
  split,
  meIndex,
  t,
  moneyLocale,
}: {
  split: Split;
  meIndex: number | null;
  t: ReturnType<typeof useT>;
  moneyLocale: string;
}) {
  const me = meIndex != null ? split.people[meIndex] ?? null : null;
  const summaries = useMemo(
    () => computeSummary(split.receipt, split.people.map((p) => p.id)),
    [split]
  );
  const mySummary = me
    ? summaries.find((s) => s.personId === me.id) ?? null
    : null;

  return (
    <main className="min-h-dvh pb-10">
      <TopBar />

      <section className="mx-auto max-w-2xl px-4 pt-2">
        {me && mySummary ? (
          <FocusedView
            split={split}
            person={me}
            t={t}
            moneyLocale={moneyLocale}
            mySummary={mySummary}
          />
        ) : (
          <FullView
            split={split}
            summaries={summaries}
            t={t}
            moneyLocale={moneyLocale}
          />
        )}

        <Link
          href="/"
          className="mt-6 w-full glass hover:glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 group transition-all"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-violet-500/30 grid place-items-center shrink-0">
            <ReceiptIcon className="w-4 h-4 text-emerald-300" />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-medium">{t("shared.open_app")}</div>
            <div className="text-xs text-zinc-500">{brand.tagline}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>
      </section>
    </main>
  );
}

function FocusedView({
  split,
  person,
  t,
  moneyLocale,
  mySummary,
}: {
  split: Split;
  person: Split["people"][number];
  t: ReturnType<typeof useT>;
  moneyLocale: string;
  mySummary: ReturnType<typeof computeSummary>[number];
}) {
  const c = colorByKey(person.colorKey);
  const items = split.receipt.items.filter((it) =>
    it.ownerIds.includes(person.id)
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-6"
      >
        <Avatar
          name={person.name}
          colorKey={person.colorKey}
          size="xl"
          className="mx-auto"
        />
        <h1 className="mt-4 text-2xl font-semibold">{person.name}</h1>
        <div className="mt-1 text-xs text-zinc-500">{split.title}</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 rounded-3xl p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${gradColors(person.colorKey).bg1}, ${gradColors(person.colorKey).bg2})`,
          border: `1px solid ${gradColors(person.colorKey).border}`,
        }}
      >
        <div className="text-xs uppercase tracking-widest text-white/60">
          {t("shared.your_total")}
        </div>
        <div className="mt-2 text-5xl font-semibold tabular-nums text-white drop-shadow-md">
          {formatMoney(mySummary.total, split.receipt.currency, moneyLocale)}
        </div>
        <div className="mt-3 text-xs text-white/60">
          {formatDate(split.createdAt, moneyLocale)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="mt-4 glass rounded-2xl overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-white/5 text-sm font-medium">
          {t("shared.your_items")}
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-6 text-sm text-zinc-500 text-center">—</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((it) => {
              const share = (it.unitPrice * it.quantity) / it.ownerIds.length;
              return (
                <li
                  key={it.id}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{it.name}</div>
                    {it.ownerIds.length > 1 && (
                      <div className="text-[11px] text-zinc-500">
                        1/{it.ownerIds.length}
                      </div>
                    )}
                  </div>
                  <div className={`text-sm tabular-nums font-medium ${c.text}`}>
                    {formatMoney(share, split.receipt.currency, moneyLocale)}
                  </div>
                </li>
              );
            })}
            {(mySummary.taxShare > 0 || mySummary.tipShare > 0) && (
              <>
                {mySummary.taxShare > 0 && (
                  <li className="px-4 py-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>{t("summary.tax")}</span>
                    <span className="tabular-nums">
                      {formatMoney(
                        mySummary.taxShare,
                        split.receipt.currency,
                        moneyLocale
                      )}
                    </span>
                  </li>
                )}
                {mySummary.tipShare > 0 && (
                  <li className="px-4 py-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>{t("summary.tip")}</span>
                    <span className="tabular-nums">
                      {formatMoney(
                        mySummary.tipShare,
                        split.receipt.currency,
                        moneyLocale
                      )}
                    </span>
                  </li>
                )}
              </>
            )}
          </ul>
        )}
      </motion.div>
    </>
  );
}

function FullView({
  split,
  summaries,
  t,
  moneyLocale,
}: {
  split: Split;
  summaries: ReturnType<typeof computeSummary>;
  t: ReturnType<typeof useT>;
  moneyLocale: string;
}) {
  return (
    <>
      <div className="mt-6">
        <div className="text-xs uppercase tracking-widest text-zinc-500">
          {t("shared.full_split")}
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {split.title}
        </h1>
        <div className="mt-1 text-sm text-zinc-400">
          {formatDate(split.createdAt, moneyLocale)} · {split.people.length}{" "}
          <Users className="inline w-3.5 h-3.5 -translate-y-px" />
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums text-gradient">
          {formatMoney(split.receipt.total, split.receipt.currency, moneyLocale)}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {summaries
          .slice()
          .sort((a, b) => b.total - a.total)
          .map((s) => {
            const person = split.people.find((p) => p.id === s.personId);
            if (!person) return null;
            const c = colorByKey(person.colorKey);
            return (
              <div
                key={person.id}
                className={`rounded-2xl glass p-3.5 flex items-center gap-3 border ${c.border}`}
              >
                <Avatar name={person.name} colorKey={person.colorKey} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{person.name}</div>
                </div>
                <div className={`text-base font-semibold tabular-nums ${c.text}`}>
                  {formatMoney(s.total, split.receipt.currency, moneyLocale)}
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}

function gradColors(key: string): { bg1: string; bg2: string; border: string } {
  switch (key) {
    case "emerald":
      return { bg1: "rgba(52,211,153,0.6)", bg2: "rgba(20,184,166,0.4)", border: "rgba(52,211,153,0.5)" };
    case "violet":
      return { bg1: "rgba(167,139,250,0.6)", bg2: "rgba(217,70,239,0.4)", border: "rgba(167,139,250,0.5)" };
    case "rose":
      return { bg1: "rgba(251,113,133,0.6)", bg2: "rgba(236,72,153,0.4)", border: "rgba(251,113,133,0.5)" };
    case "amber":
      return { bg1: "rgba(251,191,36,0.6)", bg2: "rgba(249,115,22,0.4)", border: "rgba(251,191,36,0.5)" };
    case "sky":
      return { bg1: "rgba(56,189,248,0.6)", bg2: "rgba(59,130,246,0.4)", border: "rgba(56,189,248,0.5)" };
    case "lime":
      return { bg1: "rgba(163,230,53,0.6)", bg2: "rgba(34,197,94,0.4)", border: "rgba(163,230,53,0.5)" };
    case "fuchsia":
      return { bg1: "rgba(232,121,249,0.6)", bg2: "rgba(236,72,153,0.4)", border: "rgba(232,121,249,0.5)" };
    case "cyan":
      return { bg1: "rgba(34,211,238,0.6)", bg2: "rgba(14,165,233,0.4)", border: "rgba(34,211,238,0.5)" };
    default:
      return { bg1: "rgba(52,211,153,0.6)", bg2: "rgba(167,139,250,0.4)", border: "rgba(255,255,255,0.2)" };
  }
}
