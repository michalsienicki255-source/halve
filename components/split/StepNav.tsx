"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

export type StepId = "items" | "people" | "assign" | "summary";

export const STEPS: { id: StepId; tKey: TKey }[] = [
  { id: "items", tKey: "step.items" },
  { id: "people", tKey: "step.people" },
  { id: "assign", tKey: "step.assign" },
  { id: "summary", tKey: "step.summary" },
];

export function StepNav({
  current,
  onChange,
  reachable,
}: {
  current: StepId;
  onChange: (s: StepId) => void;
  reachable: Record<StepId, boolean>;
}) {
  const t = useT();
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <nav className="glass rounded-2xl p-1.5 flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isActive = step.id === current;
        const isPast = idx < currentIdx;
        const isReachable = reachable[step.id];
        return (
          <button
            key={step.id}
            onClick={() => {
              if (!isReachable) return;
              haptic("tap");
              onChange(step.id);
            }}
            disabled={!isReachable}
            className={cn(
              "relative flex-1 min-w-0 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors",
              isActive
                ? "text-white"
                : isReachable
                  ? "text-zinc-400 hover:text-zinc-200"
                  : "text-zinc-600 cursor-not-allowed"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="step-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/90 to-violet-600/90 shadow-glow"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5">
              {isPast && <Check className="w-3 h-3" />}
              <span className="truncate">{t(step.tKey)}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
