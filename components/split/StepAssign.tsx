"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Users, AlertCircle, Sparkles, X, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSplits } from "@/lib/store";
import type { Split } from "@/lib/types";
import { Avatar } from "../Avatar";
import { colorByKey } from "@/lib/colors";
import { assignedRatio, itemsSubtotal } from "@/lib/split-math";
import { cn, formatMoney } from "@/lib/utils";
import { AnimatedMoney } from "../AnimatedNumber";
import { useLocaleStore, useT } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";

type Suggestion = {
  itemId: string;
  ownerIds: string[];
  confidence: number;
  reason?: string;
};

/** Build history map from existing completed splits. */
function buildHistory(splits: Record<string, Split>): Record<string, string[]> {
  const byName: Record<string, string[]> = {};
  for (const split of Object.values(splits)) {
    if (split.status !== "done") continue;
    for (const item of split.receipt.items) {
      for (const ownerId of item.ownerIds) {
        const person = split.people.find((p) => p.id === ownerId);
        if (!person) continue;
        const key = person.name.toLowerCase();
        if (!byName[key]) byName[key] = [];
        if (byName[key].length < 50 && !byName[key].includes(item.name)) {
          byName[key].push(item.name);
        }
      }
    }
  }
  return byName;
}

export function StepAssign({ split }: { split: Split }) {
  const { toggleItemOwner, updateItem } = useSplits();
  const allSplits = useSplits((s) => s.splits);
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const moneyLocale = locale === "pl" ? "pl-PL" : "en-US";
  const [activePersonId, setActivePersonId] = useState<string | null>(
    split.people[0]?.id ?? null
  );
  const [splitMode, setSplitMode] = useState<"single" | "everyone">("single");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  async function fetchSuggestions() {
    if (suggesting) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const peopleHistoryByName = buildHistory(allSplits);
      const history: Record<string, string[]> = {};
      for (const p of split.people) {
        const items = peopleHistoryByName[p.name.toLowerCase()];
        if (items?.length) history[p.id] = items;
      }
      const res = await fetch("/api/suggest-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: split.receipt.items.map((it) => ({ id: it.id, name: it.name })),
          people: split.people.map((p) => ({ id: p.id, name: p.name })),
          history: Object.keys(history).length ? history : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Suggestion failed");
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Error");
    } finally {
      setSuggesting(false);
    }
  }

  function acceptAllSuggestions() {
    for (const sug of suggestions) {
      updateItem(split.id, sug.itemId, { ownerIds: sug.ownerIds });
    }
    setSuggestions([]);
    haptic("success");
  }

  function acceptSuggestion(itemId: string) {
    const sug = suggestions.find((s) => s.itemId === itemId);
    if (!sug) return;
    updateItem(split.id, itemId, { ownerIds: sug.ownerIds });
    setSuggestions((arr) => arr.filter((s) => s.itemId !== itemId));
    haptic("select");
  }

  function dismissSuggestions() {
    setSuggestions([]);
    setSuggestError(null);
  }

  const suggestionMap = useMemo(() => {
    const m = new Map<string, Suggestion>();
    for (const s of suggestions) m.set(s.itemId, s);
    return m;
  }, [suggestions]);

  useEffect(() => {
    if (!activePersonId && split.people.length > 0) {
      setActivePersonId(split.people[0].id);
    }
    if (activePersonId && !split.people.find((p) => p.id === activePersonId)) {
      setActivePersonId(split.people[0]?.id ?? null);
    }
  }, [split.people, activePersonId]);

  const ratio = assignedRatio(split.receipt);
  const sub = itemsSubtotal(split.receipt);

  const activePerson = split.people.find((p) => p.id === activePersonId) ?? null;
  const activeColor = activePerson ? colorByKey(activePerson.colorKey) : null;

  const personRunningTotal = useMemo(() => {
    if (!activePerson) return 0;
    return split.receipt.items.reduce((acc, it) => {
      if (!it.ownerIds.includes(activePerson.id)) return acc;
      return acc + (it.unitPrice * it.quantity) / it.ownerIds.length;
    }, 0);
  }, [activePerson, split.receipt.items]);

  function toggleAllForActive(itemId: string) {
    if (!activePerson) return;
    haptic("tap");
    if (splitMode === "everyone") {
      const item = split.receipt.items.find((i) => i.id === itemId);
      if (!item) return;
      const allIds = split.people.map((p) => p.id);
      const isFull = allIds.every((id) => item.ownerIds.includes(id));
      updateItem(split.id, itemId, {
        ownerIds: isFull ? [] : allIds,
      });
      return;
    }
    toggleItemOwner(split.id, itemId, activePerson.id);
  }

  if (split.people.length === 0) {
    return (
      <EmptyHint
        title={t("assign.empty_people.title")}
        text={t("assign.empty_people.body")}
      />
    );
  }
  if (split.receipt.items.length === 0) {
    return (
      <EmptyHint
        title={t("assign.empty_items.title")}
        text={t("assign.empty_items.body")}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="sticky top-[72px] z-20 -mx-4 px-4 pb-2 pt-1">
        <div className="glass-strong rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
              {t("assign.pick_person")}
            </span>
            <button
              onClick={() =>
                setSplitMode((m) => (m === "single" ? "everyone" : "single"))
              }
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors",
                splitMode === "everyone"
                  ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/40"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              <Users className="inline w-3 h-3 mr-1" />
              {t("assign.for_everyone")}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            {split.people.map((p) => {
              const isActive = p.id === activePersonId;
              const c = colorByKey(p.colorKey);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePersonId(p.id);
                    setSplitMode("single");
                    haptic("tap");
                  }}
                  className={cn(
                    "relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all shrink-0",
                    isActive && splitMode === "single"
                      ? `bg-gradient-to-br ${c.gradient} text-white shadow-lg ${c.glow}`
                      : "bg-white/5 hover:bg-white/10 text-zinc-300"
                  )}
                >
                  <Avatar name={p.name} colorKey={p.colorKey} size="xs" />
                  <span className="text-sm font-medium pr-1">{p.name}</span>
                </button>
              );
            })}
          </div>
          {activePerson && splitMode === "single" && (
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-zinc-500">{t("assign.running_total")}</span>
              <AnimatedMoney
                value={personRunningTotal}
                currency={split.receipt.currency}
                locale={moneyLocale}
                className={cn("font-semibold tabular-nums", activeColor?.text)}
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {suggestions.length === 0 && !suggestError && (
          <motion.button
            key="suggest-btn"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={fetchSuggestions}
            disabled={suggesting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl glass hover:glass-strong text-xs font-medium text-zinc-300 transition-colors disabled:opacity-60"
          >
            {suggesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-300" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            )}
            {suggesting ? t("assign.ai.thinking") : t("assign.ai.suggest")}
          </motion.button>
        )}
        {suggestions.length > 0 && (
          <motion.div
            key="suggest-banner"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-3 flex items-center gap-2 border border-violet-400/30 bg-violet-500/10"
          >
            <Sparkles className="w-4 h-4 text-violet-300 shrink-0" />
            <div className="min-w-0 flex-1 text-xs">
              <div className="font-medium text-violet-100">
                {t("assign.ai.ready", { n: suggestions.length })}
              </div>
              <div className="text-violet-200/60">{t("assign.ai.tap")}</div>
            </div>
            <button
              onClick={acceptAllSuggestions}
              className="px-3 py-1.5 rounded-lg bg-violet-500/30 hover:bg-violet-500/40 text-violet-100 text-xs font-medium transition-colors"
            >
              {t("assign.ai.accept_all")}
            </button>
            <button
              onClick={dismissSuggestions}
              className="p-1.5 rounded-lg text-violet-200/60 hover:text-violet-100 hover:bg-white/5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {suggestError && (
          <motion.div
            key="suggest-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 px-4 py-2.5 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1">{suggestError}</span>
            <button
              onClick={dismissSuggestions}
              className="p-1 rounded-lg text-rose-200/60 hover:text-rose-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {split.receipt.items.map((item) => {
            const isActiveOwner =
              splitMode === "single" && activePerson
                ? item.ownerIds.includes(activePerson.id)
                : splitMode === "everyone" &&
                  split.people.length > 0 &&
                  split.people.every((p) => item.ownerIds.includes(p.id));

            const total = item.unitPrice * item.quantity;
            const owners = item.ownerIds
              .map((id) => split.people.find((p) => p.id === id))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));

            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => toggleAllForActive(item.id)}
                  className={cn(
                    "w-full text-left rounded-2xl p-3.5 transition-all flex items-center gap-3 group",
                    isActiveOwner && activeColor && splitMode === "single"
                      ? `bg-gradient-to-br ${activeColor.gradient} text-white shadow-glow`
                      : item.ownerIds.length === 0
                        ? "glass border-dashed border-white/20"
                        : "glass hover:glass-strong"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg grid place-items-center transition-colors shrink-0",
                      isActiveOwner && splitMode === "single"
                        ? "bg-white/25"
                        : "bg-white/5"
                    )}
                  >
                    {isActiveOwner && splitMode === "single" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-[11px] tabular-nums text-zinc-400">
                        {item.quantity}×
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "font-medium truncate",
                        isActiveOwner && splitMode === "single"
                          ? "text-white"
                          : item.ownerIds.length === 0
                            ? "text-zinc-300"
                            : "text-zinc-200"
                      )}
                    >
                      {item.name || t("assign.no_name")}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      {owners.length > 0 ? (
                        <div className="flex -space-x-1.5">
                          {owners.slice(0, 6).map((p) => (
                            <Avatar
                              key={p.id}
                              name={p.name}
                              colorKey={p.colorKey}
                              size="xs"
                              className="ring-2 ring-[var(--background)]"
                            />
                          ))}
                          {owners.length > 6 && (
                            <span className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] grid place-items-center ring-2 ring-[var(--background)] text-zinc-300">
                              +{owners.length - 6}
                            </span>
                          )}
                        </div>
                      ) : suggestionMap.has(item.id) ? (
                        <SuggestionGhost
                          suggestion={suggestionMap.get(item.id)!}
                          people={split.people}
                          onAccept={(e) => {
                            e.stopPropagation();
                            acceptSuggestion(item.id);
                          }}
                          label={t("assign.ai.accept")}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                          <AlertCircle className="w-3 h-3" />
                          {t("assign.unassigned")}
                        </span>
                      )}
                      {owners.length > 1 && (
                        <span
                          className={cn(
                            "text-[11px]",
                            isActiveOwner && splitMode === "single"
                              ? "text-white/80"
                              : "text-zinc-500"
                          )}
                        >
                          {formatMoney(
                            total / owners.length,
                            split.receipt.currency,
                            moneyLocale
                          )}{" "}
                          {t("assign.per_person")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-right tabular-nums shrink-0",
                      isActiveOwner && splitMode === "single"
                        ? "text-white font-semibold"
                        : "text-zinc-300"
                    )}
                  >
                    {formatMoney(total, split.receipt.currency, moneyLocale)}
                  </div>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="sticky bottom-3 z-20 mt-4">
        <div className="glass-strong rounded-2xl p-3.5 shadow-2xl">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-400">
              {t("assign.assigned")}{" "}
              <span className="text-zinc-200 font-medium">
                {Math.round(ratio * 100)}%
              </span>
            </span>
            <span className="text-zinc-400 tabular-nums">
              {formatMoney(sub, split.receipt.currency, moneyLocale)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="h-full bg-gradient-to-r from-emerald-400 to-violet-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionGhost({
  suggestion,
  people,
  onAccept,
  label,
}: {
  suggestion: Suggestion;
  people: Split["people"];
  onAccept: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label: string;
}) {
  const suggested = suggestion.ownerIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (suggested.length === 0) return null;
  return (
    <button
      onClick={onAccept}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 transition-colors group"
    >
      <Sparkles className="w-2.5 h-2.5 text-violet-300" />
      <div className="flex -space-x-1">
        {suggested.slice(0, 3).map((p) => (
          <Avatar
            key={p.id}
            name={p.name}
            colorKey={p.colorKey}
            size="xs"
            className="ring-1 ring-[var(--background)] opacity-70 group-hover:opacity-100 transition-opacity"
          />
        ))}
      </div>
      <span className="text-[10px] font-medium text-violet-200">{label}</span>
    </button>
  );
}

function EmptyHint({ title, text }: { title: string; text: string }) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 grid place-items-center mb-3">
        <AlertCircle className="w-6 h-6 text-amber-300" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{text}</p>
    </div>
  );
}
