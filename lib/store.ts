"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GroupTemplate,
  Person,
  ReceiptItem,
  ScannedReceipt,
  Split,
} from "./types";
import { pickColorKey } from "./colors";
import { uid } from "./utils";
import { createDemoSplit } from "./demo";

type SplitsState = {
  splits: Record<string, Split>;
  order: string[];
  groups: Record<string, GroupTemplate>;
  groupOrder: string[];
  hydrated: boolean;
  createFromScan: (data: ScannedReceipt, imageDataUrl?: string) => string;
  createBlank: () => string;
  createDemo: () => string;
  getSplit: (id: string) => Split | undefined;
  updateSplit: (id: string, patch: Partial<Split>) => void;
  patchReceipt: (id: string, patch: Partial<Split["receipt"]>) => void;
  addItem: (id: string, item?: Partial<ReceiptItem>) => void;
  updateItem: (id: string, itemId: string, patch: Partial<ReceiptItem>) => void;
  removeItem: (id: string, itemId: string) => void;
  toggleItemOwner: (id: string, itemId: string, personId: string) => void;
  addPerson: (id: string, name: string) => Person | null;
  removePerson: (id: string, personId: string) => void;
  renamePerson: (id: string, personId: string, name: string) => void;
  markDone: (id: string) => void;
  deleteSplit: (id: string) => void;
  setTitle: (id: string, title: string) => void;
  saveGroup: (id: string, name: string) => GroupTemplate | null;
  deleteGroup: (groupId: string) => void;
  applyGroup: (id: string, groupId: string) => void;
};

function recalcTotal(receipt: Split["receipt"]): Split["receipt"] {
  const subtotal = receipt.items.reduce(
    (acc, it) => acc + it.unitPrice * it.quantity,
    0
  );
  return {
    ...receipt,
    subtotal,
    total: subtotal + receipt.tax + receipt.tip,
  };
}

