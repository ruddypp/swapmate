import type { NextRequest } from "next/server";
import { groq } from "@/lib/groq-client";
import type {
  MissionAction,
  MissionKind,
  MissionPriority,
  StrategyMission,
  StrategyMissionResponse,
} from "@/lib/strategy/types";

export const runtime = "nodejs";

const SUPPORTED_TOKENS = new Set(["ETH", "WETH", "USDC", "UNI", "LINK"]);
const MISSION_KINDS = new Set<MissionKind>(["rebalance", "learn", "risk", "route"]);
const PRIORITIES = new Set<MissionPriority>(["high", "medium", "low"]);

const STRATEGY_SYSTEM_PROMPT = `You are SwapMate Mission Control, an expert AI planning layer for a Uniswap v4 Sepolia dApp.

Create compact, actionable strategy missions from the user's portfolio, risk analysis, and recent swap history.

Respond with valid JSON only:
{
  "missions": [
    {
      "id": "mission-1",
      "title": "Reduce ETH Concentration",
      "kind": "rebalance" | "learn" | "risk" | "route",
      "priority": "high" | "medium" | "low",
      "summary": "One short sentence.",
      "rationale": "One short sentence explaining why this mission matters.",
      "actionLabel": "Prepare Swap",
      "action": {
        "type": "prepare_swap" | "ask_ai",
        "tokenIn": "ETH",
        "tokenOut": "USDC",
        "amount": "0.01",
        "prompt": "Optional deeper question for the assistant"
      }
    }
  ]
}

Rules:
- English only.
- Maximum 3 missions.
- Never execute swaps. Use prepare_swap only to prefill a quote.
- Use ask_ai for education, route review, or anything that should be explained before trading.
- Amounts must be realistic relative to the user's balances.
- Mention Sepolia testnet when useful.
- Supported tokens: ETH, WETH, USDC, UNI, LINK.`;

type MissionBalance = {
  symbol?: string;
  name?: string;
  human?: string;
  percentage?: number;
  usdValue?: number;
};

