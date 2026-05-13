import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .min(1),
  people: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .min(1),
  history: z
    .record(z.string(), z.array(z.string()))
    .optional(),
});

const ResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      itemId: z.string(),
      ownerIds: z.array(z.string()),
      confidence: z.number().min(0).max(1).default(0.5),
      reason: z.string().optional(),
    })
  ),
});

const SYSTEM_PROMPT = `You are an assistant that suggests how to split a restaurant/shopping bill.
Given a list of items and a list of people, you suggest which person (or people) is most likely to pay for each item.

Rules:
- Use the item name to guess (e.g. "Cola Zero" might match someone who often drinks Cola; "Sałatka grecka" looks vegetarian).
- If you cannot tell, you may assign multiple people (shared item like pizza, fries).
- If you have history (items each person had before), prefer matches from history.
- Common items (water, bread, shared appetizers) -> share between everyone.
- Drinks usually go to one person (unless explicitly shared).
- Use the EXACT itemId and ownerIds from input - do not invent new ids.
- Return JSON only, no commentary.

Schema:
{ "suggestions": [ { "itemId": string, "ownerIds": string[], "confidence": 0..1, "reason": string } ] }`;

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
      console.warn(`[${label}] attempt ${i + 1}/${attempts}: ${msg}`);
      if (!TRANSIENT_PATTERN.test(msg) || i === attempts - 1) throw err;
      await sleep(1000 + i * 800);
    }
  }
  throw lastErr;
}

function buildUserPrompt(payload: z.infer<typeof RequestSchema>): string {
  return `People:\n${payload.people
    .map((p) => `- ${p.id}: ${p.name}`)
    .join("\n")}\n\nItems:\n${payload.items
    .map((it) => `- ${it.id}: ${it.name}`)
    .join("\n")}${
    payload.history
      ? `\n\nHistory (what each person previously had):\n${Object.entries(
          payload.history
        )
          .map(
            ([pid, names]) =>
              `- ${pid}: ${names.slice(0, 20).join(", ")}`
          )
          .join("\n")}`
      : ""
  }\n\nSuggest assignments as JSON.`;
}

async function suggestWithGemini(
  userPrompt: string,
  apiKey: string,
  modelName: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

async function suggestWithOpenAI(
  userPrompt: string,
  apiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

async function runWithFallback(userPrompt: string): Promise<string> {
  const errors: string[] = [];
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    for (const model of ["gemini-2.5-flash-lite", "gemini-2.5-flash"]) {
      try {
        const raw = await withRetry(model, () =>
          suggestWithGemini(userPrompt, geminiKey, model)
        );
        if (raw) return raw;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${model}: ${msg.slice(0, 120)}`);
      }
    }
  }

  if (openaiKey) {
    try {
      const raw = await withRetry("openai-gpt-4o-mini", () =>
        suggestWithOpenAI(userPrompt, openaiKey)
      );
      if (raw) return raw;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`openai-gpt-4o-mini: ${msg.slice(0, 120)}`);
    }
  }

  throw new Error(
    errors.length
      ? `All AI providers failed: ${errors.join(" | ")}`
      : "No AI key configured"
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No AI provider key configured" },
        { status: 500 }
      );
    }

    const userPrompt = buildUserPrompt(parsed.data);
    const raw = await runWithFallback(userPrompt);

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Bad JSON from model", raw },
        { status: 502 }
      );
    }
    const result = ResponseSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Schema mismatch", details: result.error.format() },
        { status: 502 }
      );
    }

    const validItemIds = new Set(parsed.data.items.map((i) => i.id));
    const validPersonIds = new Set(parsed.data.people.map((p) => p.id));
    const filtered = result.data.suggestions
      .filter((s) => validItemIds.has(s.itemId))
      .map((s) => ({
        ...s,
        ownerIds: s.ownerIds.filter((id) => validPersonIds.has(id)),
      }))
      .filter((s) => s.ownerIds.length > 0);

    return NextResponse.json({ suggestions: filtered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
