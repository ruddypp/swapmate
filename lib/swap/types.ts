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
  // v4 sorted pool info (needed for execution)
  currency0?: string;
  currency1?: string;
  zeroForOne?: boolean;
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
