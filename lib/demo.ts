import type { Person, ReceiptItem, Split } from "./types";
import { uid } from "./utils";

const DEMO_ITEMS: { name: string; quantity: number; unitPrice: number }[] = [
  { name: "Pizza Margherita", quantity: 1, unitPrice: 38.0 },
  { name: "Pizza Pepperoni", quantity: 1, unitPrice: 42.0 },
  { name: "Spaghetti Carbonara", quantity: 1, unitPrice: 34.0 },
  { name: "Sałatka grecka", quantity: 1, unitPrice: 26.0 },
  { name: "Cola 0.5l", quantity: 3, unitPrice: 9.0 },
  { name: "Tiramisu", quantity: 2, unitPrice: 18.0 },
  { name: "Espresso", quantity: 2, unitPrice: 12.0 },
];

const DEMO_PEOPLE: { name: string; colorKey: string }[] = [
  { name: "Kasia", colorKey: "emerald" },
  { name: "Marek", colorKey: "violet" },
  { name: "Ania", colorKey: "rose" },
];

/** Tworzy w pełni grywalny demo split z przykładowymi pozycjami i osobami. */
export function createDemoSplit(): Split {
  const items: ReceiptItem[] = DEMO_ITEMS.map((it) => ({
    id: uid("item"),
    name: it.name,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    ownerIds: [],
  }));
  const people: Person[] = DEMO_PEOPLE.map((p) => ({
    id: uid("person"),
    name: p.name,
    colorKey: p.colorKey,
  }));
  const subtotal = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const tip = Math.round(subtotal * 0.1 * 100) / 100;

  return {
    id: uid("split"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "draft",
    title: "Demo — Pizzeria u Mario",
    receipt: {
      store: "Pizzeria u Mario",
      date: new Date().toISOString().slice(0, 10),
      items,
      subtotal,
      tax: 0,
      tip,
      total: subtotal + tip,
      currency: "PLN",
    },
    people,
  };
}
