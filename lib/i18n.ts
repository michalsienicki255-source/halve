"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "pl" | "en";

const DICT = {
  pl: {
    // ===== Common =====
    "common.back": "Wstecz",
    "common.next": "Dalej",
    "common.save": "Zapisz",
    "common.cancel": "Anuluj",
    "common.delete": "Usuń",
    "common.add": "Dodaj",
    "common.share": "Udostępnij",
    "common.copy": "Kopiuj",
    "common.copied": "Skopiowano",
    "common.confirm_delete": 'Usunąć "{name}"? Tej akcji nie cofniesz.',

    // ===== Brand =====
    "brand.tagline": "Podziel rachunek inteligentnie",
    "brand.description":
      "Zrób zdjęcie paragonu, dodaj znajomych, kliknij osobę i zaznacz jej pozycje. AI policzy resztę.",

    // ===== Home =====
    "home.title.1": "Podziel rachunek",
    "home.title.2": "w 30 sekund.",
    "home.subtitle":
      "Zrób zdjęcie paragonu, dodaj znajomych, klikaj pozycje. AI wyciągnie produkty, my podzielimy koszty.",
    "home.cta.scan.kicker": "AI Scan",
    "home.cta.scan.title": "Skanuj paragon",
    "home.cta.scan.sub": "Zdjęcie lub kamera",
    "home.cta.blank.kicker": "Bez paragonu",
    "home.cta.blank.title": "Wpisz pozycje ręcznie",
    "home.cta.blank.sub": "Gdy nie masz paragonu pod ręką",
    "home.demo.title": "Zobacz przykład",
    "home.demo.sub": "Gotowy paragon z 3 osobami — bez API key, kliknij i graj",
    "home.history": "Twoje rozliczenia",
    "home.empty": "Brak rozliczeń. Zacznij od skanu paragonu.",
    "home.badge.draft": "Draft",
    "home.ai_badge": "AI Receipt OCR",

    // ===== Scan =====
    "scan.title": "Wrzuć paragon",
    "scan.subtitle":
      "AI odczyta produkty i ceny. Zaraz potem przypiszesz je do osób.",
    "scan.drop": "Przeciągnij zdjęcie tutaj",
    "scan.drop.hint": "lub kliknij, żeby wybrać plik (JPG, PNG, WEBP — max 8 MB)",
    "scan.pick": "Wybierz zdjęcie",
    "scan.camera": "Zrób zdjęcie",
    "scan.tip.align": "Wyrównaj",
    "scan.tip.align.body": "Ustaw paragon prostopadle, dobrze oświetlony.",
    "scan.tip.shadows": "Bez cieni",
    "scan.tip.shadows.body": "Cienie i zagięcia mogą zmylić OCR.",
    "scan.tip.frame": "Wszystko w kadrze",
    "scan.tip.frame.body": "Łap od nagłówka do sumy.",
    "scan.go": "Skanuj paragon AI",
    "scan.change": "Zmień zdjęcie",
    "scan.loading.1": "Czytam paragon...",
    "scan.loading.2": "Rozpoznaję pozycje...",
    "scan.loading.3": "Liczę podatki i sumę...",
    "scan.error.too_big": "Plik za duży (max 8MB). Spróbuj mniejsze zdjęcie.",
    "scan.error.read": "Błąd odczytu pliku",
    "scan.error.unknown": "Nieznany błąd",
    "scan.back": "Wróć",

    // ===== Steps =====
    "step.items": "Pozycje",
    "step.people": "Osoby",
    "step.assign": "Podział",
    "step.summary": "Suma",

    // ===== Step: Items =====
    "items.title.label": "Tytuł rozliczenia",
    "items.title.placeholder": "np. Kolacja Zabka 21.05",
    "items.list.label": "Pozycje",
    "items.empty": "Brak pozycji",
    "items.add_first": "Dodaj pierwszą pozycję",
    "items.subtotal": "Suma pozycji",
    "items.tax": "Podatek / opłata",
    "items.tip": "Napiwek",
    "items.total": "Razem",
    "items.currency_aria": "Waluta",

    // ===== Step: People =====
    "people.add.label": "Dodaj osobę",
    "people.add.placeholder": "np. Kasia",
    "people.add.exists": "Osoba o tym imieniu już jest na liście.",
    "people.color_hint": "Każda osoba dostanie swój kolor — pomoże w przypisywaniu pozycji.",
    "people.list.label": "Osoby",
    "people.empty": "Dodaj kogoś, z kim dzielisz rachunek",
    "people.hint_continue": "Dodaj kolejną osobę albo przejdź do podziału",
    "people.groups.label": "Twoje paczki",
    "people.group.save": "Zapisz tę paczkę na później",
    "people.group.placeholder": "np. Ekipa weekend",
    "people.group.confirm_delete": 'Usunąć paczkę "{name}"?',

    // ===== Step: Assign =====
    "assign.pick_person": "Wybierz osobę",
    "assign.for_everyone": "Dla wszystkich",
    "assign.running_total": "Bieżąca kwota",
    "assign.empty_people.title": "Najpierw dodaj osoby",
    "assign.empty_people.body": 'Wróć do kroku „Osoby", żeby dodać kto dzieli rachunek.',
    "assign.empty_items.title": "Brak pozycji do przypisania",
    "assign.empty_items.body": 'Wróć do kroku „Pozycje" i dodaj produkty.',
    "assign.unassigned": "Nieprzypisane",
    "assign.no_name": "Pozycja bez nazwy",
    "assign.per_person": "/ os.",
    "assign.assigned": "Przypisane",
    "assign.ai.suggest": "Daj AI podpowiedzieć kto co bierze",
    "assign.ai.thinking": "AI myśli...",
    "assign.ai.ready": "{n} sugestii AI gotowych",
    "assign.ai.tap": "Tapnij sugestię przy pozycji albo zaakceptuj wszystkie",
    "assign.ai.accept_all": "Akceptuj wszystkie",
    "assign.ai.accept": "Akceptuj",

    // ===== Step: Summary =====
    "summary.done": "Gotowe",
    "summary.title": "Podsumowanie",
    "summary.total": "Razem",
    "summary.all_assigned": "Wszystkie pozycje przypisane",
    "summary.unassigned": "{n} nieprzypisanych pozycji · wróć do podziału",
    "summary.empty": 'Brak osób — wróć do kroku „Osoby".',
    "summary.positions.one": "pozycja",
    "summary.positions.few": "pozycje",
    "summary.positions.many": "pozycji",
    "summary.tax_tip": "podatek/napiwek",
    "summary.tax": "Podatek",
    "summary.tip": "Napiwek",
    "summary.no_items": "Brak przypisanych pozycji.",
    "summary.share": "Udostępnij rozliczenie",
    "summary.mismatch":
      "Suma per osoba ({sum}) różni się od total ({total}). Sprawdź czy wszystko jest przypisane.",

    // ===== Split nav =====
    "split.list": "Lista",
    "split.next.items": "Dalej: Osoby",
    "split.next.items_disabled": "Dodaj pozycję",
    "split.next.people": "Dalej: Podział",
    "split.next.people_disabled": "Dodaj osobę",
    "split.next.assign": "Pokaż podsumowanie",
    "split.next.summary": "Wróć do listy",

    // ===== PWA =====
    "pwa.install.title": "Zainstaluj Halve",
    "pwa.install.sub": "Apka na ekranie głównym, działa offline",
    "pwa.install.cta": "Zainstaluj",

    // ===== Share =====
    "share.title": "Udostępnij rozliczenie",
    "share.tab.poster": "Poster",
    "share.tab.qr": "Link / QR",
    "share.poster.hint":
      "Pionowy format 9:16 — idealny na IG Stories albo TikToka.",
    "share.poster.share": "Udostępnij obraz",
    "share.qr.focus": "Co ma zobaczyć znajomy",
    "share.qr.all": "Cały rachunek",
    "share.qr.hint_all":
      "Każdy ze znajomych zobaczy pełne rozliczenie po zeskanowaniu kodu.",
    "share.qr.hint_person":
      "Wybrana osoba zobaczy tylko swoją kwotę i swoje pozycje — bez logowania.",

    // ===== Shared view (/s) =====
    "shared.your_total": "Twoja kwota",
    "shared.full_split": "Pełne rozliczenie",
    "shared.your_items": "Twoje pozycje",
    "shared.open_app": "Otwórz Halve",
    "shared.broken": "Link jest uszkodzony lub niepełny.",
    "shared.go_home": "Wróć do strony głównej",
  },

  en: {
    // ===== Common =====
    "common.back": "Back",
    "common.next": "Next",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.add": "Add",
    "common.share": "Share",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.confirm_delete": 'Delete "{name}"? This cannot be undone.',

    // ===== Brand =====
    "brand.tagline": "Split bills smartly",
    "brand.description":
      "Take a photo of the receipt, add friends, tap a person and select their items. AI does the math.",

    // ===== Home =====
    "home.title.1": "Split the bill",
    "home.title.2": "in 30 seconds.",
    "home.subtitle":
      "Snap the receipt, add friends, tap items. AI extracts products, we split the costs.",
    "home.cta.scan.kicker": "AI Scan",
    "home.cta.scan.title": "Scan receipt",
    "home.cta.scan.sub": "Photo or camera",
    "home.cta.blank.kicker": "No receipt",
    "home.cta.blank.title": "Add items manually",
    "home.cta.blank.sub": "When you don't have the receipt",
    "home.demo.title": "See an example",
    "home.demo.sub": "Sample receipt with 3 people — no API key, tap and play",
    "home.history": "Your splits",
    "home.empty": "No splits yet. Start by scanning a receipt.",
    "home.badge.draft": "Draft",
    "home.ai_badge": "AI Receipt OCR",

    // ===== Scan =====
    "scan.title": "Upload a receipt",
    "scan.subtitle":
      "AI will extract products and prices. Then you'll assign them to people.",
    "scan.drop": "Drag a photo here",
    "scan.drop.hint": "or click to pick a file (JPG, PNG, WEBP — max 8 MB)",
    "scan.pick": "Pick a photo",
    "scan.camera": "Take a photo",
    "scan.tip.align": "Align",
    "scan.tip.align.body": "Keep the receipt straight and well-lit.",
    "scan.tip.shadows": "No shadows",
    "scan.tip.shadows.body": "Shadows and folds can confuse OCR.",
    "scan.tip.frame": "Full frame",
    "scan.tip.frame.body": "Capture from header to total.",
    "scan.go": "Scan with AI",
    "scan.change": "Change photo",
    "scan.loading.1": "Reading the receipt...",
    "scan.loading.2": "Detecting items...",
    "scan.loading.3": "Calculating totals...",
    "scan.error.too_big": "File too large (max 8MB). Try a smaller photo.",
    "scan.error.read": "Failed to read file",
    "scan.error.unknown": "Unknown error",
    "scan.back": "Back",

    // ===== Steps =====
    "step.items": "Items",
    "step.people": "People",
    "step.assign": "Assign",
    "step.summary": "Total",

    // ===== Step: Items =====
    "items.title.label": "Split title",
    "items.title.placeholder": "e.g. Dinner at Zabka 21.05",
    "items.list.label": "Items",
    "items.empty": "No items",
    "items.add_first": "Add first item",
    "items.subtotal": "Subtotal",
    "items.tax": "Tax / fee",
    "items.tip": "Tip",
    "items.total": "Total",
    "items.currency_aria": "Currency",

    // ===== Step: People =====
    "people.add.label": "Add person",
    "people.add.placeholder": "e.g. Kate",
    "people.add.exists": "A person with this name is already on the list.",
    "people.color_hint": "Each person gets their own color — helps with assigning items.",
    "people.list.label": "People",
    "people.empty": "Add someone you're splitting the bill with",
    "people.hint_continue": "Add another person or move to assignment",
    "people.groups.label": "Your groups",
    "people.group.save": "Save this group for later",
    "people.group.placeholder": "e.g. Weekend crew",
    "people.group.confirm_delete": 'Delete group "{name}"?',

    // ===== Step: Assign =====
    "assign.pick_person": "Pick a person",
    "assign.for_everyone": "For everyone",
    "assign.running_total": "Running total",
    "assign.empty_people.title": "Add people first",
    "assign.empty_people.body":
      'Go back to the "People" step to add who shares the bill.',
    "assign.empty_items.title": "No items to assign",
    "assign.empty_items.body": 'Go back to the "Items" step and add products.',
    "assign.unassigned": "Unassigned",
    "assign.no_name": "Unnamed item",
    "assign.per_person": "/ ea.",
    "assign.assigned": "Assigned",
    "assign.ai.suggest": "Let AI guess who had what",
    "assign.ai.thinking": "AI thinking...",
    "assign.ai.ready": "{n} AI suggestions ready",
    "assign.ai.tap": "Tap a suggestion next to an item or accept all",
    "assign.ai.accept_all": "Accept all",
    "assign.ai.accept": "Accept",

    // ===== Step: Summary =====
    "summary.done": "Done",
    "summary.title": "Summary",
    "summary.total": "Total",
    "summary.all_assigned": "All items assigned",
    "summary.unassigned": "{n} unassigned items · go back to assign",
    "summary.empty": 'No people — go back to the "People" step.',
    "summary.positions.one": "item",
    "summary.positions.few": "items",
    "summary.positions.many": "items",
    "summary.tax_tip": "tax/tip",
    "summary.tax": "Tax",
    "summary.tip": "Tip",
    "summary.no_items": "No assigned items.",
    "summary.share": "Share split",
    "summary.mismatch":
      "Per-person total ({sum}) doesn't match the receipt total ({total}). Check the assignment.",

    // ===== Split nav =====
    "split.list": "List",
    "split.next.items": "Next: People",
    "split.next.items_disabled": "Add an item",
    "split.next.people": "Next: Assign",
    "split.next.people_disabled": "Add a person",
    "split.next.assign": "Show summary",
    "split.next.summary": "Back to list",

    // ===== PWA =====
    "pwa.install.title": "Install Halve",
    "pwa.install.sub": "Add to home screen, works offline",
    "pwa.install.cta": "Install",

    // ===== Share =====
    "share.title": "Share split",
    "share.tab.poster": "Poster",
    "share.tab.qr": "Link / QR",
    "share.poster.hint":
      "Vertical 9:16 format — perfect for IG Stories or TikTok.",
    "share.poster.share": "Share image",
    "share.qr.focus": "What your friend sees",
    "share.qr.all": "Full split",
    "share.qr.hint_all":
      "Each friend sees the full breakdown after scanning the code.",
    "share.qr.hint_person":
      "The selected person sees only their amount and items — no login.",

    // ===== Shared view (/s) =====
    "shared.your_total": "Your total",
    "shared.full_split": "Full split",
    "shared.your_items": "Your items",
    "shared.open_app": "Open Halve",
    "shared.broken": "The link is broken or incomplete.",
    "shared.go_home": "Back to home",
  },
} as const;

export type TKey = keyof (typeof DICT)["pl"];

type LocaleState = {
  locale: Locale;
  hydrated: boolean;
  setLocale: (l: Locale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "pl",
      hydrated: false,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "halve-locale-v1",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: TKey, vars?: Record<string, string | number>): string => {
    let value: string = DICT[locale][key] ?? DICT.pl[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return value;
  };
}

/** Polish-friendly pluralization for "items" count. */
export function plural(
  count: number,
  forms: { one: string; few: string; many: string }
): string {
  if (count === 1) return forms.one;
  const rest = count % 10;
  const tens = count % 100;
  if (rest >= 2 && rest <= 4 && (tens < 12 || tens > 14)) return forms.few;
  return forms.many;
}
