import type { NextRequest } from "next/server";
import { groq, SWAPMATE_SYSTEM_PROMPT } from "@/lib/groq-client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    if (!Array.isArray(messages)) {
      return Response.json({ error: "messages must be an array" }, { status: 400 });
    }

    // Build system prompt with optional app context: swap, history, portfolio, and active tab.
    let systemPrompt = SWAPMATE_SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\nCurrent app context:\n${JSON.stringify(context, null, 2)}`;
    }

    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      stream: true,
      temperature: 0.3,
      max_tokens: 800,
    });

    // Stream the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[AI Route]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "AI error" },
      { status: 500 }
    );
  }
}
