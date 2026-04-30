import type { Token } from "@/lib/swap/types";

// ─── PORTFOLIO TYPES ──────────────────────────────────────────────────────────

export interface TokenBalance {
  token: Token;
  raw: bigint;
  human: string;
  usdValue: number;
  percentage: number;
}

export interface Suggestion {
  text: string;
  buttonLabel: string;
  intent: {
    tokenIn: string;
    tokenOut: string;
    amount: string;
    action: "execute";
  };
}

export interface PortfolioAnalysis {
  summary: string;
  riskLevel: "low" | "medium" | "high";
  suggestions: Suggestion[];
}

export interface PortfolioContextSnapshot {
  status: "disconnected" | "loading" | "ready" | "empty" | "error";
  updatedAt?: string;
  totalUsd: number;
  stableShare: number;
  volatileShare: number;
  balances: Array<{
    symbol: string;
    name: string;
    human: string;
    percentage: number;
    usdValue: number;
  }>;
  analysis?: PortfolioAnalysis | null;
  error?: string;
}
