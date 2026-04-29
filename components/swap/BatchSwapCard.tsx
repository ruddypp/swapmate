"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, XCircle, Clock, ArrowRight, ExternalLink } from "lucide-react";
import type { BatchSwapItem } from "@/lib/swap/types";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx/";

const STATUS_CONFIG = {
  pending: {
    icon: <Clock className="w-4 h-4 text-muted-foreground" />,
    label: "Pending",
    color: "border-border bg-muted/20",
  },
  quoting: {
    icon: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
    label: "Getting quote...",
    color: "border-primary/30 bg-primary/5",
  },
  swapping: {
    icon: <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />,
    label: "Swapping...",
    color: "border-amber-500/30 bg-amber-500/5",
  },
  done: {
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    label: "Confirmed",
    color: "border-emerald-500/30 bg-emerald-500/5",
  },
  error: {
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    label: "Failed",
    color: "border-red-500/30 bg-red-500/5",
  },
};

interface BatchSwapCardProps {
  item: BatchSwapItem;
  index: number;
}

export function BatchSwapCard({ item, index }: BatchSwapCardProps) {
  const cfg = STATUS_CONFIG[item.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 24 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors duration-300 ${cfg.color}`}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">{cfg.icon}</div>

      {/* Swap Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span>{item.amount} {item.tokenIn}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span>{item.tokenOut}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{cfg.label}</div>
      </div>

      {/* Tx Hash Link */}
      <AnimatePresence>
        {item.txHash && (
          <motion.a
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            href={`${SEPOLIA_EXPLORER}${item.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </motion.a>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {item.errorMsg && (
        <div className="text-[10px] text-red-400 truncate max-w-[80px]" title={item.errorMsg}>
          {item.errorMsg}
        </div>
      )}
    </motion.div>
  );
}
