export type ReceiptItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** Lista id osób, do których przypisany jest produkt (puste = nieprzypisane). */
  ownerIds: string[];
};

export type Person = {
  id: string;
  name: string;
  /** Tailwind kolor hue dla awatara (np. "emerald", "violet"). */
  colorKey: string;
};

export type Receipt = {
  store: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  /** Podatek / opłata serwisowa - dzielona proporcjonalnie. */
  tax: number;
  /** Napiwek - również dzielony proporcjonalnie. */
  tip: number;
  total: number;
  currency: string;
};

export type SplitStatus = "draft" | "done";

export type Split = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: SplitStatus;
  title: string;
  imageDataUrl?: string;
  receipt: Receipt;
  people: Person[];
};

export type GroupTemplate = {
  id: string;
  name: string;
  members: { name: string; colorKey: string }[];
  createdAt: number;
};

export type Currency = {
  code: string;
  symbol: string;
  label: string;
};

export type PersonSummary = {
  personId: string;
  items: { itemId: string; share: number }[];
  itemsTotal: number;
  taxShare: number;
  tipShare: number;
  total: number;
};

/** Odpowiedź z API /api/scan-receipt - przed nadaniem id pozycjom. */
export type ScannedReceipt = {
  store: string;
  date: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
};
