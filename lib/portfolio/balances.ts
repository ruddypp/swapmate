import type { PublicClient } from "viem";
import { erc20Abi } from "viem";
import { SEPOLIA_TOKENS, NATIVE_ETH } from "@/lib/swap/tokens";
import type { TokenBalance } from "./types";

const ETH_PRICE_USD_FALLBACK = 3000; // fallback if quote unavailable

export async function fetchWalletBalances(
  address: `0x${string}`,
  publicClient: PublicClient,
  ethPriceUsd: number = ETH_PRICE_USD_FALLBACK
): Promise<TokenBalance[]> {
  const results: TokenBalance[] = [];

  for (const token of SEPOLIA_TOKENS) {
    try {
      let raw: bigint;

      if (token.isNative) {
        raw = await publicClient.getBalance({ address });
      } else {
        raw = await publicClient.readContract({
          address: token.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });
      }

      const divisor = 10 ** token.decimals;
      const human = (Number(raw) / divisor).toFixed(token.decimals === 6 ? 2 : 4);

      // USD value — all tokens priced relative to ETH price
      // USDC is 1:1 USD. Others use ETH price as proxy (simplified for testnet)
      let usdValue = 0;
      if (token.symbol === "USDC") {
        usdValue = parseFloat(human);
      } else {
        // ETH, WETH, LINK, UNI — use ETH price as rough approximation
        usdValue = parseFloat(human) * ethPriceUsd;
      }

      results.push({
        token,
        raw,
        human,
        usdValue,
        percentage: 0, // calculated after all balances are known
      });
    } catch {
      // Token not available or error — push zero balance
      results.push({
        token,
        raw: 0n,
        human: "0.0000",
        usdValue: 0,
        percentage: 0,
      });
    }
  }

  // Calculate percentages
  const totalUsd = results.reduce((sum, b) => sum + b.usdValue, 0);
  if (totalUsd > 0) {
    for (const b of results) {
      b.percentage = (b.usdValue / totalUsd) * 100;
    }
  }

  return results.filter((b) => b.raw > 0n); // only non-zero balances
}
