import type { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { buildHookSentinelReport } from "@/lib/swap/sentinel";
import type { HookSentinelReport, QuoteResult, Token } from "@/lib/swap/types";

export const runtime = "nodejs";

function extractJson(content: string) {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as Partial<HookSentinelReport>;
  } catch {
    return null;
  }
}

function safeText(value: unknown, fallback: string, maxLength = 220) {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  return value.trim().slice(0, maxLength);
}

function safeList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  return cleaned.length > 0 ? cleaned : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tokenIn,
      tokenOut,
      amountInHuman,
      slippageBps,
      quote,
    }: {
      tokenIn?: Token;
      tokenOut?: Token;
      amountInHuman?: string;
      slippageBps?: number;
      quote?: QuoteResult;
    } = body;

    if (!tokenIn || !tokenOut || !amountInHuman || !quote || typeof slippageBps !== "number") {
      return Response.json(
        { error: "tokenIn, tokenOut, amountInHuman, slippageBps, and quote are required" },
        { status: 400 }
      );
    }

    const baseline = buildHookSentinelReport({
      tokenIn,
      tokenOut,
      amountInHuman,
      slippageBps,
      quote,
    });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(baseline);
    }

    try {
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
          role: "system",
          content:
              "You are SwapMate AI Hook Sentinel. You explain Uniswap v4 swap and hook risk in concise product UI copy. Return valid JSON only. Do not invent unknown contract details. Preserve the provided status and blockers. No emoji, markdown, bullets, or hype.",
          },
          {
            role: "user",
            content: JSON.stringify(
              {
                task: "Rewrite title, summary, and recommendations for a pre-trade risk panel.",
                swap: {
                  tokenIn: tokenIn.symbol,
                  tokenOut: tokenOut.symbol,
                  amountInHuman,
                  slippageBps,
                },
                quote: {
                  route: quote.route,
                  poolFee: quote.poolFee,
                  priceImpact: quote.priceImpact,
                  gasEstimate: quote.gasEstimate,
                  hookAddress: quote.hookAddress,
                  hookLabel: quote.hookLabel,
                },
                deterministicReport: baseline,
                responseShape: {
                  title: "string",
                  summary: "string",
                  recommendations: ["string", "string"],
                },
              },
              null,
              2
            ),
          },
        ],
        temperature: 0.2,
        max_tokens: 420,
      });

      const ai = extractJson(completion.choices[0]?.message?.content ?? "");
      if (!ai) {
        return Response.json(baseline);
      }

      return Response.json({
        ...baseline,
        title: safeText(ai.title, baseline.title, 64),
        summary: safeText(ai.summary, baseline.summary),
        recommendations: safeList(ai.recommendations, baseline.recommendations),
        generatedBy: "ai",
      } satisfies HookSentinelReport);
    } catch (err) {
      console.error("[Sentinel AI Fallback]", err);
      return Response.json(baseline);
    }
  } catch (err) {
    console.error("[Sentinel Route]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Sentinel analysis failed" },
      { status: 500 }
    );
  }
}
