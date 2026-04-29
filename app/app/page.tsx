"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { SwapHistory } from "@/components/swap/SwapHistory";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { Navbar } from "@/components/Navbar";
import type { ParsedSwapIntent, QuoteResult, SwapRecord } from "@/lib/swap/types";
import type { Token } from "@/lib/swap/types";

export default function Home() {
  const [prefillIntent, setPrefillIntent] = useState<ParsedSwapIntent | undefined>();
  const [quoteContext, setQuoteContext] = useState<{
    tokenIn?: Token;
    tokenOut?: Token;
    amountIn?: string;
    quote?: QuoteResult;
  }>({});
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"swap" | "history">("swap");

  const handleSwapIntent = useCallback((intent: ParsedSwapIntent) => {
    setPrefillIntent(intent);
    setActiveTab("swap");
  }, []);

  const handleClearIntent = useCallback(() => {
    setPrefillIntent(undefined);
  }, []);

  const handleSwapComplete = useCallback((record: SwapRecord) => {
    setHistoryTrigger((n) => n + 1);
    setActiveTab("history");
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen flex flex-col relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── NAV ─────────────────────────────────────────── */}
      <Navbar 
        isApp 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* ── MAIN ────────────────────────────────────────── */}
      <motion.main variants={itemVariants} className="flex-1 flex flex-col md:flex-row relative z-10">
        {/* Left: Swap / History */}
        <div className="flex-1 border-r border-border flex flex-col min-h-0">
          {/* Section header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex gap-6 md:hidden mb-3">
              <button
                onClick={() => setActiveTab("swap")}
                className={`text-[11px] tracking-widest uppercase ${
                  activeTab === "swap" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                Swap
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`text-[11px] tracking-widest uppercase ${
                  activeTab === "history" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                History
              </button>
            </div>
            {activeTab === "swap" ? (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Token Swap
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Uniswap v4 — Sepolia testnet. <span className="hidden md:inline">Select tokens manually or command the AI Assistant on the right.</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Swap History
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your recent transactions
                </p>
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === "swap" ? (
              <motion.div
                key="swap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-sm"
              >
                <SwapPanel
                  prefillIntent={prefillIntent}
                  onClearIntent={handleClearIntent}
                  onSwapComplete={handleSwapComplete}
                  onQuoteUpdate={setQuoteContext}
                />
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <SwapHistory refreshTrigger={historyTrigger} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: AI Assistant */}
        <div
          className="w-full md:w-[380px] flex flex-col border-t md:border-t-0 border-border"
          style={{ height: "calc(100vh - 57px)" }}
        >
          <AIAssistant
            onSwapIntent={handleSwapIntent}
            quoteContext={quoteContext}
          />
        </div>
      </motion.main>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <motion.footer variants={itemVariants} className="border-t border-border px-6 py-3 flex items-center justify-between relative z-10 bg-background/80 backdrop-blur-sm">
        <p className="text-[10px] text-muted-foreground font-mono tracking-wide">
          Built on Uniswap v4 · Powered by Groq AI
        </p>
        <p className="text-[10px] text-muted-foreground font-mono">
          Testnet only — no real funds
        </p>
      </motion.footer>
    </motion.div>
  );
}
