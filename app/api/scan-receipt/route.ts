import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  image: z
    .string()
    .min(20)
    .refine((s) => s.startsWith("data:image/"), {
      message: "image musi być data URL z prefiksem data:image/",
    }),
});

const ScannedReceiptSchema = z.object({
  store: z.string().default(""),
  date: z.string().default(""),
  currency: z.string().default("PLN"),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.coerce.number().positive().default(1),
        unitPrice: z.coerce.number().nonnegative(),
      })
    )
    .default([]),
  subtotal: z.coerce.number().nonnegative().default(0),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative().default(0),
});

const SYSTEM_PROMPT = `Jesteś ekspertem OCR paragonów (głównie polskich, ale wspieraj też EN/DE).
Wyodrębniasz pozycje z paragonu sklepowego ze zdjęcia. Zawsze zwracaj WYŁĄCZNIE JSON
w schemacie podanym przez użytkownika. Reguły:
- "name" to nazwa produktu (bez kodów, bez "PLN"), skróty rozwijaj jeśli pewne; jeśli wątpliwe zostaw oryginał.
- "quantity" to liczba sztuk (domyślnie 1 jeśli paragon nie pokazuje wprost).
- "unitPrice" to cena za sztukę w walucie paragonu (po rabacie). Jeśli paragon pokazuje tylko cenę łączną, podziel przez quantity.
- "subtotal" = suma items (przed podatkiem dodanym), "tax" = osobny podatek/opłata jeśli widoczny, "total" = całkowita kwota do zapłaty.
- "currency" = "PLN" dla polskich, "EUR" dla euro, "USD" dla dolarów (domyślnie PLN).
- "date" w formacie YYYY-MM-DD jeśli widoczna, inaczej pusty string.
- "store" to nazwa sklepu/restauracji jeśli widoczna (np. "Biedronka", "Żabka"), inaczej pusty string.
- Liczby mają być LICZBAMI (nie stringami). Używaj kropki jako separatora dziesiętnego.
- Pomijaj wiersze typu "RAZEM", "SUMA", "PTU", "NIP" - to nie są pozycje.
- Jeśli nic nie widać / zdjęcie nie jest paragonem: zwróć items: [] i total: 0.`;

const USER_PROMPT = `Wyodrębnij pozycje z tego paragonu jako JSON o strukturze:
{
  "store": string,
  "date": string,
  "currency": string,
  "items": [{ "name": string, "quantity": number, "unitPrice": number }],
  "subtotal": number,
  "tax": number,
  "total": number
}`;

const TRANSIENT_PATTERN = /5\d\d|429|overload|unavailable|exhaust|quota/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 2
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const transient = TRANSIENT_PATTERN.test(msg);
      console.warn(`[${label}] attempt ${i + 1}/${attempts} failed: ${msg}`);
      if (!transient || i === attempts - 1) throw err;
      await sleep(1200 + i * 1000);
    }
  }
  throw lastErr;
}

function parseDataUrl(image: string): { mimeType: string; data: string } {
  const match = image.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Niepoprawny data URL obrazu");
  return { mimeType: match[1], data: match[2] };
}

async function scanWithGemini(
  image: string,
  apiKey: string,
  modelName: string
): Promise<string> {
  const { mimeType, data } = parseDataUrl(image);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent([
    USER_PROMPT,
    { inlineData: { mimeType, data } },
  ]);
  return result.response.text();
}

async function scanWithOpenAI(image: string, apiKey: string): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: USER_PROMPT },
          { type: "image_url", image_url: { url: image, detail: "high" } },
        ],
      },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

type ProviderResult = { raw: string; provider: string };

async function runWithFallback(image: string): Promise<ProviderResult> {
  const errors: string[] = [];
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    for (const model of ["gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
      try {
        const raw = await withRetry(model, () =>
          scanWithGemini(image, geminiKey, model)
        );
        if (raw) return { raw, provider: model };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${model}: ${msg.slice(0, 160)}`);
      }
    }
  }

  if (openaiKey) {
    try {
      const raw = await withRetry("openai-gpt-4o", () =>
        scanWithOpenAI(image, openaiKey)
      );
      if (raw) return { raw, provider: "openai-gpt-4o" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`openai-gpt-4o: ${msg.slice(0, 160)}`);
    }
  }

  throw new Error(
    errors.length
      ? `Wszystkie modele AI niedostępne. Spróbuj za chwilę.\nSzczegóły: ${errors.join(" | ")}`
      : "Brak skonfigurowanego klucza AI"
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane wejściowe", details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Brak klucza AI. Ustaw GEMINI_API_KEY (darmowy) lub OPENAI_API_KEY w env Vercela.",
        },
        { status: 500 }
      );
    }

    const { raw, provider } = await runWithFallback(parsed.data.image);

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: `Model ${provider} zwrócił nieparsowalny JSON`, raw },
        { status: 502 }
      );
    }

    const result = ScannedReceiptSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        {
          error: `Model ${provider} zwrócił niezgodny ze schematem JSON`,
          details: result.error.format(),
          raw,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
