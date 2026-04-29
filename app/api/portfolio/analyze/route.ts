import type { NextRequest } from "next/server";
import { groq } from "@/lib/groq-client";

export const runtime = "nodejs";

const PORTFOLIO_SYSTEM_PROMPT = `You are SwapMate AI — an expert DeFi portfolio advisor for Sepolia testnet.

Analyze the user's wallet balances and provide actionable insights. You MUST respond with a valid JSON object only, no other text.

Response format:
{
  "summary": "Brief 1-2 sentence portfolio assessment in Bahasa Indonesia",
  "riskLevel": "low" | "medium" | "high",
  "suggestions": [
    {
      "text": "Plain text explanation of the suggestion (1-2 sentences, Bahasa Indonesia)",
      "buttonLabel": "Short action label (e.g. 'Diversify 30% to USDC')",
      "intent": {
        "tokenIn": "ETH",
        "tokenOut": "USDC",
        "amount": "0.1",
        "action": "execute"
      }
    }
  ]
}

Rules:
- Maximum 3 suggestions
- All amounts must be realistic based on the user's actual balances
- riskLevel: "high" if >80% in one volatile asset, "low" if well diversified with stablecoins, "medium" otherwise
- Use Bahasa Indonesia for all text
- Suggestions must be actionable swaps only (no LP, no staking)
- Supported tokens: ETH, WETH, USDC, UNI, LINK`;

export async function POST(request: NextRequest) {
  try {
    const { balances, address } = await request.json();

    if (!balances || !Array.isArray(balances)) {
      return Response.json({ error: "Invalid balances" }, { status: 400 });
    }

    const balanceSummary = balances
      .map((b: { token: { symbol: string }; human: string; percentage: number; usdValue: number }) =>
        `${b.token.symbol}: ${b.human} (${b.percentage.toFixed(1)}%, ~$${b.usdValue.toFixed(0)})`
      )
      .join("\n");

    const userMessage = `Analyze this Sepolia testnet wallet (${address?.slice(0, 8)}...):

${balanceSummary}

Provide portfolio analysis and max 3 actionable suggestions.`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: PORTFOLIO_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Invalid AI response" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return Response.json(analysis);
  } catch (err) {
    console.error("[Portfolio Analyze]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
