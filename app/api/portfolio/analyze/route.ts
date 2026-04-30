import type { NextRequest } from "next/server";
import { groq } from "@/lib/groq-client";

export const runtime = "nodejs";

const PORTFOLIO_SYSTEM_PROMPT = `You are SwapMate AI — an expert DeFi portfolio advisor for Sepolia testnet.

Analyze the user's wallet balances and provide a compact advisor result. You MUST respond with a valid JSON object only, no other text.

Response format:
{
  "summary": "One concise sentence portfolio assessment in English",
  "riskLevel": "low" | "medium" | "high",
  "suggestions": [
    {
      "text": "One short practical suggestion in English",
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
- Maximum 2 suggestions
- All amounts must be realistic based on the user's actual balances
- riskLevel: "high" if >80% in one volatile asset, "low" if well diversified with stablecoins, "medium" otherwise
- Use English for all text
- Suggestions must be actionable swaps only (no LP, no staking)
- Keep it brief. The user can ask the chat assistant for deeper reasoning.
- Supported tokens: ETH, WETH, USDC, UNI, LINK`;

type AnalyzeBalance = {
  token?: { symbol?: string };
  symbol?: string;
  human?: string;
  percentage?: number;
  usdValue?: number;
};

function normalizeBalance(balance: AnalyzeBalance) {
  return {
    symbol: balance.token?.symbol ?? balance.symbol ?? "UNKNOWN",
    human: balance.human ?? "0",
    percentage: Number(balance.percentage ?? 0),
    usdValue: Number(balance.usdValue ?? 0),
  };
}

function buildFallbackAnalysis(balances: ReturnType<typeof normalizeBalance>[]) {
  const top = balances.reduce<(typeof balances)[number] | null>(
    (current, balance) => (!current || balance.percentage > current.percentage ? balance : current),
    null
  );
  const stableShare = balances.find((balance) => balance.symbol === "USDC")?.percentage ?? 0;
  const volatileShare = Math.max(0, 100 - stableShare);
  const riskLevel =
    top && top.percentage > 80 && top.symbol !== "USDC"
      ? "high"
      : stableShare >= 25 && volatileShare <= 75
        ? "low"
        : "medium";

  const summary =
    riskLevel === "high" && top
      ? `The portfolio is still heavily concentrated in ${top.symbol}, so it is a good Sepolia test case for diversification.`
      : "The portfolio is reasonably balanced for Sepolia swap practice, but the volatile asset share still deserves attention.";

  const suggestions = [];
  const eth = balances.find((balance) => balance.symbol === "ETH" || balance.symbol === "WETH");
  if (eth && eth.percentage > 70) {
    const amount = Math.max(Number(eth.human) * 0.2, 0).toFixed(4);
    suggestions.push({
      text: "Reduce volatile concentration by moving a small portion into USDC.",
      buttonLabel: "Move 20% to USDC",
      intent: {
        tokenIn: eth.symbol,
        tokenOut: "USDC",
        amount,
        action: "execute",
      },
    });
  }

  if (stableShare < 10 && eth && suggestions.length < 2) {
    const amount = Math.max(Number(eth.human) * 0.1, 0).toFixed(4);
    suggestions.push({
      text: "Add a small stablecoin buffer so the portfolio has a lower-volatility reference point.",
      buttonLabel: "Add USDC buffer",
      intent: {
        tokenIn: eth.symbol,
        tokenOut: "USDC",
        amount,
        action: "execute",
      },
    });
  }

  return { summary, riskLevel, suggestions: suggestions.slice(0, 2) };
}

export async function POST(request: NextRequest) {
  try {
    const { balances, address } = await request.json();

    if (!balances || !Array.isArray(balances)) {
      return Response.json({ error: "Invalid balances" }, { status: 400 });
    }

    const normalized = balances.map(normalizeBalance);

    const balanceSummary = normalized
      .map((b) =>
        `${b.symbol}: ${b.human} (${b.percentage.toFixed(1)}%, ~$${b.usdValue.toFixed(0)})`
      )
      .join("\n");

    const userMessage = `Analyze this Sepolia testnet wallet (${address?.slice(0, 8)}...):

${balanceSummary}

Provide concise portfolio analysis and max 2 actionable suggestions.`;

    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: PORTFOLIO_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 450,
      });

      const content = completion.choices[0]?.message?.content ?? "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return Response.json(buildFallbackAnalysis(normalized));

      const analysis = JSON.parse(jsonMatch[0]);
      return Response.json(analysis);
    } catch (err) {
      console.error("[Portfolio Analyze AI fallback]", err);
      return Response.json(buildFallbackAnalysis(normalized));
    }
  } catch (err) {
    console.error("[Portfolio Analyze]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
