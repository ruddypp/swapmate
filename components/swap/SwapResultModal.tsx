"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { HookSentinelReport, QuoteResult, Token } from "@/lib/swap/types";
import { HookSentinelCard } from "./HookSentinelCard";

interface SwapResultModalProps {
  quote: QuoteResult | null;
  quoteLoading: boolean;
  quoteError: string | null;
  swapError: string | null;
  sentinelReport: HookSentinelReport | null;
  sentinelLoading: boolean;
  sentinelError: string | null;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  minReceived: string;
  isConnected: boolean;
  isBusy: boolean;
  isDone: boolean;
  isMobileOpen: boolean;
  txHash: string | null;
  stepLabel: string;
  actionLabel: string;
  executeDisabled: boolean;
  onExecute: () => void;
  onReset: () => void;
  onCloseMobile: () => void;
}

function StatusPill({
  quote,
  quoteLoading,
  sentinelReport,
  sentinelLoading,
}: {
  quote: QuoteResult | null;
  quoteLoading: boolean;
  sentinelReport: HookSentinelReport | null;
  sentinelLoading: boolean;
}) {
  if (quoteLoading || sentinelLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
        <Loader2 className="w-3 h-3 animate-spin" />
        Scanning
      </span>
    );
  }

  if (sentinelReport?.status === "blocked") {
    return (
      <span className="rounded-sm border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-red-300">
        Blocked
      </span>
    );
  }

  if (sentinelReport?.status === "caution") {
    return (
      <span className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-300">
        Review
      </span>
    );
  }

  if (quote) {
    return (
      <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300">
        Ready
      </span>
    );
  }

  return (
    <span className="rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      Awaiting Quote
    </span>
  );
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono text-right ${tone ?? "text-foreground/80"}`}>{value}</span>
    </div>
  );
}

function ResultContent(props: SwapResultModalProps & { showMobileClose?: boolean }) {
  const {
    quote,
    quoteLoading,
    quoteError,
    swapError,
    sentinelReport,
    sentinelLoading,
    sentinelError,
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    minReceived,
    isConnected,
    isBusy,
    isDone,
    txHash,
    stepLabel,
    actionLabel,
    executeDisabled,
    onExecute,
    onReset,
    onCloseMobile,
    showMobileClose,
  } = props;

  const hasError = quoteError || swapError;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="shrink-0 flex items-start justify-between gap-4 border-b border-border px-4 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Trade Result
            </p>
            <StatusPill
              quote={quote}
              quoteLoading={quoteLoading}
              sentinelReport={sentinelReport}
              sentinelLoading={sentinelLoading}
            />
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Quote Review</h2>
        </div>

        {showMobileClose && (
          <button
            onClick={onCloseMobile}
            className="rounded-sm border border-white/10 bg-white/[0.03] p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close result"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!quote && !quoteLoading && !hasError ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">No quote yet</p>
              <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
                Enter an amount and get a quote. SwapMate will place the v4 result and AI guardrails here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {quoteLoading ? (
              <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-xl border border-primary/15 bg-primary/5" />
                <div className="h-32 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
              </div>
            ) : quote ? (
              <>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Estimated Output
                  </p>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                        {amountOut || "0"} <span className="text-base text-muted-foreground">{tokenOut.symbol}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{amountIn || "0"} {tokenIn.symbol}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{tokenOut.symbol}</span>
                      </div>
                    </div>
                    <span className="rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Sepolia
                    </span>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <DetailRow
                    label="Route"
                    value={`${quote.route}${quote.poolFee ? ` · ${(quote.poolFee / 10000).toFixed(2)}% fee` : ""}`}
                  />
                  <DetailRow
                    label="Price Impact"
                    value={`~${quote.priceImpact.toFixed(2)}%`}
                    tone={quote.priceImpact > 1 ? "text-destructive" : "text-foreground/80"}
                  />
                  <DetailRow label="Est. Gas" value={`${quote.gasEstimate} ETH`} />
                  <DetailRow label="Min. Received" value={`${minReceived} ${tokenOut.symbol}`} />
                </div>

                <HookSentinelCard
                  report={sentinelReport}
                  isLoading={sentinelLoading}
                  error={sentinelError}
                />
              </>
            ) : null}

            <AnimatePresence>
              {hasError && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                  <p className="text-xs font-mono leading-relaxed text-destructive">
                    {quoteError || swapError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isBusy && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <p className="text-xs font-mono tracking-wide text-muted-foreground">
                    {stepLabel}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isDone && txHash && (
                <motion.a
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-300 transition-colors hover:border-emerald-500/40"
                >
                  <span>Confirmed on Sepolia</span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    {txHash.slice(0, 10)}...{txHash.slice(-6)}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </motion.a>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="space-y-2">
          {isDone ? (
            <Button
              id="swap-again-btn"
              onClick={onReset}
              className="h-11 w-full rounded-sm bg-secondary text-[11px] font-medium uppercase tracking-widest text-secondary-foreground hover:bg-secondary/80"
              variant="secondary"
            >
              Swap Again
            </Button>
          ) : (
            <Button
              id="execute-swap-btn"
              onClick={onExecute}
              disabled={!quote || quoteLoading || !isConnected || executeDisabled}
              className="h-11 w-full rounded-sm bg-primary text-[11px] font-medium uppercase tracking-widest text-primary-foreground transition-all duration-200 hover:bg-primary/90"
            >
              {quote ? actionLabel : "Get Quote First"}
            </Button>
          )}

          {quote && !isBusy && (
            <>
              <Separator className="opacity-50" />
              <button
                onClick={onReset}
                className="w-full py-1 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
              >
                Reset Quote
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SwapResultModal(props: SwapResultModalProps) {
  const shouldShowMobile =
    props.isMobileOpen &&
    (props.quoteLoading || Boolean(props.quote) || Boolean(props.quoteError) || Boolean(props.swapError));

  return (
    <>
      <aside className="hidden h-full min-h-0 min-w-0 lg:block">
        <div className="h-full min-h-0">
          <ResultContent {...props} />
        </div>
      </aside>

      <AnimatePresence>
        {shouldShowMobile && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end bg-black/70 px-3 pb-3 pt-16 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 36, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 28, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="h-[min(760px,calc(100vh-5rem))] w-full"
            >
              <ResultContent {...props} showMobileClose />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
