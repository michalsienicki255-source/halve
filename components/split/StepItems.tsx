"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, Receipt as ReceiptIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSplits } from "@/lib/store";
import type { ReceiptItem, Split } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import { itemsSubtotal } from "@/lib/split-math";
import { AnimatedMoney } from "../AnimatedNumber";
import { CURRENCIES, currencyByCode } from "@/lib/currencies";
import { useLocaleStore, useT } from "@/lib/i18n";

export function StepItems({ split }: { split: Split }) {
  const { addItem, updateItem, removeItem, patchReceipt, setTitle } = useSplits();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const moneyLocale = locale === "pl" ? "pl-PL" : "en-US";

  const sub = itemsSubtotal(split.receipt);

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">
              {t("items.title.label")}
            </label>
            <input
              value={split.title}
              onChange={(e) => setTitle(split.id, e.target.value)}
              placeholder={t("items.title.placeholder")}
              className="w-full bg-transparent text-lg font-semibold outline-none border-b border-white/10 focus:border-emerald-400/60 transition-colors pb-1"
            />
          </div>
          <CurrencyPicker
            value={split.receipt.currency}
            onChange={(code) => patchReceipt(split.id, { currency: code })}
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium">
              {t("items.list.label")} ({split.receipt.items.length})
            </span>
          </div>
          <button
            onClick={() => addItem(split.id)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("common.add")}
          </button>
        </div>

        {split.receipt.items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 grid place-items-center animate-float mb-3">
              <ReceiptIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm text-zinc-400">{t("items.empty")}</p>
            <button
              onClick={() => addItem(split.id)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300"
            >
              <Plus className="w-4 h-4" />
              {t("items.add_first")}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {split.receipt.items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ItemRow
                    item={item}
                    currency={split.receipt.currency}
                    locale={moneyLocale}
                    onUpdate={(patch) => updateItem(split.id, item.id, patch)}
                    onRemove={() => removeItem(split.id, item.id)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <MoneyRow
          label={t("items.subtotal")}
          value={sub}
          currency={split.receipt.currency}
          locale={moneyLocale}
          dim
        />
        <MoneyInputRow
          label={t("items.tax")}
          value={split.receipt.tax}
          currency={split.receipt.currency}
          onChange={(v) => patchReceipt(split.id, { tax: v })}
        />
        <MoneyInputRow
          label={t("items.tip")}
          value={split.receipt.tip}
          currency={split.receipt.currency}
          onChange={(v) => patchReceipt(split.id, { tip: v })}
        />
        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
          <span className="text-sm font-medium">{t("items.total")}</span>
          <AnimatedMoney
            value={split.receipt.total}
            currency={split.receipt.currency}
            locale={moneyLocale}
            className="text-xl font-semibold tabular-nums text-gradient"
          />
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  item,
  currency,
  locale,
  onUpdate,
  onRemove,
}: {
  item: ReceiptItem;
  currency: string;
  locale: string;
  onUpdate: (patch: Partial<ReceiptItem>) => void;
  onRemove: () => void;
}) {
  const total = item.unitPrice * item.quantity;
  return (
    <div className="px-3.5 py-3 flex items-center gap-2.5">
      <input
        value={item.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Nazwa"
        className="min-w-0 flex-1 bg-transparent outline-none text-sm font-medium border-b border-transparent focus:border-white/15 transition-colors py-1"
      />
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onUpdate({ quantity: Math.max(1, item.quantity - 1) })}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center text-zinc-300"
          aria-label="Zmniejsz"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-6 text-center tabular-nums text-sm">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdate({ quantity: item.quantity + 1 })}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center text-zinc-300"
          aria-label="Zwiększ"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={item.unitPrice === 0 ? "" : item.unitPrice}
          placeholder="0.00"
          onChange={(e) => {
            const v = e.target.value === "" ? 0 : parseFloat(e.target.value);
            onUpdate({ unitPrice: isFinite(v) ? v : 0 });
          }}
          className="w-16 bg-white/5 rounded-lg px-2 py-1 text-right text-sm tabular-nums outline-none focus:bg-white/10 transition-colors"
        />
        <span className="text-[10px] text-zinc-500 uppercase">{currency}</span>
      </div>
      <div className="hidden sm:block w-20 text-right text-xs text-zinc-500 tabular-nums shrink-0">
        = {formatMoney(total, currency, locale)}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
        aria-label="Usuń"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  currency,
  locale,
  dim,
}: {
  label: string;
  value: number;
  currency: string;
  locale?: string;
  dim?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={dim ? "text-sm text-zinc-400" : "text-sm"}>{label}</span>
      <AnimatedMoney
        value={value}
        currency={currency}
        locale={locale}
        className={`tabular-nums ${dim ? "text-zinc-300" : "font-medium"}`}
      />
    </div>
  );
}

function CurrencyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = currencyByCode(value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-200 transition-colors"
        aria-label="Waluta"
      >
        <span className="text-zinc-400 text-[11px]">{current.symbol}</span>
        <span>{current.code}</span>
        <ChevronDown
          className={`w-3 h-3 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-1.5 z-40 glass-strong rounded-xl py-1 min-w-[160px] shadow-2xl"
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 flex items-center gap-2 transition-colors ${
                  c.code === value ? "text-emerald-300" : "text-zinc-200"
                }`}
              >
                <span className="w-5 text-zinc-500">{c.symbol}</span>
                <span className="font-medium">{c.code}</span>
                <span className="text-zinc-500 ml-auto">{c.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

function MoneyInputRow({
  label,
  value,
  currency,
  onChange,
}: {
  label: string;
  value: number;
  currency: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={value === 0 ? "" : value}
          placeholder="0.00"
          onChange={(e) => {
            const v = e.target.value === "" ? 0 : parseFloat(e.target.value);
            onChange(isFinite(v) ? v : 0);
          }}
          className="w-20 bg-white/5 rounded-lg px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:bg-white/10 transition-colors"
        />
        <span className="text-[10px] text-zinc-500 uppercase">{currency}</span>
      </div>
    </div>
  );
}
