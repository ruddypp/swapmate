"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicClient } from "wagmi";
import { useAppKitAccount } from "@reown/appkit/react";
import { RefreshCw, AlertCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioPieChart } from "./PortfolioPieChart";
import { TokenBalanceRow } from "./TokenBalanceRow";
import { InsightCard } from "./InsightCard";
import { fetchWalletBalances } from "@/lib/portfolio/balances";
import type { TokenBalance, PortfolioAnalysis, Suggestion } from "@/lib/portfolio/types";
import type { ParsedSwapIntent } from "@/lib/swap/types";

interface PortfolioPanelProps {
  onSwapIntent: (intent: ParsedSwapIntent) => void;
}

export function PortfolioPanel({ onSwapIntent }: PortfolioPanelProps) {
  const { address, isConnected } = useAppKitAccount();
  const publicClient = usePublicClient();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadPortfolio = useCallback(async () => {
    if (!address || !publicClient) return;
    setLoading(true);
    setError(null);

    try {
      const bals = await fetchWalletBalances(address as `0x${string}`, publicClient);
      setBalances(bals);
      setLastRefresh(new Date());

      // Auto-analyze after loading
      if (bals.length > 0) {
        setAnalyzing(true);
        try {
          const res = await fetch("/api/portfolio/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ balances: bals, address }),
          });
          if (res.ok) {
            const data: PortfolioAnalysis = await res.json();
            setAnalysis(data);
          }
        } catch {
          // Analysis failed silently — balances still show
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (isConnected && address) {
      loadPortfolio();
    }
  }, [isConnected, address, loadPortfolio]);

  function handleSuggestion(suggestion: Suggestion) {
    onSwapIntent({
      tokenIn: suggestion.intent.tokenIn,
      tokenOut: suggestion.intent.tokenOut,
      amount: suggestion.intent.amount,
      action: suggestion.intent.action,
    });
  }

  const totalUsd = balances.reduce((sum, b) => sum + b.usdValue, 0);

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 py-16">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Wallet className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Connect Your Wallet</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Connect your wallet to see your portfolio analysis and get AI-powered trading suggestions.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Reading wallet balances...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6">
        <AlertCircle className="w-6 h-6 text-destructive" />
        <p className="text-sm text-destructive text-center">{error}</p>
        <Button variant="secondary" size="sm" onClick={loadPortfolio}>Retry</Button>
      </div>
    );
  }

  // Empty state
  if (balances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6 text-center">
        <p className="text-sm text-muted-foreground">No token balances found on Sepolia testnet.</p>
        <p className="text-xs text-muted-foreground/60">
          Get testnet ETH from a faucet to start trading.
        </p>
        <Button variant="secondary" size="sm" onClick={loadPortfolio}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Portfolio</h2>
          {lastRefresh && (
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
              Updated {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={loadPortfolio}
          disabled={loading}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-6">
        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Total Value (est.)</p>
          <p className="text-3xl font-bold tracking-tight">${totalUsd.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground/50 font-mono">Sepolia Testnet · No real value</p>
        </motion.div>

        {/* Pie Chart */}
        <PortfolioPieChart balances={balances} />

        {/* Token List */}
        <div>
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-3">Holdings</p>
          <div>
            {balances.map((b, i) => (
              <TokenBalanceRow key={b.token.symbol} balance={b} index={i} />
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">AI Advisor</p>
            {analyzing && (
              <span className="text-[9px] text-primary font-mono tracking-wider animate-pulse">Analyzing...</span>
            )}
          </div>

          <AnimatePresence>
            {analysis && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className={`px-3 py-2.5 rounded-xl border text-xs leading-relaxed ${
                  analysis.riskLevel === "high"
                    ? "border-red-500/30 bg-red-500/5 text-red-200/80"
                    : analysis.riskLevel === "medium"
                    ? "border-amber-500/30 bg-amber-500/5 text-amber-200/80"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/80"
                }`}>
                  <span className="font-mono font-medium mr-1">
                    {analysis.riskLevel === "high" ? "⚠ HIGH RISK" : analysis.riskLevel === "medium" ? "⚡ MEDIUM RISK" : "✓ LOW RISK"}
                  </span>
                  {analysis.summary}
                </div>

                {/* Suggestion cards */}
                {analysis.suggestions?.map((s, i) => (
                  <InsightCard
                    key={i}
                    suggestion={s}
                    index={i}
                    riskLevel={analysis.riskLevel}
                    onExecute={handleSuggestion}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
