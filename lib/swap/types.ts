import { type Address } from "viem";

// ─── TOKEN ──────────────────────────────────────────────

export interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  isNative?: boolean;
}

// ─── QUOTE ──────────────────────────────────────────────

export interface QuoteParams {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;   // raw amount in smallest unit
  slippageBps?: number; // default 50 (0.5%)
}

export interface QuoteResult {
  amountOut: string;       // raw
  amountOutMin: string;    // raw, after slippage
  priceImpact: number;     // percentage
  gasEstimate: string;     // human readable ETH
  route: "SINGLE_HOP" | "MULTI_HOP";
  poolFee?: number;
  tickSpacing?: number;
  hookAddress?: string;
  hookLabel?: string;
  // v4 sorted pool info (needed for execution)
  currency0?: string;
  currency1?: string;
  zeroForOne?: boolean;
}

// ─── AI HOOK SENTINEL ───────────────────────────────────

export type SentinelStatus = "clear" | "caution" | "blocked";
export type SentinelCheckState = "pass" | "watch" | "fail";

export interface TradeGuardrails {
  maxPriceImpact: number;
  maxSlippageBps: number;
  blockCustomHooks: boolean;
}

export interface SentinelCheck {
  label: string;
  value: string;
  state: SentinelCheckState;
  detail: string;
}

export interface HookSentinelReport {
  status: SentinelStatus;
  title: string;
  summary: string;
  hookAddress: string;
  hookLabel: string;
  confidence: number;
  generatedBy: "rules" | "ai";
  policy: TradeGuardrails;
  checks: SentinelCheck[];
  recommendations: string[];
  blockers: string[];
}

// ─── SWAP HISTORY ─────────────────────────────────────

export interface SwapRecord {
  id: string;
  timestamp: number;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;        // human readable
  amountOut: string;       // human readable
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  chainId: number;
}

// ─── AI MESSAGE ───────────────────────────────────────

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ParsedSwapIntent {
  tokenIn?: string;  // symbol
  tokenOut?: string; // symbol
  amount?: string;   // human readable
  slippage?: number;
  slippageBps?: number;  // AI-suggested slippage override
  riskNote?: string;     // AI risk advisory message
  action?: "quote" | "execute";
}

// ─── BATCH SWAP ───────────────────────────────────────

export type BatchSwapStatus = "pending" | "quoting" | "swapping" | "done" | "error";

export interface BatchSwapItem extends ParsedSwapIntent {
  id: string;
  status: BatchSwapStatus;
  txHash?: string;
  errorMsg?: string;
  quote?: QuoteResult;
}

export interface BatchSwapIntent {
  swaps: BatchSwapItem[];
}
