"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Brain,
  Zap,
  ShieldCheck,
  Layers,
  History,
  ChartPie,
  ArrowRight,
  BookOpen,
} from "lucide-react";

// Inline GitHub SVG (lucide-react version doesn't export Github)
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import BorderGlow from "@/components/BorderGlow";
import MagicRings from "@/components/MagicRings";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Animation helpers ────────────────────────────────────────────────────────

function useScrollReveal(margin = "-80px") {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as `${number}px` });
  return { ref, isInView };
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 220, damping: 22 },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

// ── Features data ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    title: "Intent-Based Trading",
    description:
      "Just type what you want — 'Swap 0.1 ETH to USDC'. Our AI parses natural language and fills the form automatically.",
    accent: "text-violet-400",
    glow: "290 75 75",
    colors: ["#c084fc", "#f472b6", "#38bdf8"],
    span: "md:col-span-2",
  },
  {
    icon: Zap,
    title: "Uniswap v4 Universal Router",
    description:
      "Built on Uniswap v4 with Permit2 for gas-efficient, secure token swaps across multiple fee tiers.",
    accent: "text-indigo-400",
    glow: "230 75 75",
    colors: ["#818cf8", "#38bdf8", "#c084fc"],
    span: "md:col-span-1",
  },
  {
    icon: ShieldCheck,
    title: "AI Hook Sentinel",
    description:
      "Before execution, the sentinel scans for price impact, slippage risk, and dangerous custom hooks — blocking unsafe trades automatically.",
    accent: "text-pink-400",
    glow: "330 75 75",
    colors: ["#f472b6", "#c084fc", "#818cf8"],
    span: "md:col-span-1",
  },
  {
    icon: Layers,
    title: "Batch Swap",
    description:
      "Say 'split 0.5 ETH into USDC, UNI, and LINK' — the AI plans a full batch and executes each swap sequentially.",
    accent: "text-cyan-400",
    glow: "190 75 75",
    colors: ["#22d3ee", "#818cf8", "#38bdf8"],
    span: "md:col-span-1",
  },
  {
    icon: History,
    title: "Persistent Swap History",
    description:
      "Every swap is saved locally with tx hash, amounts, and status — no backend, no database, just your browser.",
    accent: "text-amber-400",
    glow: "60 75 75",
    colors: ["#fbbf24", "#f472b6", "#c084fc"],
    span: "md:col-span-1",
  },
  {
    icon: ChartPie,
    title: "AI Portfolio Analysis",
    description:
      "Connect your wallet and get an instant AI-powered breakdown of your holdings, risk profile, and actionable suggestions.",
    accent: "text-emerald-400",
    glow: "150 75 75",
    colors: ["#34d399", "#22d3ee", "#818cf8"],
    span: "md:col-span-2",
  },
];

const STATS = [
  { label: "Tokens Supported", target: 5, suffix: "" },
  { label: "Fee Tiers Scanned", target: 3, suffix: "" },
  { label: "On-chain execution", target: 100, suffix: "%" },
];


// ── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const featuresReveal = useScrollReveal("-60px");
  const statsReveal = useScrollReveal("-60px");
  const ctaReveal = useScrollReveal("-60px");

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-background text-foreground">
      {/* ── Global background orbs ── */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[130px] mix-blend-screen pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-[160px] mix-blend-screen pointer-events-none" />
      <div className="fixed top-[30%] left-[65%] w-[350px] h-[350px] bg-purple-500/8 rounded-full blur-[110px] mix-blend-screen pointer-events-none" />

      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-[90vh] px-6 pt-28 pb-20 z-10">
        {/* MagicRings background */}
        <div
          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
          style={{ filter: "brightness(1.4)" }}
        >
          <div className="w-[150vw] h-[150vh] min-w-[900px] min-h-[900px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <MagicRings
              color="#A855F7"
              colorTwo="#6366F1"
              ringCount={5}
              speed={1.2}
              attenuation={8}
              lineThickness={2}
              baseRadius={0.28}
              radiusStep={0.14}
              scaleRate={0.08}
              opacity={0.75}
              blur={0}
              noiseAmount={0}
              rotation={0}
              ringGap={1.5}
              fadeIn={0.7}
              fadeOut={0.5}
              followMouse={false}
              mouseInfluence={0.15}
              hoverScale={1.15}
              parallax={0.04}
              clickBurst={false}
            />
          </div>
        </div>

        {/* Hero content */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-[10px] tracking-[0.18em] uppercase font-mono border-primary/30 text-primary bg-primary/10 backdrop-blur"
            >
              Sepolia Testnet · Beta
            </Badge>
          </motion.div>

          {/* Floating robot mascot */}
          <motion.div variants={fadeUp} className="mb-7 relative">
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="absolute inset-0 bg-primary/30 blur-[50px] rounded-full scale-150 animate-pulse" />
              <img
                src="/images/robot-avatar.png"
                alt="SwapMate Mascot"
                className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-[3px] border-white/15 shadow-2xl relative z-10"
              />
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-7xl lg:text-[96px] font-bold tracking-tighter leading-[0.92] mb-5 max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/50"
          >
            DeFi, Guided
            <br className="hidden sm:block" /> by AI.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed font-light"
          >
            Swap tokens on Uniswap v4, guided by an intelligent AI co-pilot that
            understands intent, scans for risk, and executes on-chain — all in
            plain English.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-full h-13 px-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_rgba(168,85,247,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_55px_rgba(168,85,247,0.5)]"
              >
                Launch App
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a
              href="https://developers.uniswap.org/docs/sdks/v4/overview"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-13 px-8 text-sm border-white/10 hover:bg-white/5 bg-transparent backdrop-blur-sm transition-all hover:border-white/20"
              >
                <BookOpen className="mr-2 w-4 h-4" />
                Powered by V4
              </Button>
            </a>
          </motion.div>

        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-4 h-4 border-b-2 border-r-2 border-muted-foreground/30 rotate-45"
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-36 z-10">
        <div ref={featuresReveal.ref} className="max-w-5xl mx-auto px-6">
          {/* Section header */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresReveal.isInView ? "show" : "hidden"}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              className="text-[10px] tracking-[0.2em] uppercase font-mono text-primary mb-4"
            >
              Features
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground mb-4"
            >
              Everything you need
              <br className="hidden md:block" /> to trade smarter
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-base max-w-lg mx-auto"
            >
              SwapMate combines on-chain Uniswap v4 infrastructure with AI
              intelligence for a safer, smarter DeFi experience.
            </motion.p>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={featuresReveal.isInView ? "show" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className={`${f.span} group`}
                >
                  <BorderGlow
                    edgeSensitivity={28}
                    glowColor={f.glow}
                    backgroundColor="#0D0B13"
                    borderRadius={22}
                    glowRadius={50}
                    glowIntensity={0.9}
                    coneSpread={28}
                    animated={false}
                    colors={f.colors}
                    className="h-full"
                  >
                    <div className="p-8 h-full flex flex-col justify-between min-h-[220px]">
                      <Icon
                        className={`w-9 h-9 mb-7 ${f.accent} drop-shadow-[0_0_12px_currentColor] transition-transform duration-300 group-hover:scale-110`}
                      />
                      <div>
                        <h3 className="text-base font-semibold tracking-tight text-foreground mb-2">
                          {f.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <HowItWorks />

      {/* ══════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════ */}
      <section className="relative py-20 z-10">
        {/* Divider lines */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-px w-full bg-border mb-16" />

          <div
            ref={statsReveal.ref}
            className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={
                  statsReveal.isInView
                    ? { opacity: 1, y: 0 }
                    : {}
                }
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground">
                  <AnimatedCounter
                    target={s.target}
                    suffix={s.suffix}
                    duration={1600}
                  />
                </span>
                <span className="text-[11px] text-muted-foreground font-mono tracking-widest uppercase">
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="h-px w-full bg-border mt-16" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-36 z-10">
        <div ref={ctaReveal.ref} className="max-w-4xl mx-auto px-6 text-center">
          {/* Glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={ctaReveal.isInView ? "show" : "hidden"}
            className="relative z-10"
          >
            <motion.p
              variants={fadeUp}
              className="text-[10px] tracking-[0.2em] uppercase font-mono text-primary mb-5"
            >
              Get Started
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground mb-5"
            >
              Ready to trade
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
                with AI on your side?
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-base max-w-md mx-auto mb-10 leading-relaxed"
            >
              Connect your wallet, type what you want to swap, and let SwapMate
              handle the rest — no gas fee on Sepolia testnet.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link href="/app">
                <Button
                  size="lg"
                  className="rounded-full h-13 px-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_rgba(168,85,247,0.35)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(168,85,247,0.5)]"
                >
                  Start Trading Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/ruddypp/swapmate"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-13 px-8 text-sm border-white/10 hover:bg-white/5 bg-transparent backdrop-blur-sm transition-all"
                >
                  <GithubIcon className="mr-2 w-4 h-4" />
                  View on GitHub
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer className="relative border-t border-border z-10 bg-background/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                <img
                  src="/images/robot-avatar.png"
                  alt="SwapMate"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-bold tracking-tight">SwapMate</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              AI-powered token swaps on Uniswap v4. Sepolia testnet only.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              Links
            </p>
            {[
              { label: "Launch App", href: "/app" },
              {
                label: "Uniswap v4 Docs",
                href: "https://developers.uniswap.org/docs/sdks/v4/overview",
              },
              {
                label: "Sepolia Faucet",
                href: "/faucets",
              },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Tech stack */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              Built with
            </p>
            {["Next.js 16", "Uniswap v4 SDK", "Wagmi v3 + Viem", "Groq AI"].map(
              (t) => (
                <p key={t} className="text-xs text-muted-foreground">
                  {t}
                </p>
              )
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground/50">
              SwapMate AI © {new Date().getFullYear()} — Testnet environment. Not financial advice.
            </p>
            <p className="text-[11px] text-muted-foreground/40 font-mono">
              v0.1.0-beta
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
