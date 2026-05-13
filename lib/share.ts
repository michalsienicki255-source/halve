import LZString from "lz-string";
import type { Split } from "./types";

/**
 * Encode the split into a minimal JSON shape and compress it to URL-safe base64.
 * Used for share links without a backend.
 */
type SharedSplit = {
  t: string; // title
  c: string; // currency
  d: number; // createdAt
  s?: string; // store
  it: [string, number, number, number[]][]; // [name, qty, price, ownerIdx[]]
  p: [string, string][]; // [name, colorKey]
  tx: number; // tax
  tp: number; // tip
};

function toShared(split: Split): SharedSplit {
  const indexByPersonId = new Map(split.people.map((p, i) => [p.id, i]));
  return {
    t: split.title,
    c: split.receipt.currency,
    d: split.createdAt,
    s: split.receipt.store || undefined,
    p: split.people.map((p) => [p.name, p.colorKey]),
    it: split.receipt.items.map((it) => [
      it.name,
      it.quantity,
      it.unitPrice,
      it.ownerIds
        .map((id) => indexByPersonId.get(id) ?? -1)
        .filter((i) => i >= 0),
    ]),
    tx: split.receipt.tax,
    tp: split.receipt.tip,
  };
}

export function encodeSplit(split: Split): string {
  const data = toShared(split);
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodeSplit(encoded: string): Split | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data = JSON.parse(json) as SharedSplit;
    return fromShared(data);
  } catch {
    return null;
  }
}

function fromShared(data: SharedSplit): Split {
  const peopleIds = data.p.map((_, idx) => `p${idx}`);
  return {
    id: "shared",
    createdAt: data.d || Date.now(),
    updatedAt: data.d || Date.now(),
    status: "done",
    title: data.t || "Shared split",
    receipt: {
      store: data.s || "",
      date: new Date(data.d || Date.now()).toISOString().slice(0, 10),
      items: data.it.map((row, i) => ({
        id: `i${i}`,
        name: row[0],
        quantity: row[1],
        unitPrice: row[2],
        ownerIds: row[3].map((idx) => peopleIds[idx]).filter(Boolean),
      })),
      subtotal: data.it.reduce((acc, row) => acc + row[1] * row[2], 0),
      tax: data.tx || 0,
      tip: data.tp || 0,
      total:
        data.it.reduce((acc, row) => acc + row[1] * row[2], 0) +
        (data.tx || 0) +
        (data.tp || 0),
      currency: data.c || "PLN",
    },
    people: data.p.map(([name, colorKey], i) => ({
      id: peopleIds[i],
      name,
      colorKey,
    })),
  };
}

export function buildShareUrl(split: Split, personId?: string): string {
  const encoded = encodeSplit(split);
  let url = `${typeof window !== "undefined" ? window.location.origin : ""}/s#${encoded}`;
  if (personId) {
    const idx = split.people.findIndex((p) => p.id === personId);
    if (idx >= 0) url += `&me=${idx}`;
  }
  return url;
}

export function parseShareUrl(hash: string): {
  encoded: string;
  meIndex: number | null;
} {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const [encoded, ...rest] = clean.split("&");
  const meParam = rest.find((p) => p.startsWith("me="));
  const meIndex = meParam ? parseInt(meParam.slice(3), 10) : NaN;
  return {
    encoded,
    meIndex: Number.isFinite(meIndex) ? meIndex : null,
  };
}
