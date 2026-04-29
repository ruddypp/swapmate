"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicClient, useWalletClient } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { type Address } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Token, QuoteResult, ParsedSwapIntent, SwapRecord } from "@/lib/swap/types";
import { SEPOLIA_TOKENS, NATIVE_ETH, USDC_SEPOLIA } from "@/lib/swap/tokens";
import { formatAmount, parseAmount } from "@/lib/swap/quote";
import { ensureApprovals, buildSwapCalldata, executeSwapTx } from "@/lib/swap/execute";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SwapPanelProps {
  prefillIntent?: ParsedSwapIntent;
  onClearIntent?: () => void;
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

export function SwapPanel({ onSwapComplete, onQuoteUpdate, prefillIntent, onClearIntent }: SwapPanelProps) {
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

  const [autoExecute, setAutoExecute] = useState(false);
  const [pendingQuoteFetch, setPendingQuoteFetch] = useState(false);

  const [swapStep, setSwapStep] = useState<SwapStep>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

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
    if (intent.slippage) setSlippageBps(Math.round(intent.slippage * 100));

    if (intent.action === "execute") {
      setAutoExecute(true);
      setPendingQuoteFetch(true);
    } else if (intent.action === "quote" || intent.amount) {
      setAutoExecute(false);
      setPendingQuoteFetch(true);
    }
  }, []);

  useEffect(() => {
    if (prefillIntent) {
      applyIntent(prefillIntent);
      onClearIntent?.();
    }
  }, [prefillIntent, applyIntent, onClearIntent]);

  // Effect to auto-fetch quote when intent parameters are settled
  useEffect(() => {
    if (pendingQuoteFetch && amountIn && parseFloat(amountIn) > 0) {
      setPendingQuoteFetch(false);
      fetchQuote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuoteFetch, amountIn, tokenIn, tokenOut, slippageBps]);

  // Effect to auto-execute when quote is ready
  useEffect(() => {
    if (quote && autoExecute && swapStep === "idle" && isConnected) {
      setAutoExecute(false);
      executeSwap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, autoExecute, swapStep, isConnected]);

  function swapTokens() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setQuote(null);
    setAmountIn("");
    setQuoteError(null);
  }

  // ─── FETCH QUOTE ────────────────────────────────────────────────────────────

  async function fetchQuote() {
    if (!amountIn || parseFloat(amountIn) <= 0) return;
    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);

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

  const amountOut = quote ? formatAmount(quote.amountOut, tokenOut.decimals) : "";
  const isBusy = swapStep !== "idle" && swapStep !== "done";

  function reset() {
    setQuote(null);
    setSwapStep("idle");
    setTxHash(null);
    setSwapError(null);
    setAmountIn("");
  }

  return (
    <div className="space-y-6">
      {/* Token In */}
      <div className="space-y-2">
        <TokenSelector
          id="token-in-select"
          label="You Pay"
          value={tokenIn}
          onChange={(t) => { setTokenIn(t); setQuote(null); setQuoteError(null); }}
          exclude={tokenOut}
        />
        <Input
          id="amount-in-input"
          type="number"
          min="0"
          step="any"
          placeholder="0.00"
          value={amountIn}
          onChange={(e) => { setAmountIn(e.target.value); setQuote(null); setQuoteError(null); }}
          className="text-lg font-mono rounded-sm border-border bg-muted/30 hover:bg-muted/50 focus:border-primary/40 transition-colors h-12"
        />
      </div>

      {/* Direction toggle */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <button
          id="swap-direction-btn"
          onClick={swapTokens}
          className="text-muted-foreground hover:text-foreground text-xs font-mono tracking-widest transition-colors duration-150 px-2"
          title="Swap direction"
        >
          ↕
        </button>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Token Out */}
      <div className="space-y-2">
        <TokenSelector
          id="token-out-select"
          label="You Receive"
          value={tokenOut}
          onChange={(t) => { setTokenOut(t); setQuote(null); setQuoteError(null); }}
          exclude={tokenIn}
        />
        <div className="h-12 px-3 flex items-center border border-border rounded-sm bg-muted/20 font-mono text-lg text-muted-foreground">
          {quoteLoading ? (
            <span className="text-sm animate-pulse">Fetching quote...</span>
          ) : (
            <span className={amountOut ? "text-foreground" : ""}>
              {amountOut || "0.00"}
            </span>
          )}
        </div>
      </div>

      {/* Slippage */}
      <div className="space-y-1.5">
        <p className="text-label">Slippage Tolerance</p>
        <div className="flex gap-2">
          {SLIPPAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`slippage-${opt.value}`}
              onClick={() => setSlippageBps(opt.value)}
              className={`flex-1 py-1.5 text-xs font-mono rounded-sm border transition-all duration-150 ${
                slippageBps === opt.value
                  ? "border-primary/60 text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quote details */}
      <AnimatePresence>
        {quote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            <Separator />
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Route</span>
                <span className="font-mono text-foreground/80">
                  {quote.route} · {quote.poolFee ? `${(quote.poolFee / 10000).toFixed(2)}% fee` : ""}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={`font-mono ${quote.priceImpact > 1 ? "text-destructive" : "text-foreground/80"}`}>
                  ~{quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Est. Gas</span>
                <span className="font-mono text-foreground/80">{quote.gasEstimate} ETH</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Min. Received</span>
                <span className="font-mono text-foreground/80">
                  {formatAmount(quote.amountOutMin, tokenOut.decimals)} {tokenOut.symbol}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      <AnimatePresence>
        {(quoteError || swapError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 border border-destructive/30 rounded-sm bg-destructive/5"
          >
            <p className="text-xs text-destructive font-mono leading-relaxed">
              {quoteError || swapError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      <AnimatePresence>
        {isBusy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-xs text-muted-foreground font-mono tracking-wide">
              {STEP_LABELS[swapStep]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TX confirmed link */}
      <AnimatePresence>
        {swapStep === "done" && txHash && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between text-xs border border-border/40 rounded-sm px-3 py-2"
          >
            <span className="text-muted-foreground">Confirmed</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:underline"
            >
              {txHash.slice(0, 10)}...{txHash.slice(-6)} ↗
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="space-y-2">
        {swapStep === "done" ? (
          <Button
            id="swap-again-btn"
            onClick={reset}
            className="w-full rounded-sm uppercase tracking-widest text-[11px] font-medium h-11 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            variant="secondary"
          >
            Swap Again
          </Button>
        ) : !quote ? (
          <Button
            id="get-quote-btn"
            onClick={fetchQuote}
            disabled={!amountIn || parseFloat(amountIn) <= 0 || quoteLoading}
            variant="secondary"
            className="w-full rounded-sm uppercase tracking-widest text-[11px] font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all duration-200 h-11"
          >
            {quoteLoading ? "Fetching Quote..." : "Get Quote"}
          </Button>
        ) : (
          <Button
            id="execute-swap-btn"
            onClick={executeSwap}
            disabled={!isConnected || isBusy}
            className="w-full rounded-sm uppercase tracking-widest text-[11px] font-medium h-11 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
          >
            {isBusy
              ? STEP_LABELS[swapStep].replace("...", "")
              : `Swap ${tokenIn.symbol} → ${tokenOut.symbol}`}
          </Button>
        )}

        {quote && swapStep === "idle" && (
          <button
            onClick={() => { setQuote(null); setQuoteError(null); }}
            className="w-full text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
