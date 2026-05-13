"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Receipt as ReceiptIcon,
  Sparkles,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { brand } from "./config";
import { useSplits } from "@/lib/store";
import { formatDate, formatMoney } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { Avatar } from "@/components/Avatar";
import { useLocaleStore, useT } from "@/lib/i18n";

export default function HomePage() {
  const { splits, order, hydrated, deleteSplit } = useSplits();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const history = mounted && hydrated ? order.map((id) => splits[id]).filter(Boolean) : [];

  return (
    <main className="min-h-dvh">
      <TopBar
        right={
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {t("home.ai_badge")}
          </span>
        }
      />

      <section className="mx-auto max-w-2xl px-4 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 blur-3xl opacity-50 bg-gradient-to-br from-emerald-500/20 via-violet-500/20 to-transparent rounded-full" />
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
            {t("home.title.1")}
            <br />
            <span className="text-gradient">{t("home.title.2")}</span>
          </h1>
          <p className="mt-4 text-zinc-400 text-base sm:text-lg max-w-md">
            {t("home.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <Link
            href="/scan"
            className="group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-violet-600 text-white shadow-glow hover:shadow-2xl transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-widest opacity-80">
                  {t("home.cta.scan.kicker")}
                </div>
                <div className="mt-1 text-xl font-semibold">
                  {t("home.cta.scan.title")}
                </div>
                <div className="mt-1 text-sm opacity-85">
                  {t("home.cta.scan.sub")}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/15 grid place-items-center backdrop-blur">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <ArrowRight className="absolute right-5 bottom-5 w-5 h-5 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
            <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          </Link>

          <NewBlankSplitButton />
        </motion.div>

        <DemoBanner />


        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-7 flex items-center justify-between"
        >
          <h2 className="text-sm font-medium text-zinc-300 inline-flex items-center gap-2">
            <ReceiptIcon className="w-4 h-4 text-zinc-500" />
            {t("home.history")}
          </h2>
          {history.length > 0 && (
            <span className="text-xs text-zinc-500">{history.length}</span>
          )}
        </motion.div>

        {!mounted || !hydrated ? (
          <div className="mt-3 space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl glass animate-shimmer opacity-50"
              />
            ))}
          </div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 glass rounded-2xl p-8 text-center"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 grid place-items-center animate-float">
              <ReceiptIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="mt-3 text-sm text-zinc-400">{t("home.empty")}</p>
          </motion.div>
        ) : (
          <ul className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {history.map((split) => (
                <motion.li
                  key={split.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <Link
                    href={`/split/${split.id}`}
                    className="group relative glass hover:glass-strong transition-all rounded-2xl p-4 flex items-center gap-3"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/25 to-violet-500/25 grid place-items-center shrink-0">
                      <ReceiptIcon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{split.title}</h3>
                        {split.status === "draft" && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300">
                            {t("home.badge.draft")}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-500 flex items-center gap-1.5">
                        <span>{formatDate(split.createdAt, dateLocale)}</span>
                        {split.people.length > 0 && (
                          <>
                            <span>·</span>
                            <Users className="w-3 h-3" />
                            <span>{split.people.length}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatMoney(
                            split.receipt.total,
                            split.receipt.currency,
                            dateLocale
                          )}
                        </div>
                        {split.people.length > 0 && (
                          <div className="flex -space-x-2 mt-1 justify-end">
                            {split.people.slice(0, 4).map((p) => (
                              <Avatar
                                key={p.id}
                                name={p.name}
                                colorKey={p.colorKey}
                                size="xs"
                                className="ring-2 ring-[var(--background)]"
                              />
                            ))}
                            {split.people.length > 4 && (
                              <span className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] grid place-items-center ring-2 ring-[var(--background)] text-zinc-300">
                                +{split.people.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <DeleteButton
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm(t("common.confirm_delete", { name: split.title }))) {
                            deleteSplit(split.id);
                          }
                        }}
                      />
                    </div>
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <footer className="mx-auto max-w-2xl px-4 pt-10 pb-10 safe-bottom">
        <p className="text-center text-[11px] text-zinc-600">
          {brand.name} · {brand.tagline}
        </p>
      </footer>
    </main>
  );
}

function NewBlankSplitButton() {
  const createBlank = useSplits((s) => s.createBlank);
  const t = useT();
  return (
    <Link
      href="/"
      onClick={(e) => {
        e.preventDefault();
        const id = createBlank();
        window.location.href = `/split/${id}`;
      }}
      className="group relative overflow-hidden rounded-2xl p-5 glass hover:glass-strong transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {t("home.cta.blank.kicker")}
          </div>
          <div className="mt-1 text-xl font-semibold">
            {t("home.cta.blank.title")}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            {t("home.cta.blank.sub")}
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/5 grid place-items-center">
          <Users className="w-5 h-5 text-violet-300" />
        </div>
      </div>
      <ArrowRight className="absolute right-5 bottom-5 w-5 h-5 text-zinc-500 group-hover:translate-x-1 group-hover:text-zinc-300 transition-all" />
    </Link>
  );
}

function DeleteButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
      aria-label="Usuń"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function DemoBanner() {
  const createDemo = useSplits((s) => s.createDemo);
  const t = useT();
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18 }}
      onClick={() => {
        const id = createDemo();
        window.location.href = `/split/${id}`;
      }}
      className="mt-3 w-full glass hover:glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 group transition-all"
    >
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/30 to-rose-500/30 grid place-items-center shrink-0">
        <Wand2 className="w-4 h-4 text-amber-300" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-sm font-medium">{t("home.demo.title")}</div>
        <div className="text-xs text-zinc-500">{t("home.demo.sub")}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-all shrink-0" />
    </motion.button>
  );
}

