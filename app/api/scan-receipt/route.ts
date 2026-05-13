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

async function scanWithGemini(image: string, apiKey: string): Promise<string> {
  const match = image.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Niepoprawny data URL obrazu");
  const [, mimeType, base64Data] = match;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    USER_PROMPT,
    { inlineData: { mimeType, data: base64Data } },
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

    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    if (!hasGemini && !hasOpenAI) {
      return NextResponse.json(
        {
          error:
            "Brak klucza AI. Ustaw GEMINI_API_KEY (darmowy) lub OPENAI_API_KEY w env Vercela.",
        },
        { status: 500 }
      );
    }

    const raw = hasGemini
      ? await scanWithGemini(parsed.data.image, process.env.GEMINI_API_KEY!)
      : await scanWithOpenAI(parsed.data.image, process.env.OPENAI_API_KEY!);

    if (!raw) {
      return NextResponse.json(
        { error: "Model nie zwrócił żadnej odpowiedzi" },
        { status: 502 }
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Model zwrócił nieparsowalny JSON", raw },
        { status: 502 }
      );
    }

    const result = ScannedReceiptSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Model zwrócił niezgodny ze schematem JSON",
          details: result.error.format(),
          raw,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nieznany błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
