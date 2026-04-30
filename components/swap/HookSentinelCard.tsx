"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  HookSentinelReport,
  SentinelCheckState,
  SentinelStatus,
} from "@/lib/swap/types";

interface HookSentinelCardProps {
  report: HookSentinelReport | null;
  isLoading?: boolean;
  error?: string | null;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const STATUS_META: Record<
  SentinelStatus,
  {
    label: string;
    icon: ReactNode;
    border: string;
    bg: string;
    text: string;
    badge: string;
  }
> = {
  clear: {
    label: "Clear",
    icon: <ShieldCheck className="w-4 h-4" />,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    text: "text-emerald-300",
    badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  },
  caution: {
    label: "Watch",
    icon: <AlertTriangle className="w-4 h-4" />,
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    text: "text-amber-300",
    badge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  },
  blocked: {
    label: "Blocked",
    icon: <ShieldAlert className="w-4 h-4" />,
    border: "border-red-500/35",
    bg: "bg-red-500/5",
    text: "text-red-300",
    badge: "bg-red-500/10 border-red-500/30 text-red-300",
  },
};

const CHECK_META: Record<SentinelCheckState, string> = {
  pass: "bg-emerald-400",
  watch: "bg-amber-400",
  fail: "bg-red-400",
};

function shortAddress(address: string) {
  if (address.toLowerCase() === ZERO_ADDRESS) return "0x0000...0000";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function LoadingSentinelCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full border border-primary/25 bg-primary/10 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono tracking-widest uppercase text-primary">
              AI Hook Sentinel
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scanning v4 route and guardrails...
            </p>
          </div>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse flex-shrink-0" />
      </div>
    </motion.div>
  );
}

export function HookSentinelCard({ report, isLoading, error }: HookSentinelCardProps) {
  if (isLoading) return <LoadingSentinelCard />;

  if (!report && !error) return null;

  if (!report && error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-3"
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-amber-300">
              Sentinel unavailable
            </p>
            <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!report) return null;

  const meta = STATUS_META[report.status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${report.status}-${report.hookAddress}-${report.confidence}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`rounded-xl border ${meta.border} ${meta.bg} px-3 py-3 space-y-3 overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${meta.badge}`}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                  AI Hook Sentinel
                </p>
                <span className={`px-1.5 py-0.5 rounded-sm border text-[9px] font-mono uppercase tracking-wider ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>
              <h3 className={`text-sm font-semibold tracking-tight mt-1 ${meta.text}`}>
                {report.title}
              </h3>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
              Confidence
            </p>
            <p className={`text-sm font-mono ${meta.text}`}>{report.confidence}%</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-foreground/75">{report.summary}</p>

        <div className="grid grid-cols-1 gap-2">
          {report.checks.map((check) => (
            <div
              key={check.label}
              className="rounded-sm border border-white/10 bg-background/25 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CHECK_META[check.state]}`} />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {check.label}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-foreground/80 text-right truncate max-w-[150px]">
                  {check.value}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground mt-1.5">
                {check.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono text-muted-foreground">
            <LockKeyhole className="w-3 h-3" />
            Hook {shortAddress(report.hookAddress)}
          </span>
          <span className="rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono text-muted-foreground">
            Max impact {report.policy.maxPriceImpact.toFixed(2)}%
          </span>
          <span className="rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono text-muted-foreground">
            Max slippage {(report.policy.maxSlippageBps / 100).toFixed(2)}%
          </span>
        </div>

        <div className="space-y-1.5">
          {report.recommendations.map((item) => (
            <div key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
