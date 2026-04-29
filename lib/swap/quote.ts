import { createPublicClient, http, type Address } from "viem";
import { sepolia } from "wagmi/chains";
import type { QuoteParams, QuoteResult } from "./types";
import { QUOTER_V4_ADDRESS } from "./tokens";

// ─── V4 QUOTER ABI (V4Quoter.sol quoteExactInputSingle) ───────────────────────
// Source: https://github.com/Uniswap/v4-periphery/blob/main/src/lens/V4Quoter.sol
const QUOTER_V4_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
            name: "poolKey",
            type: "tuple",
          },
          { name: "zeroForOne", type: "bool" },
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/demo";

// Token address for quoting: native ETH uses address(0) in v4
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Fee tiers + corresponding tick spacings for v4
const POOL_CONFIGS = [
  { fee: 500, tickSpacing: 10 },
  { fee: 3000, tickSpacing: 60 },
  { fee: 10000, tickSpacing: 200 },
] as const;

// In v4, currency0 < currency1 by address (sorted)
function sortCurrencies(
  a: string,
  b: string
): { currency0: string; currency1: string; zeroForOne: boolean } {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  const zeroForOne = aLower < bLower;
  return {
    currency0: zeroForOne ? a : b,
    currency1: zeroForOne ? b : a,
    zeroForOne,
  };
}

// ─── GET QUOTE ────────────────────────────────────────────────────────────────

export async function getQuote(params: QuoteParams): Promise<QuoteResult> {
  const { tokenIn, tokenOut, amountIn, slippageBps = 50 } = params;

  // v4 uses address(0) for native ETH
  const addrIn = tokenIn.isNative ? ZERO_ADDRESS : tokenIn.address;
  const addrOut = tokenOut.isNative ? ZERO_ADDRESS : tokenOut.address;

  const { currency0, currency1, zeroForOne } = sortCurrencies(addrIn, addrOut);

  const client = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  let lastError: unknown;

  for (const { fee, tickSpacing } of POOL_CONFIGS) {
    try {
      const result = await client.simulateContract({
        address: QUOTER_V4_ADDRESS,
        abi: QUOTER_V4_ABI,
        functionName: "quoteExactInputSingle",
        args: [
          {
            poolKey: {
              currency0: currency0 as Address,
              currency1: currency1 as Address,
              fee,
              tickSpacing,
              hooks: ZERO_ADDRESS,
            },
            zeroForOne,
            exactAmount: BigInt(amountIn) as unknown as bigint,
            hookData: "0x",
          },
        ],
      });

      const [amountOut, gasEst] = result.result;

      const slippageMultiplier = BigInt(10000 - slippageBps);
      const amountOutMin = (amountOut * slippageMultiplier) / 10000n;

      // Rough gas cost: gasEstimate * ~2 gwei on Sepolia
      const gasCostWei = gasEst * 2_000_000_000n;
      const gasCostEth = Number(gasCostWei) / 1e18;

      // Price impact: rough estimate based on fee tier
      const priceImpact = fee / 100_000 + 0.05;

      return {
        amountOut: amountOut.toString(),
        amountOutMin: amountOutMin.toString(),
        priceImpact,
        gasEstimate: gasCostEth.toFixed(6),
        route: "SINGLE_HOP",
        poolFee: fee,
        tickSpacing,
        currency0,
        currency1,
        zeroForOne,
      };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  const errMsg =
    lastError instanceof Error ? lastError.message : "Unknown error";
  throw new Error(
    `No liquidity found for ${tokenIn.symbol}→${tokenOut.symbol} on Sepolia. ${errMsg.slice(0, 100)}`
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function formatAmount(
  raw: string,
  decimals: number,
  precision = 6
): string {
  if (!raw || raw === "0") return "0";
  const num = Number(BigInt(raw)) / Math.pow(10, decimals);
  if (num === 0) return "0";
  if (num < 0.000001) return "< 0.000001";
  if (num < 0.01) return num.toFixed(6).replace(/\.?0+$/, "");
  return num.toFixed(precision).replace(/\.?0+$/, "");
}

export function parseAmount(human: string, decimals: number): string {
  const num = parseFloat(human);
  if (isNaN(num) || num <= 0) return "0";
  // Avoid floating point precision issues
  const factor = Math.pow(10, decimals);
  return BigInt(Math.floor(num * factor)).toString();
}
