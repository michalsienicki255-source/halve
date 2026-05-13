"use client";

import { forwardRef } from "react";
import { brand } from "@/app/config";
import { computeSummary } from "@/lib/split-math";
import { formatDate, formatMoney, initials } from "@/lib/utils";
import type { Split } from "@/lib/types";

type PosterProps = {
  split: Split;
  locale: string;
};

export const WrappedPoster = forwardRef<HTMLDivElement, PosterProps>(
  function WrappedPoster({ split, locale }, ref) {
    const summaries = computeSummary(
      split.receipt,
      split.people.map((p) => p.id)
    ).sort((a, b) => b.total - a.total);

    const top = summaries[0];
    const topPerson = top ? split.people.find((p) => p.id === top.personId) : null;
    const totalItems = split.receipt.items.length;

    return (
      <div
        ref={ref}
        className="relative w-[1080px] h-[1920px] font-sans overflow-hidden"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, rgba(167,139,250,0.35), transparent 70%), radial-gradient(50% 40% at 90% 90%, rgba(52,211,153,0.3), transparent 70%), linear-gradient(180deg, #0a0a14 0%, #14081e 50%, #060912 100%)",
          color: "white",
        }}
      >
        <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative h-full p-20 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl grid place-items-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <span className="text-2xl font-bold" style={{
                background: "linear-gradient(120deg,#34d399,#a78bfa)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>S</span>
            </div>
            <div>
              <div className="text-2xl font-semibold">{brand.name}</div>
              <div className="text-base text-white/50">{brand.tagline}</div>
            </div>
          </div>

          <div className="mt-24">
            <div className="text-xl uppercase tracking-[0.3em] text-white/40 mb-4">
              {split.receipt.store || split.title}
            </div>
            <div
              className="text-[140px] font-semibold tracking-tight leading-[0.95]"
              style={{
                background: "linear-gradient(120deg,#34d399 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {formatMoney(split.receipt.total, split.receipt.currency, locale)}
            </div>
            <div className="mt-4 text-xl text-white/50">
              {formatDate(split.createdAt, locale)} · {totalItems} {totalItems === 1 ? "item" : "items"}
            </div>
          </div>

          <div className="mt-24 flex-1">
            <div className="text-xl uppercase tracking-[0.3em] text-white/40 mb-8">
              Split breakdown
            </div>
            <div className="space-y-4">
              {summaries.map((s) => {
                const person = split.people.find((p) => p.id === s.personId);
                if (!person) return null;
                const pct = split.receipt.total > 0
                  ? Math.round((s.total / split.receipt.total) * 100)
                  : 0;
                const grad = `linear-gradient(135deg, ${gradColors(person.colorKey).from}, ${gradColors(person.colorKey).to})`;
                return (
                  <div
                    key={person.id}
                    className="rounded-3xl p-6 flex items-center gap-6"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${gradColors(person.colorKey).from}40`,
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    <div
                      className="w-20 h-20 rounded-full grid place-items-center text-2xl font-semibold text-white"
                      style={{
                        background: grad,
                        boxShadow: `0 8px 24px -8px ${gradColors(person.colorKey).from}`,
                      }}
                    >
                      {initials(person.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-3xl font-semibold">{person.name}</div>
                      <div className="text-lg text-white/40">{pct}% rachunku</div>
                    </div>
                    <div className="text-4xl font-semibold tabular-nums" style={{
                      background: grad,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                      {formatMoney(s.total, split.receipt.currency, locale)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {topPerson && top && (
            <div className="mt-12 rounded-3xl p-8 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(52,211,153,0.12))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div>
                <div className="text-base uppercase tracking-[0.3em] text-white/50">
                  Big spender
                </div>
                <div className="text-3xl font-semibold mt-1">{topPerson.name}</div>
              </div>
              <div className="text-3xl font-semibold tabular-nums" style={{
                background: `linear-gradient(120deg, ${gradColors(topPerson.colorKey).from}, ${gradColors(topPerson.colorKey).to})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                {formatMoney(top.total, split.receipt.currency, locale)}
              </div>
            </div>
          )}

          <div className="mt-12 flex items-center justify-between text-white/30">
            <div className="text-base">{brand.domain}</div>
            <div className="text-base">#{split.id.slice(-6).toUpperCase()}</div>
          </div>
        </div>
      </div>
    );
  }
);

function gradColors(key: string): { from: string; to: string } {
  switch (key) {
    case "emerald":
      return { from: "#34d399", to: "#14b8a6" };
    case "violet":
      return { from: "#a78bfa", to: "#d946ef" };
    case "rose":
      return { from: "#fb7185", to: "#ec4899" };
    case "amber":
      return { from: "#fbbf24", to: "#f97316" };
    case "sky":
      return { from: "#38bdf8", to: "#3b82f6" };
    case "lime":
      return { from: "#a3e635", to: "#22c55e" };
    case "fuchsia":
      return { from: "#e879f9", to: "#ec4899" };
    case "cyan":
      return { from: "#22d3ee", to: "#0ea5e9" };
    default:
      return { from: "#34d399", to: "#a78bfa" };
  }
}
