import type { NextRequest } from "next/server";
import { getQuote } from "@/lib/swap/quote";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenIn, tokenOut, amountIn, slippageBps } = body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return Response.json(
        { error: "tokenIn, tokenOut, amountIn are required" },
        { status: 400 }
      );
    }

    const result = await getQuote({ tokenIn, tokenOut, amountIn, slippageBps });
    return Response.json(result);
  } catch (err) {
    console.error("[Quote Route]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Quote failed" },
      { status: 500 }
    );
  }
}
