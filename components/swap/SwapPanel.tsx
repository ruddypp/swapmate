"use client";

import { useState, useCallback, useEffect } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { type Address } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Token, QuoteResult, ParsedSwapIntent, SwapRecord, BatchSwapIntent, BatchSwapItem, HookSentinelReport } from "@/lib/swap/types";
import { SEPOLIA_TOKENS, NATIVE_ETH, USDC_SEPOLIA } from "@/lib/swap/tokens";
import { formatAmount, parseAmount } from "@/lib/swap/quote";
import { ensureApprovals, buildSwapCalldata, executeSwapTx } from "@/lib/swap/execute";
import { buildHookSentinelReport } from "@/lib/swap/sentinel";
import { BatchSwapCard } from "./BatchSwapCard";
import { RiskBanner } from "./RiskBanner";
import { SwapResultModal } from "./SwapResultModal";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SwapPanelProps {
  prefillIntent?: ParsedSwapIntent;
  batchIntent?: BatchSwapIntent;
  onClearIntent?: () => void;
  onClearBatch?: () => void;
  onSwapComplete?: (record: SwapRecord) => void;
  onQuoteUpdate?: (context: {
    tokenIn?: Token;
    tokenOut?: Token;
    amountIn?: string;
    quote?: QuoteResult | null;
  }) => void;
}

type SwapStep = "idle" | "approving_erc20" | "approving_permit2" | "swapping" | "confirming" | "done";

const SLIPPAGE_OPTIONS = [
  { label: "0.1%", value: 10 },
  { label: "0.5%", value: 50 },
  { label: "1.0%", value: 100 },
];

// ─── TOKEN SELECTOR ───────────────────────────────────────────────────────────