type MissionRequestContext = {
  address?: string;
  portfolio?: {
    totalUsd?: number;
    stableShare?: number;
    volatileShare?: number;
    balances?: MissionBalance[];
    analysis?: unknown;
  };
  history?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeBalances(balances: unknown): Required<MissionBalance>[] {
  if (!Array.isArray(balances)) return [];

  return balances
    .map((item) => {
      const rec = asRecord(item);
      if (!rec) return null;

      const symbol = readString(rec.symbol).toUpperCase();
      if (!SUPPORTED_TOKENS.has(symbol)) return null;

      return {
        symbol,
        name: readString(rec.name, symbol),
        human: readString(rec.human, "0"),
        percentage: readNumber(rec.percentage),
        usdValue: readNumber(rec.usdValue),
      };
    })
    .filter((item): item is Required<MissionBalance> => Boolean(item));
}

function cleanAmount(amount: string) {
  return /^[0-9]+(\.[0-9]+)?$/.test(amount) ? amount : "";
}

function fallbackSwapAmount(balance?: Required<MissionBalance>, pct = 0.15) {
  if (!balance) return "";
  const amount = Number(balance.human) * pct;
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return amount >= 1 ? amount.toFixed(2) : amount.toFixed(4);
}

function sanitizeAction(action: unknown, fallbackPrompt: string): MissionAction {
  const rec = asRecord(action);
  if (!rec) return { type: "ask_ai", prompt: fallbackPrompt };

  const type = readString(rec.type);
  if (type === "prepare_swap") {
    const tokenIn = readString(rec.tokenIn).toUpperCase();
    const tokenOut = readString(rec.tokenOut).toUpperCase();
    const amount = cleanAmount(readString(rec.amount));

    if (SUPPORTED_TOKENS.has(tokenIn) && SUPPORTED_TOKENS.has(tokenOut) && tokenIn !== tokenOut && amount) {
      return {
        type: "prepare_swap",
        tokenIn,
        tokenOut,
        amount,
        prompt: readString(rec.prompt, fallbackPrompt),
      };
    }
  }

  return {
    type: "ask_ai",
    prompt: readString(rec.prompt, fallbackPrompt),
  };
}

function sanitizeMissions(raw: unknown): StrategyMission[] {
  const root = asRecord(raw);
  const source = Array.isArray(raw) ? raw : root && Array.isArray(root.missions) ? root.missions : [];

  return source
    .slice(0, 3)
    .map((item, index) => {
      const rec = asRecord(item);
      if (!rec) return null;

      const title = readString(rec.title, `Strategy Mission ${index + 1}`);
      const kind = readString(rec.kind, "risk") as MissionKind;
      const priority = readString(rec.priority, "medium") as MissionPriority;
      const fallbackPrompt = `Explain this SwapMate mission in detail: ${title}`;

      return {
        id: readString(rec.id, `mission-${index + 1}`),
        title,
        kind: MISSION_KINDS.has(kind) ? kind : "risk",
        priority: PRIORITIES.has(priority) ? priority : "medium",
        summary: readString(rec.summary, "Review this wallet before the next Sepolia testnet swap."),
        rationale: readString(rec.rationale, "This mission uses your portfolio and recent activity as context."),
        actionLabel: readString(rec.actionLabel, "Ask AI"),
        action: sanitizeAction(rec.action, fallbackPrompt),
      };
    })
    .filter((item): item is StrategyMission => Boolean(item));
}

function buildFallbackMissions(context: MissionRequestContext): StrategyMissionResponse {
  const balances = normalizeBalances(context.portfolio?.balances);
  const top = balances.reduce<Required<MissionBalance> | null>(
    (current, balance) => (!current || balance.percentage > current.percentage ? balance : current),
    null
  );
  const topIsVolatile = Boolean(top && top.symbol !== "USDC" && top.percentage > 70);
  const swapAmount = fallbackSwapAmount(top ?? undefined, 0.18);

  const missions: StrategyMission[] = [];

  if (topIsVolatile && top && swapAmount) {
    missions.push({
      id: "mission-rebalance",
      title: `Reduce ${top.symbol} Concentration`,
      kind: "rebalance",
      priority: "high",
      summary: `${top.symbol} is ${top.percentage.toFixed(1)}% of the wallet, so a small USDC buffer makes the test portfolio easier to compare.`,
      rationale: "This turns the portfolio into a clearer before-and-after learning case on Sepolia testnet.",
      actionLabel: "Prepare Swap",
      action: {
        type: "prepare_swap",
        tokenIn: top.symbol,
        tokenOut: "USDC",
        amount: swapAmount,
        prompt: `Explain why moving ${swapAmount} ${top.symbol} into USDC can reduce concentration risk on Sepolia testnet.`,
      },
    });
  }

  missions.push({
    id: "mission-quote-lab",
    title: "Run a Slippage Learning Lab",
    kind: "learn",
    priority: topIsVolatile ? "medium" : "high",
    summary: "Compare one route across 0.1%, 0.5%, and 1.0% slippage before trading.",
    rationale: "The mission makes slippage visible as a decision, not a hidden setting.",
    actionLabel: "Ask AI",
    action: {
      type: "ask_ai",
      prompt: "Create a short slippage learning plan for my current Sepolia portfolio and explain what I should compare before swapping.",
    },
  });

  missions.push({
    id: "mission-route-review",
    title: "Review Route Safety",
    kind: "route",
    priority: "medium",
    summary: "Use SwapMate AI to review price impact, fee tier, gas, and hook context before the next swap.",
    rationale: "This reinforces the Uniswap v4 narrative by making route safety part of the workflow.",
    actionLabel: "Ask AI",
    action: {
      type: "ask_ai",
      prompt: "Review my next Uniswap v4 Sepolia swap route for price impact, slippage, gas, fee tier, and hook safety.",
    },
  });

  return { missions: missions.slice(0, 3) };
}

export async function POST(request: NextRequest) {
  try {
    const context = (await request.json()) as MissionRequestContext;
    const normalizedContext = {
      ...context,
      portfolio: {
        ...context.portfolio,
        balances: normalizeBalances(context.portfolio?.balances),
      },
    };

    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: STRATEGY_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate strategy missions from this context:\n${JSON.stringify(normalizedContext, null, 2)}`,
          },
        ],
        temperature: 0.25,
        max_tokens: 850,
      });

      const content = completion.choices[0]?.message?.content ?? "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return Response.json(buildFallbackMissions(normalizedContext));

      const parsed = JSON.parse(jsonMatch[0]);
      const missions = sanitizeMissions(parsed);
      return Response.json(missions.length > 0 ? { missions } : buildFallbackMissions(normalizedContext));
    } catch (err) {
      console.error("[Strategy Missions AI fallback]", err);
      return Response.json(buildFallbackMissions(normalizedContext));
    }
  } catch (err) {
    console.error("[Strategy Missions]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Mission generation failed" },
      { status: 500 }
    );
  }
}
