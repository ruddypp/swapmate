"use client";

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicClient } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  AlertCircle,
  BarChart3,
  Brain,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioPieChart } from "./PortfolioPieChart";
import { TokenBalanceRow } from "./TokenBalanceRow";
import { InsightCard } from "./InsightCard";
import { StrategyMissions } from "./StrategyMissions";
import { fetchWalletBalances } from "@/lib/portfolio/balances";
import type {
  TokenBalance,
  PortfolioAnalysis,
  PortfolioContextSnapshot,
  Suggestion,
} from "@/lib/portfolio/types";
import type { ParsedSwapIntent } from "@/lib/swap/types";

interface PortfolioPanelProps {
  onSwapIntent: (intent: ParsedSwapIntent) => void;
  onPortfolioContextChange?: (context: PortfolioContextSnapshot) => void;
  onAskAssistant?: (prompt: string) => void;
}

function OverviewCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/35 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-[11px] font-mono text-muted-foreground/70">{detail}</p>
    </div>
  );
}

function riskTone(riskLevel?: PortfolioAnalysis["riskLevel"]) {
  if (riskLevel === "high") return "border-red-500/30 bg-red-500/5 text-red-200/80";
  if (riskLevel === "medium") return "border-amber-500/30 bg-amber-500/5 text-amber-200/80";
  return "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/80";
}

function riskLabel(riskLevel?: PortfolioAnalysis["riskLevel"]) {
  if (riskLevel === "high") return "High Risk";
  if (riskLevel === "medium") return "Medium Risk";
  if (riskLevel === "low") return "Low Risk";
  return "Analyzing";
}

function buildPortfolioContext(
  balances: TokenBalance[],
  analysis: PortfolioAnalysis | null,
  updatedAt: Date | null,
  status: PortfolioContextSnapshot["status"],
  error?: string
): PortfolioContextSnapshot {
  const totalUsd = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const stableShare = balances.find((b) => b.token.symbol === "USDC")?.percentage ?? 0;

  return {
    status,
    updatedAt: updatedAt?.toISOString(),
    totalUsd,
    stableShare,
    volatileShare: Math.max(0, 100 - stableShare),
    balances: balances.map((b) => ({
      symbol: b.token.symbol,
      name: b.token.name,
      human: b.human,
      percentage: b.percentage,
      usdValue: b.usdValue,
    })),
    analysis,
    error,
  };
}

function serializeBalancesForAI(balances: TokenBalance[]) {
  return balances.map((b) => ({
    token: {
      symbol: b.token.symbol,
      name: b.token.name,
    },
    human: b.human,
    percentage: b.percentage,
    usdValue: b.usdValue,
  }));
}

