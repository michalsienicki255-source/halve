"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, UserPlus, X, Users, Bookmark, BookmarkPlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSplits } from "@/lib/store";
import type { Split } from "@/lib/types";
import { Avatar } from "../Avatar";
import { colorByKey } from "@/lib/colors";
import { useT } from "@/lib/i18n";

export function StepPeople({ split }: { split: Split }) {
  const { addPerson, removePerson, renamePerson, applyGroup, saveGroup, deleteGroup } =
    useSplits();
  const groups = useSplits((s) => s.groups);
  const groupOrder = useSplits((s) => s.groupOrder);
  const t = useT();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSaveGroup, setShowSaveGroup] = useState(false);
  const [groupName, setGroupName] = useState("");

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const added = addPerson(split.id, trimmed);
    if (!added) {
      setError(t("people.add.exists"));
      return;
    }
    setError(null);
    setName("");
  }

  function handleSaveGroup() {
    const result = saveGroup(split.id, groupName);
    if (result) {
      setShowSaveGroup(false);
      setGroupName("");
    }
  }

  const availableGroups = groupOrder
    .map((id) => groups[id])
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2">
          {t("people.add.label")}
        </label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={t("people.add.placeholder")}
            className="flex-1 bg-white/5 rounded-xl px-3.5 py-3 outline-none focus:bg-white/10 transition-colors text-base"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-4 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white text-sm font-medium shadow-glow disabled:opacity-40 disabled:hover:translate-y-0 hover:-translate-y-0.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
        <p className="mt-2 text-xs text-zinc-500">{t("people.color_hint")}</p>
      </div>

      {availableGroups.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs uppercase tracking-wider text-zinc-500 inline-flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              {t("people.groups.label")}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableGroups.map((g) => {
              const existingNames = new Set(
                split.people.map((p) => p.name.toLowerCase())
              );
              const toAdd = g.members.filter(
                (m) => !existingNames.has(m.name.toLowerCase())
              ).length;
              return (
                <div
                  key={g.id}
                  className="group inline-flex items-center gap-1.5 rounded-full glass-strong pl-1 pr-1 py-1"
                >
                  <button
                    onClick={() => applyGroup(split.id, g.id)}
                    disabled={toAdd === 0}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <div className="flex -space-x-1.5">
                      {g.members.slice(0, 3).map((m, i) => (
                        <Avatar
                          key={`${g.id}-${i}`}
                          name={m.name}
                          colorKey={m.colorKey}
                          size="xs"
                          className="ring-2 ring-[var(--background)]"
                        />
                      ))}
                    </div>
                    <span>{g.name}</span>
                    <span className="text-zinc-500 text-[10px]">
                      ({g.members.length})
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t("people.group.confirm_delete", { name: g.name }))) {
                        deleteGroup(g.id);
                      }
                    }}
                    className="p-1 rounded-full text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Usuń paczkę"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium">
              {t("people.list.label")} ({split.people.length})
            </span>
          </div>
        </div>

        {split.people.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 grid place-items-center animate-float mb-3">
              <Users className="w-5 h-5 text-violet-300" />
            </div>
            <p className="text-sm text-zinc-400">{t("people.empty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {split.people.map((p) => {
                const c = colorByKey(p.colorKey);
                return (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="px-3.5 py-3 flex items-center gap-3"
                  >
                    <Avatar name={p.name} colorKey={p.colorKey} size="md" />
                    <input
                      value={p.name}
                      onChange={(e) => renamePerson(split.id, p.id, e.target.value)}
                      className="min-w-0 flex-1 bg-transparent outline-none text-base font-medium border-b border-transparent focus:border-white/15 transition-colors py-1"
                    />
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${c.text}`}>
                      {p.colorKey}
                    </span>
                    <button
                      onClick={() => removePerson(split.id, p.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      aria-label="Usuń osobę"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {split.people.length >= 2 && (
        <div className="space-y-3">
          {!showSaveGroup ? (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowSaveGroup(true)}
              className="w-full glass hover:glass-strong rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-zinc-300 transition-colors"
            >
              <BookmarkPlus className="w-4 h-4 text-violet-300" />
              {t("people.group.save")}
              <span className="text-zinc-500 text-xs ml-auto">
                {split.people.length}
              </span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-3 flex gap-2"
            >
              <input
                autoFocus
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveGroup();
                  if (e.key === "Escape") {
                    setShowSaveGroup(false);
                    setGroupName("");
                  }
                }}
                placeholder={t("people.group.placeholder")}
                className="flex-1 bg-white/5 rounded-xl px-3 py-2 outline-none focus:bg-white/10 transition-colors text-sm"
              />
              <button
                onClick={handleSaveGroup}
                disabled={!groupName.trim()}
                className="px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white text-sm font-medium disabled:opacity-40 transition-all"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => {
                  setShowSaveGroup(false);
                  setGroupName("");
                }}
                className="px-3 py-2 rounded-xl glass text-sm transition-colors hover:glass-strong"
              >
                {t("common.cancel")}
              </button>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-zinc-500"
          >
            <Plus className="inline w-3 h-3 mr-1" />
            {t("people.hint_continue")}
          </motion.div>
        </div>
      )}
    </div>
  );
}
