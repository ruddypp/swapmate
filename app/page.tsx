"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { Brain, Zap, ShieldCheck } from "lucide-react";
import BorderGlow from "@/components/BorderGlow";
import MagicRings from "@/components/MagicRings";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 }
    },
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background text-foreground">
      {/* ── BACKGROUND ORBS (Lu.ma style) ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none animate-pulse duration-[12000ms]" />
      <div className="absolute top-[20%] left-[60%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse duration-[10000ms]" />

      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── HERO SECTION ── */}
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 mt-16 md:mt-24 min-h-[60vh]"
      >
        {/* Magic Rings Background - Full Hero Section */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ filter: 'brightness(1.5)' }}>
          <div className="w-[150vw] h-[150vh] min-w-[1000px] min-h-[1000px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <MagicRings
              color="#A855F7"
              colorTwo="#6366F1"
              ringCount={5}
              speed={1.5}
              attenuation={8}
              lineThickness={2.5}
              baseRadius={0.25}
              radiusStep={0.15}
              scaleRate={0.1}
              opacity={0.8}
              blur={0}
              noiseAmount={0}
              rotation={0}
              ringGap={1.5}
              fadeIn={0.7}
              fadeOut={0.5}
              followMouse={false}
              mouseInfluence={0.2}
              hoverScale={1.2}
              parallax={0.05}
              clickBurst={false}
            />
          </div>
        </div>

        <motion.div variants={itemVariants} className="mb-6 relative flex items-center justify-center w-full">
          {/* Floating Robot Mascot */}
          <motion.div 
            animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <div className="absolute inset-0 bg-primary/30 blur-[40px] rounded-full scale-150 animate-pulse" />
            <img
              src="/images/robot-avatar.png"
              alt="SwapMate Mascot"
              className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-[3px] border-white/20 shadow-2xl relative z-10"
            />
          </motion.div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl lg:text-[100px] font-bold tracking-tighter leading-[0.95] mb-6 max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
        >
          DeFi, Guided <br className="hidden md:block" /> by AI.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light"
        >
          Experience the future of token swaps. Simply tell SwapMate what you want to trade, and our intelligent agent handles the complex routing, slippage, and execution automatically.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/app">
            <Button size="lg" className="rounded-full h-14 px-10 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all hover:scale-105">
              Start Trading Now
            </Button>
          </Link>
          <a href="https://developers.uniswap.org/docs/sdks/v4/overview" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base border-white/10 hover:bg-white/5 bg-transparent backdrop-blur-sm transition-all">
              Powered by V4
            </Button>
          </a>
        </motion.div>
      </motion.main>

      {/* ── BENTO GRID FEATURES ── */}
      <motion.section 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-6 py-20 md:py-32 w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
      >
        {/* Large Card */}
        <motion.div variants={itemVariants} className="md:col-span-2 h-full">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="290 80 80"
            backgroundColor="#120F17"
            borderRadius={28}
            glowRadius={50}
            glowIntensity={1}
            coneSpread={30}
            animated={false}
            colors={['#c084fc', '#f472b6', '#38bdf8']}
            className="h-full"
          >
            <div className="p-10 h-full flex flex-col justify-between min-h-[260px]">
              <Brain className="w-10 h-10 text-primary mb-8 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground mb-3">Intent-Based Trading</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our proprietary AI parses natural language requests into precise, optimized on-chain execution commands. No more manual form-filling or confusing routing paths.
                </p>
              </div>
            </div>
          </BorderGlow>
        </motion.div>

        {/* Small Card 1 */}
        <motion.div variants={itemVariants} className="md:col-span-1 h-full">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="200 80 80"
            backgroundColor="#120F17"
            borderRadius={28}
            glowRadius={40}
            glowIntensity={1}
            coneSpread={25}
            colors={['#38bdf8', '#818cf8', '#c084fc']}
            className="h-full"
          >
            <div className="p-8 h-full flex flex-col justify-between min-h-[260px]">
              <Zap className="w-10 h-10 text-indigo-400 mb-8 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">Universal Router</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Built directly on Uniswap V4 with Permit2 for maximum gas efficiency and absolute security.
                </p>
              </div>
            </div>
          </BorderGlow>
        </motion.div>

        {/* Small Card 2 (Full Width Bottom) */}
        <motion.div variants={itemVariants} className="md:col-span-3 h-full">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="320 80 80"
            backgroundColor="#120F17"
            borderRadius={28}
            glowRadius={60}
            glowIntensity={1}
            coneSpread={35}
            colors={['#f472b6', '#c084fc', '#818cf8']}
            className="h-full"
          >
            <div className="p-10 h-full flex flex-col md:flex-row gap-8 justify-between items-center min-h-[200px]">
              <div className="max-w-xl order-2 md:order-1">
                <h3 className="text-xl font-semibold tracking-tight text-foreground mb-3">Zero Slippage Fear</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Before you execute, get instant deep analysis on price impact, routing paths, and liquidity depth. Make trades with absolute confidence and algorithmic precision.
                </p>
              </div>
              <ShieldCheck className="w-16 h-16 text-pink-400 flex-shrink-0 order-1 md:order-2 drop-shadow-[0_0_20px_rgba(244,114,182,0.5)]" />
            </div>
          </BorderGlow>
        </motion.div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-muted-foreground/60 relative z-10 backdrop-blur-sm bg-background/50">
        <p>SwapMate AI © {new Date().getFullYear()}. Testnet environment.</p>
      </footer>
    </div>
  );
}
