"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  History,
  Layers3,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import type { SwapRecord } from "@/lib/swap/types";

function readHistory(): SwapRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(localStorage.getItem("swapmate_history") ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function formatTs(ts: number) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
}

function shortHash(hash: string) {
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

function statusTone(status: SwapRecord["status"]) {
  if (status === "confirmed") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "failed") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-amber-500/30 bg-amber-500/10 text-amber-300";
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/35 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-2 text-[11px] font-mono text-muted-foreground/70">{detail}</p>
    </div>
  );
}

export function SwapHistory({ refreshTrigger }: { refreshTrigger?: number }) {
  const [records, setRecords] = useState<SwapRecord[]>(() => readHistory());

  useEffect(() => {
    const id = window.setTimeout(() => {
      setRecords(readHistory());
    }, 0);

    return () => window.clearTimeout(id);
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    const confirmed = records.filter((rec) => rec.status === "confirmed").length;
    const chains = new Set(records.map((rec) => rec.chainId)).size;
    const last = records[0]?.timestamp ? formatTs(records[0].timestamp) : "No activity";
    const pairs = new Set(records.map((rec) => `${rec.tokenIn.symbol}/${rec.tokenOut.symbol}`)).size;

    return {
      total: records.length,
      confirmed,
      chains,
      last,
      pairs,
    };
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-card/30 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">No swaps recorded</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed swaps will appear here with route, guardrail, and explorer details.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Total Swaps" value="0" detail="Ready for your first trade" icon={<ReceiptText className="h-4 w-4" />} />
            <StatCard label="Confirmed" value="0" detail="Sepolia confirmations" icon={<CheckCircle2 className="h-4 w-4" />} />
            <StatCard label="Pairs" value="0" detail="Routes will be tracked" icon={<Layers3 className="h-4 w-4" />} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-background/70 px-5 py-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            What Gets Saved
          </p>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              Token route, final amount, status, and Sepolia transaction link.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              Recent activity is kept locally in this browser.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
      <div className="flex min-h-0 flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            label="Total Swaps"
            value={String(stats.total)}
            detail={`${stats.confirmed} confirmed`}
            icon={<ReceiptText className="h-4 w-4" />}
          />
          <StatCard
            label="Pairs Traded"
            value={String(stats.pairs)}
            detail="Unique token routes"
            icon={<Layers3 className="h-4 w-4" />}
          />
          <StatCard
            label="Last Activity"
            value={records[0]?.tokenOut.symbol ?? "-"}
            detail={stats.last}
            icon={<Clock3 className="h-4 w-4" />}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-card/30">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Transaction Timeline
              </p>
              <p className="mt-1 text-sm text-foreground/80">Latest Sepolia swaps</p>
            </div>
            <span className="rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Local
            </span>
          </div>

          <div className="custom-scrollbar h-full overflow-y-auto px-3 py-3 pb-20">
            <div className="space-y-3">
              {records.map((rec, i) => (
                <motion.article
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="rounded-2xl border border-white/10 bg-background/65 p-4 transition-colors hover:border-primary/25"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-xs font-mono text-foreground">
                          {rec.amountIn} {rec.tokenIn.symbol}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-mono text-primary">
                          {rec.amountOut} {rec.tokenOut.symbol}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-mono text-muted-foreground">
                        {formatTs(rec.timestamp)} · Chain {rec.chainId}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <span className={`rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-widest ${statusTone(rec.status)}`}>
                        {rec.status}
                      </span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${rec.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground transition-colors hover:text-primary"
                      >
                        {shortHash(rec.txHash)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden min-h-0 rounded-2xl border border-white/10 bg-background/70 p-5 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Activity Digest
              </p>
              <h3 className="text-sm font-semibold">SwapMate Memory</h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Network
              </p>
              <p className="mt-1 text-sm">{stats.chains === 1 ? "Sepolia only" : `${stats.chains} chains`}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Success Rate
              </p>
              <p className="mt-1 text-sm">
                {Math.round((stats.confirmed / stats.total) * 100)}% confirmed
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Recent Route
              </p>
              <p className="mt-1 text-sm">
                {records[0]?.tokenIn.symbol} to {records[0]?.tokenOut.symbol}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
