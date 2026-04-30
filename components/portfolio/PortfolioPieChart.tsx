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

interface PortfolioPieChartProps {
  balances: TokenBalance[];
}

export function PortfolioPieChart({ balances }: PortfolioPieChartProps) {
  if (balances.length === 0) return null;

  const size = 160;
  const radius = 60;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 20;

  const total = balances.reduce((sum, b) => sum + b.percentage, 0);

  const segments = balances.map((b, index) => {
    const previous = balances
      .slice(0, index)
      .reduce((sum, item) => sum + (total > 0 ? item.percentage / total : 0), 0);
    const pct = total > 0 ? b.percentage / total : 0;
    const startAngle = previous * 360 - 90;
    const endAngle = (previous + pct) * 360 - 90;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const sweep = endAngle - startAngle;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = sweep > 180 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { d, color: TOKEN_COLORS[b.token.symbol] ?? "#6B7280", symbol: b.token.symbol, pct };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="shrink-0"
      >
        {segments.map((seg, i) => (
          <motion.path
            key={i}
            d={seg.d}
            fill={seg.color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="hover:opacity-100 transition-opacity cursor-pointer"
          />
        ))}
        {/* Center hole */}
        <circle cx={cx} cy={cy} r={radius - strokeWidth} fill="var(--background)" />
      </motion.svg>

      {/* Legend */}
      <div className="w-full flex-1 space-y-2">
        {balances.map((b, i) => (
          <motion.div
            key={b.token.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1.5"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: TOKEN_COLORS[b.token.symbol] ?? "#6B7280" }}
            />
            <span className="text-xs text-muted-foreground flex-1">{b.token.symbol}</span>
            <span className="text-xs font-mono text-foreground/80">{b.percentage.toFixed(1)}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
