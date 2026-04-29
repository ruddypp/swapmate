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
      className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
    >
      {/* Token color dot */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
        style={{ backgroundColor: `${color}22`, border: `1px solid ${color}44`, color }}
      >
        {balance.token.symbol.slice(0, 1)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{balance.token.symbol}</span>
          <span className="text-sm font-mono text-foreground/80">{balance.human}</span>
        </div>
        {/* Percentage bar */}
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
        <div className="text-[10px] text-muted-foreground font-mono">
          {balance.percentage.toFixed(1)}%
        </div>
        <div className="text-[10px] text-muted-foreground/60 font-mono">
          ~${balance.usdValue.toFixed(0)}
        </div>
      </div>
    </motion.div>
  );
}
