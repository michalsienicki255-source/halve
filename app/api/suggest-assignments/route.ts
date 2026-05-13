import { NextResponse } from "next/server";
import OpenAI from "openai";
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
  /** Optional history for personalization: per person, list of items they ate before. */
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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const payload = parsed.data;

    const userPrompt = `People:\n${payload.people
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

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

    const validItemIds = new Set(payload.items.map((i) => i.id));
    const validPersonIds = new Set(payload.people.map((p) => p.id));
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
