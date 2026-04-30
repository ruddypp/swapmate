import type {
  HookSentinelReport,
  QuoteResult,
  SentinelCheck,
  SentinelCheckState,
  SentinelStatus,
  Token,
  TradeGuardrails,
} from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const VOLATILE_TESTNET_TOKENS = new Set(["UNI", "LINK"]);

export interface HookSentinelInput {
  tokenIn: Token;
  tokenOut: Token;
  amountInHuman: string;
  slippageBps: number;
  quote: QuoteResult;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatBps(bps: number) {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatPoolFee(fee: number) {
  return `${(fee / 10000).toFixed(2)}%`;
}

function stateFromRisk(value: number, warningAt: number, failAt: number): SentinelCheckState {
  if (value > failAt) return "fail";
  if (value >= warningAt) return "watch";
  return "pass";
}

function isZeroHook(address?: string) {
  return !address || address.toLowerCase() === ZERO_ADDRESS;
}

function createPolicy(input: HookSentinelInput): TradeGuardrails {
  const amount = Number.parseFloat(input.amountInHuman || "0");
  const touchesVolatileToken =
    VOLATILE_TESTNET_TOKENS.has(input.tokenIn.symbol) ||
    VOLATILE_TESTNET_TOKENS.has(input.tokenOut.symbol);

  return {
    maxPriceImpact: touchesVolatileToken || amount > 1 ? 1.5 : 1,
    maxSlippageBps: amount > 1 || touchesVolatileToken ? 150 : 100,
    blockCustomHooks: true,
  };
}

function deriveStatus(checks: SentinelCheck[]): SentinelStatus {
  if (checks.some((check) => check.state === "fail")) return "blocked";
  if (checks.some((check) => check.state === "watch")) return "caution";
  return "clear";
}

function titleForStatus(status: SentinelStatus) {
  if (status === "blocked") return "Trade blocked by guardrails";
  if (status === "caution") return "Proceed with attention";
  return "Safe to execute";
}

function summaryForStatus(status: SentinelStatus, hookLabel: string) {
  if (status === "blocked") {
    return "SwapMate detected a guardrail breach before execution. Review the flagged checks before sending this transaction.";
  }

  if (status === "caution") {
    return `SwapMate found a usable v4 route, but one condition deserves attention. Hook profile: ${hookLabel}.`;
  }

  return `SwapMate found a clean v4 route with guardrails intact. Hook profile: ${hookLabel}.`;
}

function recommendationsForStatus(status: SentinelStatus, checks: SentinelCheck[]) {
  if (status === "blocked") {
    return [
      "Lower the trade size or request a fresh quote before execution.",
      "Keep custom-hook blocking enabled unless you can verify the hook contract.",
      "Use a tighter route when liquidity improves.",
    ];
  }

  if (status === "caution") {
    return [
      "Review the watch items before approving the wallet transaction.",
      "Consider a smaller trade if price impact keeps rising.",
      "Refresh the quote if the market has moved.",
    ];
  }

  const hasStaticPool = checks.some((check) => check.label === "Hook" && check.state === "pass");
  return [
    hasStaticPool ? "No custom hook was detected on this v4 pool." : "Hook behavior is visible in the route metadata.",
    "Execution can continue under the current guardrails.",
  ];
}

export function buildHookSentinelReport(input: HookSentinelInput): HookSentinelReport {
  const policy = createPolicy(input);
  const hookAddress = input.quote.hookAddress ?? ZERO_ADDRESS;
  const hookLabel = isZeroHook(hookAddress)
    ? "No custom hook"
    : input.quote.hookLabel ?? "Unknown custom hook";
  const poolFee = input.quote.poolFee ?? 0;
  const priceImpactState = stateFromRisk(
    input.quote.priceImpact,
    policy.maxPriceImpact * 0.7,
    policy.maxPriceImpact
  );
  const slippageState = stateFromRisk(
    input.slippageBps,
    policy.maxSlippageBps * 0.75,
    policy.maxSlippageBps
  );
  const hookState: SentinelCheckState =
    !isZeroHook(hookAddress) && policy.blockCustomHooks ? "fail" : "pass";
  const feeState: SentinelCheckState = poolFee >= 10000 ? "watch" : "pass";

  const checks: SentinelCheck[] = [
    {
      label: "Hook",
      value: hookLabel,
      state: hookState,
      detail: isZeroHook(hookAddress)
        ? "This quote uses the standard v4 pool flow without a custom hook contract."
        : "Custom hook detected. SwapMate blocks unverified hook contracts by default.",
    },
    {
      label: "Price impact",
      value: formatPercent(input.quote.priceImpact),
      state: priceImpactState,
      detail: `Guardrail max is ${formatPercent(policy.maxPriceImpact)} for this token pair.`,
    },
    {
      label: "Slippage",
      value: formatBps(input.slippageBps),
      state: slippageState,
      detail: `Guardrail max is ${formatBps(policy.maxSlippageBps)}.`,
    },
    {
      label: "v4 pool fee",
      value: poolFee ? formatPoolFee(poolFee) : "Unknown",
      state: feeState,
      detail: poolFee >= 10000
        ? "The route uses the highest common fee tier, usually a sign of thinner or more volatile liquidity."
        : "The selected fee tier is within the normal operating range.",
    },
  ];

  const status = deriveStatus(checks);
  const blockers = checks
    .filter((check) => check.state === "fail")
    .map((check) => `${check.label}: ${check.value}`);

  return {
    status,
    title: titleForStatus(status),
    summary: summaryForStatus(status, hookLabel),
    hookAddress,
    hookLabel,
    confidence: status === "clear" ? 92 : status === "caution" ? 78 : 86,
    generatedBy: "rules",
    policy,
    checks,
    recommendations: recommendationsForStatus(status, checks),
    blockers,
  };
}
