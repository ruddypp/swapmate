/**
 * Real swap execution using Uniswap v4 Universal Router
 * Flow:
 *  1. ERC20: check+approve Permit2 allowance
 *  2. Build V4Planner actions (SWAP_EXACT_IN_SINGLE + SETTLE_ALL + TAKE_ALL)
 *  3. Build RoutePlanner with V4_SWAP command
 *  4. Call UniversalRouter.execute(commands, inputs, deadline)
 */

import { type Address, type WalletClient, type PublicClient, maxUint256 } from "viem";
import { V4Planner, Actions } from "@uniswap/v4-sdk";
import { RoutePlanner, CommandType } from "@uniswap/universal-router-sdk";
import { UNIVERSAL_ROUTER_ADDRESS, PERMIT2_ADDRESS } from "./tokens";
import type { Token, QuoteResult } from "./types";

// ─── ABIs ─────────────────────────────────────────────────────────────────────

const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const PERMIT2_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
    ],
    outputs: [],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
  },
] as const;

const UNIVERSAL_ROUTER_ABI = [
  {
    name: "execute",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// ─── ZERO ADDRESS ─────────────────────────────────────────────────────────────

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// ─── STEP 1: ENSURE ERC20 APPROVALS ───────────────────────────────────────────

export async function ensureApprovals(
  tokenIn: Token,
  rawAmountIn: bigint,
  userAddress: Address,
  publicClient: PublicClient,
  walletClient: WalletClient
): Promise<void> {
  if (tokenIn.isNative) return; // ETH needs no approval

  const tokenAddr = tokenIn.address as Address;

  // 1a. Check ERC20 → Permit2 allowance
  const erc20Allowance = await publicClient.readContract({
    address: tokenAddr,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [userAddress, PERMIT2_ADDRESS],
  });

  if (erc20Allowance < rawAmountIn) {
    const hash = await walletClient.writeContract({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [PERMIT2_ADDRESS, maxUint256],
      account: userAddress,
      chain: null,
    });
    await publicClient.waitForTransactionReceipt({ hash });
  }

  // 1b. Check Permit2 → Universal Router allowance
  const [permit2Amount] = await publicClient.readContract({
    address: PERMIT2_ADDRESS,
    abi: PERMIT2_ABI,
    functionName: "allowance",
    args: [userAddress, tokenAddr, UNIVERSAL_ROUTER_ADDRESS],
  });

  if (permit2Amount < rawAmountIn) {
    // 30-day expiration as a number (uint48)
    const expiration = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    const hash = await walletClient.writeContract({
      address: PERMIT2_ADDRESS,
      abi: PERMIT2_ABI,
      functionName: "approve",
      args: [
        tokenAddr,
        UNIVERSAL_ROUTER_ADDRESS,
        // uint160 max
        BigInt("0xffffffffffffffffffffffffffffffffffffffffffff"),
        // uint48 expiration (plain number)
        expiration,
      ],
      account: userAddress,
      chain: null,
    });
    await publicClient.waitForTransactionReceipt({ hash });
  }
}

// ─── STEP 2: BUILD CALLDATA ────────────────────────────────────────────────────

export function buildSwapCalldata(
  tokenIn: Token,
  tokenOut: Token,
  rawAmountIn: bigint,
  quote: QuoteResult
): { commands: `0x${string}`; inputs: `0x${string}`[]; value: bigint } {
  const {
    currency0 = tokenIn.isNative ? ZERO_ADDRESS : tokenIn.address,
    currency1 = tokenOut.isNative ? ZERO_ADDRESS : tokenOut.address,
    zeroForOne = true,
    poolFee = 3000,
    tickSpacing = 60,
    hookAddress = ZERO_ADDRESS,
    amountOutMin,
  } = quote;

  const v4Planner = new V4Planner();
  const routePlanner = new RoutePlanner();

  // SWAP_EXACT_IN_SINGLE
  v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [
    {
      poolKey: {
        currency0,
        currency1,
        fee: poolFee,
        tickSpacing,
        hooks: hookAddress,
      },
      zeroForOne,
      amountIn: rawAmountIn.toString(),
      amountOutMinimum: amountOutMin,
      hookData: "0x",
    },
  ]);

  // SETTLE_ALL: pay input currency from router balance (ETH sent as msg.value, or already transferred by Permit2)
  v4Planner.addAction(Actions.SETTLE_ALL, [
    tokenIn.isNative ? ZERO_ADDRESS : tokenIn.address,
    rawAmountIn.toString(),
  ]);

  // TAKE_ALL: collect output to caller
  v4Planner.addAction(Actions.TAKE_ALL, [
    tokenOut.isNative ? ZERO_ADDRESS : tokenOut.address,
    amountOutMin,
  ]);

  const encodedV4Actions = v4Planner.finalize();
  routePlanner.addCommand(CommandType.V4_SWAP, [
    v4Planner.actions,
    v4Planner.params,
  ]);

  return {
    commands: routePlanner.commands as `0x${string}`,
    inputs: [encodedV4Actions as `0x${string}`],
    value: tokenIn.isNative ? rawAmountIn : 0n,
  };
}

// ─── STEP 3: EXECUTE ──────────────────────────────────────────────────────────

export async function executeSwapTx(
  calldata: ReturnType<typeof buildSwapCalldata>,
  userAddress: Address,
  walletClient: WalletClient,
  publicClient: PublicClient
): Promise<`0x${string}`> {
  void publicClient;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 min

  const hash = await walletClient.writeContract({
    address: UNIVERSAL_ROUTER_ADDRESS,
    abi: UNIVERSAL_ROUTER_ABI,
    functionName: "execute",
    args: [calldata.commands, calldata.inputs, deadline],
    value: calldata.value,
    account: userAddress,
    chain: null,
  });

  return hash;
}
