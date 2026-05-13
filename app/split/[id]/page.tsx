"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useSplits } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { StepNav, STEPS, type StepId } from "@/components/split/StepNav";
import { StepItems } from "@/components/split/StepItems";
import { StepPeople } from "@/components/split/StepPeople";
import { StepAssign } from "@/components/split/StepAssign";
import { StepSummary } from "@/components/split/StepSummary";
import { useT } from "@/lib/i18n";

export default function SplitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const split = useSplits((s) => s.splits[id]);
  const hydrated = useSplits((s) => s.hydrated);
  const t = useT();
  const [step, setStep] = useState<StepId>("items");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (mounted && hydrated && !split) {
    notFound();
  }

  if (!mounted || !hydrated || !split) {
    return (
      <main className="min-h-dvh">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 pt-6 space-y-3">
          <div className="h-12 rounded-2xl glass animate-shimmer" />
          <div className="h-40 rounded-2xl glass animate-shimmer" />
          <div className="h-24 rounded-2xl glass animate-shimmer" />
        </div>
      </main>
    );
  }

  const hasItems = split.receipt.items.length > 0;
  const hasPeople = split.people.length > 0;
  const reachable: Record<StepId, boolean> = {
    items: true,
    people: hasItems,
    assign: hasItems && hasPeople,
    summary: hasItems && hasPeople,
  };

  const currentIdx = STEPS.findIndex((s) => s.id === step);
  const isLast = currentIdx === STEPS.length - 1;
  const isFirst = currentIdx === 0;

  function goNext() {
    const next = STEPS[currentIdx + 1];
    if (next && reachable[next.id]) setStep(next.id);
  }
  function goBack() {
    const prev = STEPS[currentIdx - 1];
    if (prev) setStep(prev.id);
  }

  const nextLabel: Record<StepId, string> = {
    items: hasItems ? t("split.next.items") : t("split.next.items_disabled"),
    people: hasPeople ? t("split.next.people") : t("split.next.people_disabled"),
    assign: t("split.next.assign"),
    summary: t("split.next.summary"),
  };

  function handlePrimary() {
    if (isLast) {
      router.push("/");
      return;
    }
    if (step === "items" && !hasItems) return;
    if (step === "people" && !hasPeople) return;
    goNext();
  }

  const primaryDisabled =
    (step === "items" && !hasItems) || (step === "people" && !hasPeople);

  return (
    <main className="min-h-dvh pb-32">
      <TopBar
        right={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("split.list")}
          </Link>
        }
      />

      <section className="mx-auto max-w-2xl px-4 pt-1">
        <div className="sticky top-[68px] z-30 -mx-4 px-4 pt-1 pb-2 bg-[var(--background)]/0">
          <StepNav current={step} onChange={setStep} reachable={reachable} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-4"
          >
            {step === "items" && <StepItems split={split} />}
            {step === "people" && <StepPeople split={split} />}
            {step === "assign" && <StepAssign split={split} />}
            {step === "summary" && <StepSummary split={split} />}
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="fixed left-0 right-0 bottom-0 z-40 safe-bottom px-4 pt-3 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/95 to-transparent">
        <div className="mx-auto max-w-2xl flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={goBack}
              className="px-4 py-3 rounded-2xl glass hover:glass-strong text-sm font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </button>
          )}
          <button
            onClick={handlePrimary}
            disabled={primaryDisabled}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white text-sm font-medium shadow-glow disabled:opacity-40 disabled:hover:translate-y-0 hover:-translate-y-0.5 transition-all"
          >
            {isLast ? <Check className="w-4 h-4" /> : null}
            {nextLabel[step]}
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </main>
  );
}
