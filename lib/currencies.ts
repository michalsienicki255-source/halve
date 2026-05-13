import type { Currency } from "./types";

export const CURRENCIES: Currency[] = [
  { code: "PLN", symbol: "zł", label: "Złoty" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "Dolar" },
  { code: "GBP", symbol: "£", label: "Funt" },
  { code: "CHF", symbol: "CHF", label: "Frank" },
  { code: "CZK", symbol: "Kč", label: "Korona czeska" },
  { code: "SEK", symbol: "kr", label: "Korona szwedzka" },
  { code: "NOK", symbol: "kr", label: "Korona norweska" },
];

export function currencyByCode(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
