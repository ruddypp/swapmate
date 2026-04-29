"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SwapRecord } from "@/lib/swap/types";

function formatTs(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function SwapHistory({ refreshTrigger }: { refreshTrigger?: number }) {
  const [records, setRecords] = useState<SwapRecord[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("swapmate_history") ?? "[]");
      setRecords(stored);
    } catch {
      setRecords([]);
    }
  }, [refreshTrigger]);

  if (records.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-label">No swaps yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your completed swaps will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {records.map((rec, i) => (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.2 }}
          className="py-3 border-b border-border last:border-0"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-mono text-foreground/90">
                {rec.amountIn}{" "}
                <span className="text-muted-foreground">{rec.tokenIn.symbol}</span>
                {" → "}
                {rec.amountOut}{" "}
                <span className="text-muted-foreground">{rec.tokenOut.symbol}</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {formatTs(rec.timestamp)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span
                className={`text-[10px] font-medium uppercase tracking-wider ${
                  rec.status === "confirmed"
                    ? "text-emerald-400"
                    : rec.status === "failed"
                    ? "text-destructive"
                    : "text-amber-400"
                }`}
              >
                {rec.status}
              </span>
              <a
                href={`https://sepolia.etherscan.io/tx/${rec.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
              >
                {rec.txHash.slice(0, 8)}... ↗
              </a>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