function TokenSelector({
  value, onChange, exclude, label, id,
}: {
  value: Token; onChange: (t: Token) => void; exclude?: Token; label: string; id: string;
}) {
  const options = SEPOLIA_TOKENS.filter((t) => t.address !== exclude?.address);
  return (
    <div className="space-y-1">
      <p className="text-label">{label}</p>
      <Select
        value={value.address}
        onValueChange={(addr) => {
          const t = SEPOLIA_TOKENS.find((t) => t.address === addr);
          if (t) onChange(t);
        }}
      >
        <SelectTrigger
          id={id}
          className="rounded-sm border-border bg-muted/30 hover:bg-muted/50 transition-colors font-mono text-sm h-10"
        >
          <div className="flex gap-2 items-center">
            <span className="font-medium">{value.symbol}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-sm border-border bg-popover">
          {options.map((t) => (
            <SelectItem key={t.address} value={t.address} className="font-mono text-sm cursor-pointer">
              <span className="font-medium">{t.symbol}</span>
              <span className="text-muted-foreground ml-2 text-xs">{t.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────

const STEP_LABELS: Record<SwapStep, string> = {
  idle: "",
  approving_erc20: "Approving token to Permit2...",
  approving_permit2: "Approving Permit2 to Router...",
  swapping: "Sending swap to blockchain...",
  confirming: "Waiting for confirmation...",
  done: "Swap confirmed",
};

// ─── SWAP PANEL ───────────────────────────────────────────────────────────────

export function SwapPanel({ onSwapComplete, onQuoteUpdate, prefillIntent, onClearIntent, batchIntent, onClearBatch }: SwapPanelProps) {
  const { address, isConnected } = useAppKitAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [tokenIn, setTokenIn] = useState<Token>(NATIVE_ETH);
  const [tokenOut, setTokenOut] = useState<Token>(USDC_SEPOLIA);
  const [amountIn, setAmountIn] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [sentinelReport, setSentinelReport] = useState<HookSentinelReport | null>(null);
  const [sentinelLoading, setSentinelLoading] = useState(false);
  const [sentinelError, setSentinelError] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const [autoExecute, setAutoExecute] = useState(false);
  const [pendingQuoteFetch, setPendingQuoteFetch] = useState(false);

  const [swapStep, setSwapStep] = useState<SwapStep>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  // AI overrides
  const [aiRiskNote, setAiRiskNote] = useState<string | null>(null);
  const [aiTunedSlippage, setAiTunedSlippage] = useState(false);

  // Batch swap state
  const [batchItems, setBatchItems] = useState<BatchSwapItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const isBatchMode = batchItems.length > 0;

  // Apply prefill intent from AI
  const applyIntent = useCallback((intent: ParsedSwapIntent) => {
    if (intent.tokenIn) {
      const t = SEPOLIA_TOKENS.find(
        (tok) => tok.symbol.toLowerCase() === intent.tokenIn!.toLowerCase()
      );
      if (t) setTokenIn(t);
    }
    if (intent.tokenOut) {
      const t = SEPOLIA_TOKENS.find(
        (tok) => tok.symbol.toLowerCase() === intent.tokenOut!.toLowerCase()
      );
      if (t) setTokenOut(t);
    }
    if (intent.amount) setAmountIn(intent.amount);

    // AI slippage override (slippageBps takes priority over old slippage field)
    if (intent.slippageBps) {
      setSlippageBps(intent.slippageBps);
      setAiTunedSlippage(true);
    } else if (intent.slippage) {
      setSlippageBps(Math.round(intent.slippage * 100));
    }

    // AI risk note
    if (intent.riskNote) setAiRiskNote(intent.riskNote);

    if (intent.action === "execute") {
      setAutoExecute(true);
      setPendingQuoteFetch(true);
    } else if (intent.action === "quote" || intent.amount) {
      setAutoExecute(false);
      setPendingQuoteFetch(true);
    }
  }, []);

  useEffect(() => {
    if (!prefillIntent) return;

    const id = window.setTimeout(() => {
      applyIntent(prefillIntent);
      onClearIntent?.();
    }, 0);

    return () => window.clearTimeout(id);
  }, [prefillIntent, applyIntent, onClearIntent]);

  // Effect to auto-fetch quote when intent parameters are settled
  useEffect(() => {
    if (!(pendingQuoteFetch && amountIn && parseFloat(amountIn) > 0)) return;

    const id = window.setTimeout(() => {
      setPendingQuoteFetch(false);
      fetchQuote();
    }, 0);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuoteFetch, amountIn, tokenIn, tokenOut, slippageBps]);

  // Effect to auto-execute when quote is ready
  useEffect(() => {
    if (!(quote && autoExecute && sentinelReport && !sentinelLoading && swapStep === "idle" && isConnected)) return;

    const id = window.setTimeout(() => {
      setAutoExecute(false);
      executeSwap();
    }, 0);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, autoExecute, sentinelReport, sentinelLoading, swapStep, isConnected]);

  // Apply batch intent from AI
  useEffect(() => {
    if (!(batchIntent && batchIntent.swaps.length > 0)) return;

    const id = window.setTimeout(() => {
      setBatchItems(batchIntent.swaps);
      setAiRiskNote(null);
      onClearBatch?.();
    }, 0);

    return () => window.clearTimeout(id);
  }, [batchIntent, onClearBatch]);

  function swapTokens() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    clearQuoteState();
    setAmountIn("");
  }

  function clearQuoteState() {
    setQuote(null);
    setQuoteError(null);
    setSentinelReport(null);
    setSentinelError(null);
    setSentinelLoading(false);
    setResultOpen(false);
  }

  async function fetchSentinel(result: QuoteResult) {
    const fallback = buildHookSentinelReport({
      tokenIn,
      tokenOut,
      amountInHuman: amountIn,
      slippageBps,
      quote: result,
    });

    setSentinelLoading(true);
    setSentinelError(null);
    setSentinelReport(null);

    try {
      const res = await fetch("/api/swap/sentinel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenIn,
          tokenOut,
          amountInHuman: amountIn,
          slippageBps,
          quote: result,
        }),
      });

      if (!res.ok) throw new Error("AI Sentinel fallback active");
      const report: HookSentinelReport = await res.json();
      setSentinelReport(report);
    } catch {
      setSentinelReport(fallback);
    } finally {
      setSentinelLoading(false);
    }
  }

  // ─── FETCH QUOTE ────────────────────────────────────────────────────────────

  async function fetchQuote() {
    if (!amountIn || parseFloat(amountIn) <= 0) return;
    setResultOpen(true);
    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);
    setSentinelReport(null);
    setSentinelError(null);

    try {
      const rawAmount = parseAmount(amountIn, tokenIn.decimals);
      const res = await fetch("/api/swap/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenIn, tokenOut, amountIn: rawAmount, slippageBps }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Quote failed");
      }

      const result: QuoteResult = await res.json();
      setQuote(result);
      onQuoteUpdate?.({ tokenIn, tokenOut, amountIn, quote: result });
      void fetchSentinel(result);
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setQuoteLoading(false);
    }
  }

  // ─── EXECUTE SWAP ───────────────────────────────────────────────────────────

  async function executeSwap() {
    if (!quote || !address || !walletClient || !publicClient) return;
    setSwapError(null);

    if (sentinelLoading || !sentinelReport) {
      setSwapError("AI Hook Sentinel is still scanning this route.");
      return;
    }

    if (sentinelReport.status === "blocked") {
      const reason = sentinelReport.blockers[0] ?? "guardrail breach";
      setSwapError(`AI Hook Sentinel blocked this trade: ${reason}`);
      return;
    }

    const rawIn = BigInt(parseAmount(amountIn, tokenIn.decimals));

    try {
      // Step 1: ERC20 approvals (skip for native ETH)
      if (!tokenIn.isNative) {
        setSwapStep("approving_erc20");
        // ensureApprovals handles both ERC20→Permit2 and Permit2→Router
        await ensureApprovals(
          tokenIn,
          rawIn,
          address as Address,
          publicClient,
          walletClient
        );
      }

      // Step 2: Build calldata
      setSwapStep("swapping");
      const calldata = buildSwapCalldata(tokenIn, tokenOut, rawIn, quote);

      // Step 3: Execute
      const hash = await executeSwapTx(
        calldata,
        address as Address,
        walletClient,
        publicClient
      );

      setTxHash(hash);
      setSwapStep("confirming");

      // Step 4: Wait for receipt
      await publicClient.waitForTransactionReceipt({ hash });
      setSwapStep("done");

      // Save to history
      const record: SwapRecord = {
        id: hash,
        timestamp: Date.now(),
        tokenIn,
        tokenOut,
        amountIn,
        amountOut: formatAmount(quote.amountOut, tokenOut.decimals),
        txHash: hash,
        status: "confirmed",
        chainId: 11155111,
      };

      try {
        const prev = JSON.parse(localStorage.getItem("swapmate_history") ?? "[]");
        localStorage.setItem(
          "swapmate_history",
          JSON.stringify([record, ...prev].slice(0, 20))
        );
      } catch {}

      onSwapComplete?.(record);
    } catch (err: unknown) {
      setSwapStep("idle");
      const msg = err instanceof Error ? err.message : "Swap failed";
      if (msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("user refused")) {
        setSwapError("Transaction rejected by wallet.");
      } else {
        setSwapError(msg.slice(0, 140));
      }
    }
  }

  // ─── BATCH EXECUTION LOOP ──────────────────────────────────────────────────

  async function executeBatch() {
    if (!address || !walletClient || !publicClient) return;
    setBatchRunning(true);

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (item.status === "done") continue;

      const tokenIn = SEPOLIA_TOKENS.find(t => t.symbol.toLowerCase() === item.tokenIn?.toLowerCase());
      const tokenOut = SEPOLIA_TOKENS.find(t => t.symbol.toLowerCase() === item.tokenOut?.toLowerCase());
      if (!tokenIn || !tokenOut || !item.amount) continue;

      // Step 1: Get quote
      setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: "quoting" } : it));
      try {
        const rawAmount = parseAmount(item.amount, tokenIn.decimals);
        const slipBps = item.slippageBps ?? 50;
        const qRes = await fetch("/api/swap/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenIn, tokenOut, amountIn: rawAmount, slippageBps: slipBps }),
        });
        if (!qRes.ok) throw new Error("Quote failed");
        const quote: QuoteResult = await qRes.json();
        const sentinel = buildHookSentinelReport({
          tokenIn,
          tokenOut,
          amountInHuman: item.amount,
          slippageBps: slipBps,
          quote,
        });

        if (sentinel.status === "blocked") {
          throw new Error(`Sentinel blocked: ${sentinel.blockers[0] ?? "guardrail breach"}`);
        }

        // Step 2: Execute swap
        setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: "swapping", quote } : it));

        const rawIn = BigInt(rawAmount);
        if (!tokenIn.isNative) {
          await ensureApprovals(tokenIn, rawIn, address as `0x${string}`, publicClient, walletClient);
        }
        const calldata = buildSwapCalldata(tokenIn, tokenOut, rawIn, quote);
        const hash = await executeSwapTx(calldata, address as `0x${string}`, walletClient, publicClient);
        await publicClient.waitForTransactionReceipt({ hash });
        setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: "done", txHash: hash } : it));

        // Save to history
        const record: SwapRecord = {
          id: hash, timestamp: Date.now(), tokenIn, tokenOut,
          amountIn: item.amount, amountOut: formatAmount(quote.amountOut, tokenOut.decimals),
          txHash: hash, status: "confirmed", chainId: 11155111,
        };
        try {
          const prev = JSON.parse(localStorage.getItem("swapmate_history") ?? "[]");
          localStorage.setItem("swapmate_history", JSON.stringify([record, ...prev].slice(0, 20)));
        } catch {}
        onSwapComplete?.(record);

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed";
        setBatchItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: "error", errorMsg: msg.slice(0, 60) } : it));
      }
    }
    setBatchRunning(false);
  }

  const amountOut = quote ? formatAmount(quote.amountOut, tokenOut.decimals) : "";
  const minReceived = quote ? formatAmount(quote.amountOutMin, tokenOut.decimals) : "";
  const isBusy = swapStep !== "idle" && swapStep !== "done";
  const sentinelBlocked = sentinelReport?.status === "blocked";
  const executeDisabled = isBusy || sentinelLoading || sentinelBlocked;
  const actionLabel = sentinelLoading
    ? "AI Sentinel scanning..."
    : sentinelBlocked
    ? "Blocked by AI Sentinel"
    : isBusy
    ? STEP_LABELS[swapStep].replace("...", "")
    : `Swap ${tokenIn.symbol} → ${tokenOut.symbol}`;

  function reset() {
    setQuote(null);
    setSwapStep("idle");
    setTxHash(null);
    setSwapError(null);
    setAmountIn("");
    setAiRiskNote(null);
    setAiTunedSlippage(false);
    setSentinelReport(null);
    setSentinelError(null);
    setSentinelLoading(false);
    setResultOpen(false);
  }

  function resetBatch() {
    setBatchItems([]);
    setBatchRunning(false);
  }

  return (
    <div className="h-full min-h-0 space-y-4">

      {/* ── BATCH MODE UI ── */}
      {isBatchMode && (
        <div className="h-full overflow-y-auto custom-scrollbar space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
              Batch Plan — {batchItems.length} swaps
            </p>
            {!batchRunning && (
              <button onClick={resetBatch} className="text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2">
            {batchItems.map((item, idx) => (
              <BatchSwapCard key={item.id} item={item} index={idx} />
            ))}
          </div>

          {/* Batch Execute / Done */}
          {batchItems.every(it => it.status === "done") ? (
            <button onClick={resetBatch} className="w-full text-[10px] text-emerald-400 hover:text-emerald-300 tracking-widest uppercase transition-colors py-2 border border-emerald-500/20 rounded-xl">
              All Done — New Swap
            </button>
          ) : (
            <Button
              id="batch-execute-btn"
              onClick={executeBatch}
              disabled={batchRunning || !isConnected}
              className="w-full rounded-sm uppercase tracking-widest text-[11px] font-medium h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {batchRunning ? "Executing..." : `Execute All (${batchItems.filter(it => it.status !== "done").length} remaining)`}
            </Button>
          )}
        </div>
      )}

      {/* ── SINGLE SWAP MODE UI ── */}
      {!isBatchMode && (
        <div className="grid h-full min-h-0 w-full items-start gap-4 lg:grid-cols-[minmax(300px,390px)_minmax(360px,1fr)] xl:gap-6">
          <div className="custom-scrollbar h-full min-h-0 min-w-0 overflow-y-auto space-y-4 rounded-2xl border border-white/10 bg-card/35 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            {aiRiskNote && (
              <RiskBanner message={aiRiskNote} severity="warning" />
            )}

            <div className="space-y-2">
              <TokenSelector
                id="token-in-select"
                label="You Pay"
                value={tokenIn}
                onChange={(t) => { setTokenIn(t); clearQuoteState(); }}
                exclude={tokenOut}
              />
              <Input
                id="amount-in-input"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => { setAmountIn(e.target.value); clearQuoteState(); }}
                className="h-12 rounded-sm border-border bg-muted/30 font-mono text-lg transition-colors hover:bg-muted/50 focus:border-primary/40"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <button
                id="swap-direction-btn"
                onClick={swapTokens}
                className="px-2 text-xs font-mono tracking-widest text-muted-foreground transition-colors duration-150 hover:text-foreground"
                title="Swap direction"
              >
                ↕
              </button>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              <TokenSelector
                id="token-out-select"
                label="You Receive"
                value={tokenOut}
                onChange={(t) => { setTokenOut(t); clearQuoteState(); }}
                exclude={tokenIn}
              />
              <div className="flex h-12 items-center rounded-sm border border-border bg-muted/20 px-3 font-mono text-lg text-muted-foreground">
                {quoteLoading ? (
                  <span className="text-sm animate-pulse">Fetching quote...</span>
                ) : (
                  <span className={amountOut ? "text-foreground" : ""}>
                    {amountOut || "0.00"}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-label">Slippage Tolerance</p>
                {aiTunedSlippage && (
                  <span className="text-[9px] font-mono tracking-wider text-primary animate-pulse">AI TUNED</span>
                )}
              </div>
              <div className="flex gap-2">
                {SLIPPAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    id={`slippage-${opt.value}`}
                    onClick={() => setSlippageBps(opt.value)}
                    className={`flex-1 rounded-sm border py-1.5 text-xs font-mono transition-all duration-150 ${
                      slippageBps === opt.value
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {!quote ? (
                <Button
                  id="get-quote-btn"
                  onClick={fetchQuote}
                  disabled={!amountIn || parseFloat(amountIn) <= 0 || quoteLoading}
                  variant="secondary"
                  className="h-11 w-full rounded-sm bg-secondary text-[11px] font-medium uppercase tracking-widest text-secondary-foreground transition-all duration-200 hover:bg-secondary/80"
                >
                  {quoteLoading ? "Fetching Quote..." : "Get Quote"}
                </Button>
              ) : (
                <>
                  <Button
                    id="refresh-quote-btn"
                    onClick={fetchQuote}
                    disabled={quoteLoading || isBusy}
                    variant="secondary"
                    className="h-11 w-full rounded-sm bg-secondary text-[11px] font-medium uppercase tracking-widest text-secondary-foreground transition-all duration-200 hover:bg-secondary/80"
                  >
                    {quoteLoading ? "Refreshing..." : "Refresh Quote"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setResultOpen(true)}
                    className="h-11 w-full rounded-sm bg-primary text-[11px] font-medium uppercase tracking-widest text-primary-foreground transition-all duration-200 hover:bg-primary/90 lg:hidden"
                  >
                    Open Result
                  </Button>
                </>
              )}
            </div>
          </div>

          <SwapResultModal
            quote={quote}
            quoteLoading={quoteLoading}
            quoteError={quoteError}
            swapError={swapError}
            sentinelReport={sentinelReport}
            sentinelLoading={sentinelLoading}
            sentinelError={sentinelError}
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            amountIn={amountIn}
            amountOut={amountOut}
            minReceived={minReceived}
            isConnected={isConnected}
            isBusy={isBusy}
            isDone={swapStep === "done"}
            isMobileOpen={resultOpen}
            txHash={txHash}
            stepLabel={STEP_LABELS[swapStep]}
            actionLabel={actionLabel}
            executeDisabled={executeDisabled}
            onExecute={executeSwap}
            onReset={reset}
            onCloseMobile={() => setResultOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
