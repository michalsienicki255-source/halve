"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { useT } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "halve-install-dismissed";

export function PwaProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* silent */
        });
    }
  }, []);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setOpen(false);
  }

  function dismiss() {
    setOpen(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-sm"
        >
          <div className="glass-strong rounded-2xl p-3.5 shadow-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-violet-500/30 grid place-items-center shrink-0">
              <Download className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{t("pwa.install.title")}</div>
              <div className="text-xs text-zinc-400">{t("pwa.install.sub")}</div>
            </div>
            <button
              onClick={install}
              className="px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white text-xs font-medium shadow-glow"
            >
              {t("pwa.install.cta")}
            </button>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
