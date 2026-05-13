/**
 * Deterministyczny kolor per osoba na podstawie hash imienia.
 * Używamy konkretnej palety, żeby Tailwind purger nie wywalał klas.
 */

export type PersonColor = {
  key: string;
  bg: string;
  text: string;
  ring: string;
  glow: string;
  gradient: string;
  border: string;
};

export const personColors: PersonColor[] = [
  {
    key: "emerald",
    bg: "bg-emerald-500",
    text: "text-emerald-300",
    ring: "ring-emerald-400/60",
    glow: "shadow-emerald-500/40",
    gradient: "from-emerald-400 to-teal-500",
    border: "border-emerald-400/40",
  },
  {
    key: "violet",
    bg: "bg-violet-500",
    text: "text-violet-300",
    ring: "ring-violet-400/60",
    glow: "shadow-violet-500/40",
    gradient: "from-violet-400 to-fuchsia-500",
    border: "border-violet-400/40",
  },
  {
    key: "rose",
    bg: "bg-rose-500",
    text: "text-rose-300",
    ring: "ring-rose-400/60",
    glow: "shadow-rose-500/40",
    gradient: "from-rose-400 to-pink-500",
    border: "border-rose-400/40",
  },
  {
    key: "amber",
    bg: "bg-amber-500",
    text: "text-amber-300",
    ring: "ring-amber-400/60",
    glow: "shadow-amber-500/40",
    gradient: "from-amber-400 to-orange-500",
    border: "border-amber-400/40",
  },
  {
    key: "sky",
    bg: "bg-sky-500",
    text: "text-sky-300",
    ring: "ring-sky-400/60",
    glow: "shadow-sky-500/40",
    gradient: "from-sky-400 to-blue-500",
    border: "border-sky-400/40",
  },
  {
    key: "lime",
    bg: "bg-lime-500",
    text: "text-lime-300",
    ring: "ring-lime-400/60",
    glow: "shadow-lime-500/40",
    gradient: "from-lime-400 to-green-500",
    border: "border-lime-400/40",
  },
  {
    key: "fuchsia",
    bg: "bg-fuchsia-500",
    text: "text-fuchsia-300",
    ring: "ring-fuchsia-400/60",
    glow: "shadow-fuchsia-500/40",
    gradient: "from-fuchsia-400 to-pink-500",
    border: "border-fuchsia-400/40",
  },
  {
    key: "cyan",
    bg: "bg-cyan-500",
    text: "text-cyan-300",
    ring: "ring-cyan-400/60",
    glow: "shadow-cyan-500/40",
    gradient: "from-cyan-400 to-sky-500",
    border: "border-cyan-400/40",
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function colorForName(name: string): PersonColor {
  if (!name) return personColors[0];
  const idx = hashString(name.toLowerCase()) % personColors.length;
  return personColors[idx];
}

export function colorByKey(key: string): PersonColor {
  return personColors.find((c) => c.key === key) ?? personColors[0];
}

/** Wybiera kolor dla nowej osoby, preferując nieużywane klucze. */
export function pickColorKey(usedKeys: string[]): string {
  const used = new Set(usedKeys);
  const free = personColors.find((c) => !used.has(c.key));
  if (free) return free.key;
  return personColors[usedKeys.length % personColors.length].key;
}
