"use client";

import { motion } from "framer-motion";
import type { TokenBalance } from "@/lib/portfolio/types";

const TOKEN_COLORS: Record<string, string> = {
  ETH: "#A855F7",
  WETH: "#818CF8",
  USDC: "#38BDF8",
  LINK: "#34D399",
  UNI: "#F472B6",
};

interface TokenBalanceRowProps {
  balance: TokenBalance;
  index: number;
}

export function TokenBalanceRow({ balance, index }: TokenBalanceRowProps) {
  const color = TOKEN_COLORS[balance.token.symbol] ?? "#6B7280";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-background/55 px-3 py-3 last:mb-0"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: `${color}22`, border: `1px solid ${color}44`, color }}
      >
        {balance.token.symbol.slice(0, 1)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="min-w-0">
            <span className="text-sm font-medium">{balance.token.symbol}</span>
            <p className="truncate text-[10px] text-muted-foreground">{balance.token.name}</p>
          </div>
          <span className="shrink-0 text-sm font-mono text-foreground/80">{balance.human}</span>
        </div>
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(balance.percentage, 100)}%` }}
            transition={{ delay: index * 0.06 + 0.2, duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-[11px] text-muted-foreground font-mono">
          {balance.percentage.toFixed(1)}%
        </div>
        <div className="text-[10px] text-muted-foreground/60 font-mono">
          ${balance.usdValue.toFixed(2)}
        </div>
      </div>
    </motion.div>
  );
}