export const useSplits = create<SplitsState>()(
  persist(
    (set, get) => ({
      splits: {},
      order: [],
      groups: {},
      groupOrder: [],
      hydrated: false,

      createFromScan: (data, imageDataUrl) => {
        const id = uid("split");
        const items: ReceiptItem[] = data.items.map((it) => ({
          id: uid("item"),
          name: it.name,
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          ownerIds: [],
        }));
        const subtotal = items.reduce(
          (acc, it) => acc + it.unitPrice * it.quantity,
          0
        );
        const fallbackStore = data.store?.trim() || "Paragon";
        const split: Split = {
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "draft",
          title: fallbackStore,
          imageDataUrl,
          receipt: {
            store: fallbackStore,
            date: data.date || new Date().toISOString().slice(0, 10),
            items,
            subtotal,
            tax: Math.max(0, (data.total ?? subtotal) - subtotal),
            tip: 0,
            total: data.total || subtotal,
            currency: data.currency || "PLN",
          },
          people: [],
        };
        set((s) => ({
          splits: { ...s.splits, [id]: split },
          order: [id, ...s.order],
        }));
        return id;
      },

      createBlank: () => {
        const id = uid("split");
        const split: Split = {
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: "draft",
          title: "Nowy rachunek",
          receipt: {
            store: "Paragon",
            date: new Date().toISOString().slice(0, 10),
            items: [],
            subtotal: 0,
            tax: 0,
            tip: 0,
            total: 0,
            currency: "PLN",
          },
          people: [],
        };
        set((s) => ({
          splits: { ...s.splits, [id]: split },
          order: [id, ...s.order],
        }));
        return id;
      },

      createDemo: () => {
        const split = createDemoSplit();
        set((s) => ({
          splits: { ...s.splits, [split.id]: split },
          order: [split.id, ...s.order],
        }));
        return split.id;
      },

      getSplit: (id) => get().splits[id],

      updateSplit: (id, patch) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          return {
            splits: {
              ...s.splits,
              [id]: { ...cur, ...patch, updatedAt: Date.now() },
            },
          };
        });
      },

      patchReceipt: (id, patch) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          const nextReceipt = recalcTotal({ ...cur.receipt, ...patch });
          return {
            splits: {
              ...s.splits,
              [id]: { ...cur, receipt: nextReceipt, updatedAt: Date.now() },
            },
          };
        });
      },

      addItem: (id, item) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          const newItem: ReceiptItem = {
            id: uid("item"),
            name: item?.name ?? "Nowa pozycja",
            quantity: item?.quantity ?? 1,
            unitPrice: item?.unitPrice ?? 0,
            ownerIds: item?.ownerIds ?? [],
          };
          const nextReceipt = recalcTotal({
            ...cur.receipt,
            items: [...cur.receipt.items, newItem],
          });
          return {
            splits: {
              ...s.splits,
              [id]: { ...cur, receipt: nextReceipt, updatedAt: Date.now() },
            },
          };
        });
      },

      updateItem: (id, itemId, patch) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          const items = cur.receipt.items.map((it) =>
            it.id === itemId ? { ...it, ...patch } : it
          );
          const nextReceipt = recalcTotal({ ...cur.receipt, items });
          return {
            splits: {
              ...s.splits,
              [id]: { ...cur, receipt: nextReceipt, updatedAt: Date.now() },
            },
          };
        });
      },

      removeItem: (id, itemId) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          const items = cur.receipt.items.filter((it) => it.id !== itemId);
          const nextReceipt = recalcTotal({ ...cur.receipt, items });
          return {
            splits: {
              ...s.splits,
              [id]: { ...cur, receipt: nextReceipt, updatedAt: Date.now() },
            },
          };
        });
      },

      toggleItemOwner: (id, itemId, personId) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          const items = cur.receipt.items.map((it) => {
            if (it.id !== itemId) return it;
            const has = it.ownerIds.includes(personId);
            return {
              ...it,
              ownerIds: has
                ? it.ownerIds.filter((p) => p !== personId)
                : [...it.ownerIds, personId],
            };
          });
          return {
            splits: {
              ...s.splits,
              [id]: {
                ...cur,
                receipt: { ...cur.receipt, items },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      addPerson: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const cur = get().splits[id];
        if (!cur) return null;
        if (cur.people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
          return null;
        }
        const newPerson: Person = {
          id: uid("person"),
          name: trimmed,
          colorKey: pickColorKey(cur.people.map((p) => p.colorKey)),
        };
        set((s) => ({
          splits: {
            ...s.splits,
            [id]: {
              ...cur,
              people: [...cur.people, newPerson],
              updatedAt: Date.now(),
            },
          },
        }));
        return newPerson;
      },

      removePerson: (id, personId) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          const items = cur.receipt.items.map((it) => ({
            ...it,
            ownerIds: it.ownerIds.filter((p) => p !== personId),
          }));
          return {
            splits: {
              ...s.splits,
              [id]: {
                ...cur,
                people: cur.people.filter((p) => p.id !== personId),
                receipt: { ...cur.receipt, items },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      renamePerson: (id, personId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          return {
            splits: {
              ...s.splits,
              [id]: {
                ...cur,
                people: cur.people.map((p) =>
                  p.id === personId ? { ...p, name: trimmed } : p
                ),
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      setTitle: (id, title) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          return {
            splits: {
              ...s.splits,
              [id]: { ...cur, title: title.trim() || cur.title, updatedAt: Date.now() },
            },
          };
        });
      },

      markDone: (id) => {
        set((s) => {
          const cur = s.splits[id];
          if (!cur) return s;
          return {
            splits: {
              ...s.splits,
              [id]: { ...cur, status: "done", updatedAt: Date.now() },
            },
          };
        });
      },

      deleteSplit: (id) => {
        set((s) => {
          const { [id]: _removed, ...rest } = s.splits;
          return {
            splits: rest,
            order: s.order.filter((x) => x !== id),
          };
        });
      },

      saveGroup: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const cur = get().splits[id];
        if (!cur || cur.people.length === 0) return null;
        const groupId = uid("group");
        const group: GroupTemplate = {
          id: groupId,
          name: trimmed,
          members: cur.people.map((p) => ({
            name: p.name,
            colorKey: p.colorKey,
          })),
          createdAt: Date.now(),
        };
        set((s) => ({
          groups: { ...s.groups, [groupId]: group },
          groupOrder: [groupId, ...s.groupOrder],
        }));
        return group;
      },

      deleteGroup: (groupId) => {
        set((s) => {
          const { [groupId]: _removed, ...rest } = s.groups;
          return {
            groups: rest,
            groupOrder: s.groupOrder.filter((x) => x !== groupId),
          };
        });
      },

      applyGroup: (id, groupId) => {
        set((s) => {
          const cur = s.splits[id];
          const group = s.groups[groupId];
          if (!cur || !group) return s;
          const existingNames = new Set(
            cur.people.map((p) => p.name.toLowerCase())
          );
          const usedKeys = cur.people.map((p) => p.colorKey);
          const additions: Person[] = [];
          for (const m of group.members) {
            if (existingNames.has(m.name.toLowerCase())) continue;
            const colorKey = usedKeys.includes(m.colorKey)
              ? pickColorKey([...usedKeys, ...additions.map((a) => a.colorKey)])
              : m.colorKey;
            additions.push({
              id: uid("person"),
              name: m.name,
              colorKey,
            });
          }
          if (additions.length === 0) return s;
          return {
            splits: {
              ...s.splits,
              [id]: {
                ...cur,
                people: [...cur.people, ...additions],
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
    }),
    {
      name: "halve-store-v2",
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
