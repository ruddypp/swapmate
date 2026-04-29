import type { Token } from "./types";

export const SEPOLIA_CHAIN_ID = 11155111;

export const NATIVE_ETH: Token = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "ETH",
  name: "Ether",
  decimals: 18,
  chainId: SEPOLIA_CHAIN_ID,
  isNative: true,
};

export const WETH_SEPOLIA: Token = {
  address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  symbol: "WETH",
  name: "Wrapped Ether",
  decimals: 18,
  chainId: SEPOLIA_CHAIN_ID,
};

export const USDC_SEPOLIA: Token = {
  address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  symbol: "USDC",
  name: "USD Coin",
  decimals: 6,
  chainId: SEPOLIA_CHAIN_ID,
};

export const UNI_SEPOLIA: Token = {
  address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  symbol: "UNI",
  name: "Uniswap",
  decimals: 18,
  chainId: SEPOLIA_CHAIN_ID,
};

export const LINK_SEPOLIA: Token = {
  address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  symbol: "LINK",
  name: "Chainlink",
  decimals: 18,
  chainId: SEPOLIA_CHAIN_ID,
};

export const SEPOLIA_TOKENS: Token[] = [
  NATIVE_ETH,
  WETH_SEPOLIA,
  USDC_SEPOLIA,
  UNI_SEPOLIA,
  LINK_SEPOLIA,
];

export function getTokenBySymbol(symbol: string): Token | undefined {
  return SEPOLIA_TOKENS.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

// ─── UNISWAP v4 CONTRACT ADDRESSES (SEPOLIA 11155111) ─────────────────────────
// Source: https://developers.uniswap.org/docs/protocols/v4/deployments

export const POOL_MANAGER_ADDRESS =
  "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543" as const;

// V4 Quoter (V4Quoter.sol) — used for quoteExactInputSingle
export const QUOTER_V4_ADDRESS =
  "0x61b3f2011a92d183c7dbadbda940a7555ccf9227" as const;

// Universal Router (v4-enabled)
export const UNIVERSAL_ROUTER_ADDRESS =
  "0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b" as const;

// Permit2 (same on all chains)
export const PERMIT2_ADDRESS =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
