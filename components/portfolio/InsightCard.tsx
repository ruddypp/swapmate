"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import BorderGlow from "@/components/BorderGlow";
import type { Suggestion } from "@/lib/portfolio/types";

interface InsightCardProps {
  suggestion: Suggestion;
  index: number;
  riskLevel: "low" | "medium" | "high";
  onExecute: (suggestion: Suggestion) => void;
}

const RISK_GLOW: Record<string, string> = {
  low: "140 80 80",
  medium: "40 80 80",
  high: "0 80 80",
};

const RISK_COLORS: Record<string, string[]> = {
  low: ["#34D399", "#38BDF8"],
  medium: ["#FBBF24", "#F472B6"],
  high: ["#F87171", "#F472B6"],
};

const RISK_ICON = {
  low: <TrendingUp className="w-4 h-4 text-emerald-400" />,
  medium: <Zap className="w-4 h-4 text-amber-400" />,
  high: <TrendingDown className="w-4 h-4 text-red-400" />,
};

export function InsightCard({ suggestion, index, riskLevel, onExecute }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 280, damping: 22 }}
    >
      <BorderGlow
        edgeSensitivity={25}
        glowColor={RISK_GLOW[riskLevel]}
        backgroundColor="#120F17"
        borderRadius={16}
        glowRadius={35}
        glowIntensity={0.8}
        coneSpread={20}
        colors={RISK_COLORS[riskLevel]}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex-shrink-0">{RISK_ICON[riskLevel]}</div>
            <p className="text-sm leading-relaxed text-foreground/80">{suggestion.text}</p>
          </div>
          <Button
            onClick={() => onExecute(suggestion)}
            className="w-full h-8 text-[10px] tracking-widest uppercase font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-all duration-200"
            variant="ghost"
          >
            {suggestion.buttonLabel}
          </Button>
        </div>
      </BorderGlow>
    </motion.div>
  );
}