export function PortfolioPanel({ onSwapIntent, onPortfolioContextChange, onAskAssistant }: PortfolioPanelProps) {
  const { address, isConnected } = useAppKitAccount();
  const publicClient = usePublicClient();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadPortfolio = useCallback(async () => {
    if (!address || !publicClient) return;
    setLoading(true);
    setError(null);
    onPortfolioContextChange?.(buildPortfolioContext([], null, null, "loading"));

    try {
      const bals = await fetchWalletBalances(address as `0x${string}`, publicClient);
      const refreshedAt = new Date();
      setBalances(bals);
      setLastRefresh(refreshedAt);
      setAnalysis(null);
      setAdvisorError(null);
      onPortfolioContextChange?.(
        buildPortfolioContext(bals, null, refreshedAt, bals.length > 0 ? "ready" : "empty")
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load portfolio";
      setError(message);
      onPortfolioContextChange?.(buildPortfolioContext([], null, null, "error", message));
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, onPortfolioContextChange]);

  const analyzePortfolio = useCallback(async () => {
    if (!address || balances.length === 0) return;

    setAnalyzing(true);
    setAdvisorError(null);

    try {
      const res = await fetch("/api/portfolio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          balances: serializeBalancesForAI(balances),
          address,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to analyze portfolio");
      }

      const data: PortfolioAnalysis = await res.json();
      setAnalysis(data);
      onPortfolioContextChange?.(buildPortfolioContext(balances, data, lastRefresh, "ready"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze portfolio";
      setAdvisorError(message);
      onPortfolioContextChange?.(buildPortfolioContext(balances, null, lastRefresh, "ready", message));
    } finally {
      setAnalyzing(false);
    }
  }, [address, balances, lastRefresh, onPortfolioContextChange]);

  useEffect(() => {
    if (!(isConnected && address)) {
      const id = window.setTimeout(() => {
        onPortfolioContextChange?.(buildPortfolioContext([], null, null, "disconnected"));
      }, 0);

      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      loadPortfolio();
    }, 0);

    return () => window.clearTimeout(id);
  }, [isConnected, address, loadPortfolio, onPortfolioContextChange]);

  function handleSuggestion(suggestion: Suggestion) {
    onSwapIntent({
      tokenIn: suggestion.intent.tokenIn,
      tokenOut: suggestion.intent.tokenOut,
      amount: suggestion.intent.amount,
      action: suggestion.intent.action,
    });
  }

  const totalUsd = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const topHolding = balances.reduce<TokenBalance | null>(
    (top, item) => (!top || item.usdValue > top.usdValue ? item : top),
    null
  );
  const stableShare = balances.find((b) => b.token.symbol === "USDC")?.percentage ?? 0;
  const volatileShare = Math.max(0, 100 - stableShare);
  const formattedRefresh = useMemo(
    () => lastRefresh?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "Not loaded",
    [lastRefresh]
  );

  if (!isConnected) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-white/10 bg-card/35 px-8 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">Connect Your Wallet</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Portfolio analysis, allocation cards, and AI suggestions appear after wallet connection.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Reading wallet balances...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-center text-sm text-destructive">{error}</p>
        <Button variant="secondary" size="sm" onClick={loadPortfolio}>Retry</Button>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-card/35 px-8 py-8">
          <p className="text-sm text-muted-foreground">No token balances found on Sepolia testnet.</p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Get testnet ETH from a faucet to start trading.
          </p>
          <Button variant="secondary" size="sm" onClick={loadPortfolio} className="mt-4">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-5 py-5">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-background/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              AI Portfolio
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Wallet Command Center</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Updated {formattedRefresh} · Sepolia testnet values are estimates
            </p>
          </div>
          <button
            onClick={loadPortfolio}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <OverviewCard
            label="Total Value"
            value={`$${totalUsd.toFixed(2)}`}
            detail="Estimated testnet value"
            icon={<Wallet className="h-4 w-4" />}
          />
          <OverviewCard
            label="Top Asset"
            value={topHolding?.token.symbol ?? "-"}
            detail={topHolding ? `${topHolding.percentage.toFixed(1)}% allocation` : "No dominant asset"}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <OverviewCard
            label="Stable Share"
            value={`${stableShare.toFixed(1)}%`}
            detail={`${volatileShare.toFixed(1)}% volatile exposure`}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <OverviewCard
            label="AI Risk"
            value={analysis ? riskLabel(analysis.riskLevel) : "Ready"}
            detail={analyzing ? "Analysis running" : "Run advisor"}
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>

        <div className="grid min-h-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-card/30 p-4">
              <div className="mb-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Allocation
                </p>
                <h3 className="mt-1 text-sm font-semibold">Portfolio Map</h3>
              </div>
              <PortfolioPieChart balances={balances} />
            </section>

            <section className="min-h-0 rounded-2xl border border-white/10 bg-card/30">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Holdings
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{balances.length} active assets</p>
                </div>
                <span className="rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Live
                </span>
              </div>
              <div className="custom-scrollbar max-h-[360px] overflow-y-auto px-3 py-2">
                {balances.map((b, i) => (
                  <TokenBalanceRow key={b.token.symbol} balance={b} index={i} />
                ))}
              </div>
            </section>
          </div>

          <section className="min-w-0 rounded-2xl border border-white/10 bg-background/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  AI Advisor
                </p>
                <h3 className="mt-1 text-sm font-semibold">Action Plan</h3>
              </div>
              <button
                onClick={analyzePortfolio}
                disabled={analyzing || balances.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-primary/25 bg-primary/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-primary transition-colors hover:bg-primary/15 disabled:pointer-events-none disabled:opacity-50"
              >
                {analyzing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Brain className="h-3.5 w-3.5" />
                )}
                {analyzing ? "Analyzing" : "Analyze"}
              </button>
            </div>

            <AnimatePresence>
              {analysis ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className={`rounded-xl border px-3 py-3 text-xs leading-relaxed ${riskTone(analysis.riskLevel)}`}>
                    <span className="mr-1 font-mono font-medium uppercase tracking-wider">
                      {riskLabel(analysis.riskLevel)}
                    </span>
                    {analysis.summary}
                  </div>

                  {analysis.suggestions?.map((s, i) => (
                    <InsightCard
                      key={`${s.buttonLabel}-${i}`}
                      suggestion={s}
                      index={i}
                      riskLevel={analysis.riskLevel}
                      onExecute={handleSuggestion}
                    />
                  ))}
                </motion.div>
              ) : advisorError ? (
                <div className="rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-4 text-sm leading-relaxed text-red-200/80">
                  {advisorError}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Ready to analyze</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Run a short portfolio readout here, then ask SwapMate AI for the deeper breakdown.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>

        <StrategyMissions
          address={address}
          balances={balances}
          analysis={analysis}
          onSwapIntent={onSwapIntent}
          onAskAssistant={onAskAssistant}
        />
      </div>
    </div>
  );
}
