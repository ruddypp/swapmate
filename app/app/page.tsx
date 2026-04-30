"use client";

import { useState, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { SwapHistory } from "@/components/swap/SwapHistory";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { Navbar } from "@/components/Navbar";
import type { ParsedSwapIntent, QuoteResult, BatchSwapIntent } from "@/lib/swap/types";
import type { Token } from "@/lib/swap/types";
import type { PortfolioContextSnapshot } from "@/lib/portfolio/types";

export default function Home() {
  const [prefillIntent, setPrefillIntent] = useState<ParsedSwapIntent | undefined>();
  const [batchIntent, setBatchIntent] = useState<BatchSwapIntent | undefined>();
  const [quoteContext, setQuoteContext] = useState<{
    tokenIn?: Token;
    tokenOut?: Token;
    amountIn?: string;
    quote?: QuoteResult | null;
  }>({});
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"swap" | "history" | "portfolio">("swap");
  const [portfolioContext, setPortfolioContext] = useState<PortfolioContextSnapshot>({
    status: "disconnected",
    totalUsd: 0,
    stableShare: 0,
    volatileShare: 0,
    balances: [],
    analysis: null,
  });

  const handleSwapIntent = useCallback((intent: ParsedSwapIntent) => {
    setPrefillIntent(intent);
    setBatchIntent(undefined);
    setActiveTab("swap");
  }, []);

  const handleBatchSwapIntent = useCallback((batch: BatchSwapIntent) => {
    setBatchIntent(batch);
    setPrefillIntent(undefined);
    setActiveTab("swap");
  }, []);

  const handleClearIntent = useCallback(() => {
    setPrefillIntent(undefined);
  }, []);

  const handleClearBatch = useCallback(() => {
    setBatchIntent(undefined);
  }, []);

  const handleSwapComplete = useCallback(() => {
    setHistoryTrigger((n) => n + 1);
    setActiveTab("history");
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="h-[100dvh] max-h-[100dvh] min-h-0 flex flex-col relative overflow-hidden"
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
      <motion.main variants={itemVariants} className="flex-1 min-h-0 flex flex-col md:flex-row relative z-10 overflow-hidden">
        {/* Left: Swap / History / Portfolio */}
        <div className="flex-1 border-r border-border flex flex-col min-h-0">
          {/* Section header */}
          <div className="px-6 py-3 border-b border-border shrink-0">
            <div className="flex gap-6 md:hidden mb-3">
              {(["swap", "history", "portfolio"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[11px] tracking-widest uppercase ${
                    activeTab === tab ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === "swap" ? (
              <>
                <h1 className="text-xl font-semibold tracking-tight">
                  Token Swap
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Uniswap v4 — Sepolia testnet. <span className="hidden md:inline">Command the AI Assistant or swap manually.</span>
                </p>
              </>
            ) : activeTab === "history" ? (
              <>
                <h1 className="text-xl font-semibold tracking-tight">
                  Swap History
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your recent transactions
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold tracking-tight">
                  AI Portfolio
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Live wallet analysis & smart suggestions
                </p>
              </>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-4 sm:px-6">
            {activeTab === "swap" ? (
              <motion.div
                key="swap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="mx-auto h-full min-h-0 w-full max-w-6xl"
              >
                <SwapPanel
                  prefillIntent={prefillIntent}
                  batchIntent={batchIntent}
                  onClearIntent={handleClearIntent}
                  onClearBatch={handleClearBatch}
                  onSwapComplete={handleSwapComplete}
                  onQuoteUpdate={setQuoteContext}
                />
              </motion.div>
            ) : activeTab === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full overflow-y-auto custom-scrollbar"
              >
                <SwapHistory refreshTrigger={historyTrigger} />
              </motion.div>
            ) : (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="h-full -mx-4 -my-4 sm:-mx-6"
              >
                <PortfolioPanel
                  onSwapIntent={handleSwapIntent}
                  onPortfolioContextChange={setPortfolioContext}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: AI Assistant */}
        <div
          className="w-full h-[620px] md:h-auto md:w-[380px] flex flex-col border-t md:border-t-0 border-border min-h-0"
        >
          <AIAssistant
              onSwapIntent={handleSwapIntent}
              onBatchSwapIntent={handleBatchSwapIntent}
              quoteContext={quoteContext}
              appContext={{ activeTab, portfolio: portfolioContext }}
            />
        </div>
      </motion.main>
    </motion.div>
  );
}
