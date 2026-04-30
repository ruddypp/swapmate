"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Bot,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { PortfolioAnalysis, TokenBalance } from "@/lib/portfolio/types";
import type { ParsedSwapIntent, SwapRecord } from "@/lib/swap/types";
import type { MissionKind, MissionPriority, StrategyMission } from "@/lib/strategy/types";

interface StrategyMissionsProps {
  address?: string;
  balances: TokenBalance[];
  analysis: PortfolioAnalysis | null;
  onSwapIntent: (intent: ParsedSwapIntent) => void;
  onAskAssistant?: (prompt: string) => void;
}

type HistoryContext = {
  total: number;
  confirmed: number;
  failed: number;
  uniquePairs: number;
  recent: Array<{
    route: string;
    status: SwapRecord["status"];
    timestamp: string;
  }>;
};

const KIND_ICON: Record<MissionKind, typeof Target> = {
  rebalance: Target,
  learn: BookOpen,
  risk: ShieldCheck,
  route: Route,
};

function priorityTone(priority: MissionPriority) {
  if (priority === "high") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (priority === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
}

function readHistoryContext(): HistoryContext {
  if (typeof window === "undefined") {
    return { total: 0, confirmed: 0, failed: 0, uniquePairs: 0, recent: [] };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem("swapmate_history") ?? "[]");
    const records: SwapRecord[] = Array.isArray(parsed) ? parsed : [];
    const pairs = new Set(records.map((rec) => `${rec.tokenIn.symbol}/${rec.tokenOut.symbol}`));

    return {
      total: records.length,
      confirmed: records.filter((rec) => rec.status === "confirmed").length,
      failed: records.filter((rec) => rec.status === "failed").length,
      uniquePairs: pairs.size,
      recent: records.slice(0, 6).map((rec) => ({
        route: `${rec.tokenIn.symbol} -> ${rec.tokenOut.symbol}`,
        status: rec.status,
        timestamp: new Date(rec.timestamp).toISOString(),
      })),
    };
  } catch {
    return { total: 0, confirmed: 0, failed: 0, uniquePairs: 0, recent: [] };
  }
}

function serializeBalances(balances: TokenBalance[]) {
  return balances.map((balance) => ({
    symbol: balance.token.symbol,
    name: balance.token.name,
    human: balance.human,
    percentage: balance.percentage,
    usdValue: balance.usdValue,
  }));
}

export function StrategyMissions({
  address,
  balances,
  analysis,
  onSwapIntent,
  onAskAssistant,
}: StrategyMissionsProps) {
  const [missions, setMissions] = useState<StrategyMission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missionStats = useMemo(() => {
    const top = balances.reduce<TokenBalance | null>(
      (current, balance) => (!current || balance.percentage > current.percentage ? balance : current),
      null
    );

    return {
      topSymbol: top?.token.symbol ?? "-",
      topShare: top?.percentage ?? 0,
      hasMissions: missions.length > 0,
    };
  }, [balances, missions.length]);

  async function generateMissions() {
    if (!address || balances.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/strategy/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          portfolio: {
            balances: serializeBalances(balances),
            analysis,
          },
          history: readHistoryContext(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to generate missions");
      }

      const data = await res.json();
      setMissions(Array.isArray(data.missions) ? data.missions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate missions");
    } finally {
      setLoading(false);
    }
  }

  function runMission(mission: StrategyMission) {
    if (mission.action.type === "prepare_swap") {
      onSwapIntent({
        tokenIn: mission.action.tokenIn,
        tokenOut: mission.action.tokenOut,
        amount: mission.action.amount,
        action: "quote",
      });
      return;
    }

    onAskAssistant?.(mission.action.prompt);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-background/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            AI Strategy Missions
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight">Mission Control</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Generate agentic next steps from portfolio allocation, advisor context, and recent swap behavior.
          </p>
        </div>

        <button
          onClick={generateMissions}
          disabled={loading || balances.length === 0}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-sm border border-primary/25 bg-primary/10 px-3 text-[10px] font-mono uppercase tracking-widest text-primary transition-colors hover:bg-primary/15 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? "Generating" : missionStats.hasMissions ? "Regenerate" : "Generate Missions"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Focus Asset
          </p>
          <p className="mt-1 text-sm font-medium">{missionStats.topSymbol}</p>
          <p className="mt-1 text-[11px] font-mono text-muted-foreground/70">
            {missionStats.topShare.toFixed(1)}% allocation
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Mission Source
          </p>
          <p className="mt-1 text-sm font-medium">Portfolio + History</p>
          <p className="mt-1 text-[11px] font-mono text-muted-foreground/70">Local context only</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Execution
          </p>
          <p className="mt-1 text-sm font-medium">Prefill Only</p>
          <p className="mt-1 text-[11px] font-mono text-muted-foreground/70">No auto-trades</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-3 text-sm text-red-200/80">
          {error}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {missions.length > 0 ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 grid gap-3 lg:grid-cols-3"
          >
            {missions.map((mission, index) => {
              const Icon = KIND_ICON[mission.kind] ?? Target;

              return (
                <motion.article
                  key={mission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.24 }}
                  className="flex min-h-[260px] flex-col rounded-2xl border border-white/10 bg-card/35 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.16)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`rounded-sm border px-2 py-1 text-[9px] font-mono uppercase tracking-widest ${priorityTone(mission.priority)}`}>
                      {mission.priority}
                    </span>
                  </div>

                  <div className="mt-4 min-w-0 flex-1">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Mission {String(index + 1).padStart(2, "0")}
                    </p>
                    <h4 className="mt-1 text-sm font-semibold leading-snug">{mission.title}</h4>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {mission.summary}
                    </p>
                    <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-muted-foreground/85">
                      {mission.rationale}
                    </p>
                  </div>

                  <button
                    onClick={() => runMission(mission)}
                    className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/[0.04] px-3 text-[10px] font-mono uppercase tracking-widest text-foreground transition-colors hover:border-primary/30 hover:bg-primary/10"
                  >
                    {mission.action.type === "prepare_swap" ? (
                      <ArrowRight className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                    {mission.actionLabel}
                  </button>
                </motion.article>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">No missions generated yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Generate a short plan when you want AI to turn wallet state into concrete Sepolia actions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
