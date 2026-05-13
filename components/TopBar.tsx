"use client";

import { BrandMark } from "./BrandMark";
import type { ReactNode } from "react";
import { useLocaleStore } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className="safe-top sticky top-0 z-30">
      <div className="mx-auto max-w-2xl px-4 pt-3 pb-3">
        <div className="glass rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-2">
            {right}
            <LangSwitch />
          </div>
        </div>
      </div>
    </header>
  );
}

function LangSwitch() {
  const { locale, setLocale } = useLocaleStore();
  return (
    <button
      onClick={() => setLocale(locale === "pl" ? "en" : "pl")}
      className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
      aria-label="Language"
    >
      <Languages className="w-3.5 h-3.5" />
      <span suppressHydrationWarning>{locale.toUpperCase()}</span>
    </button>
  );
}
