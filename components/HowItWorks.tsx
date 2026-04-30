"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";
import {
  Wallet,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    value: "connect",
    label: "Connect",
    icon: Wallet,
    number: "01",
    title: "Connect Your Wallet",
    description:
      "Click 'Launch App' and connect your wallet via MetaMask, WalletConnect, or any EVM-compatible wallet through Reown AppKit. SwapMate runs on Sepolia testnet — no real funds required.",
    bullets: [
      "Supports MetaMask, Coinbase Wallet, WalletConnect",
      "Sepolia testnet — get free ETH from a faucet",
      "No sign-up, no email, self-custodial",
    ],
    color: "from-violet-500/20 to-purple-500/5",
    accent: "text-violet-400",
    dotColor: "bg-violet-500",
  },
  {
    value: "talk",
    label: "Talk to AI",
    icon: MessageSquare,
    number: "02",
    title: "Tell the AI What You Want",
    description:
      "Type your intent in plain English — SwapMate AI understands context and fills in the swap form for you. No need to manually select tokens or compute amounts.",
    bullets: [
      '"Swap 0.1 ETH to USDC" → instant prefill',
      '"Split 0.5 ETH evenly into USDC, UNI, LINK" → batch swap',
      "AI dynamically adjusts slippage for safety",
    ],
    color: "from-indigo-500/20 to-blue-500/5",
    accent: "text-indigo-400",
    dotColor: "bg-indigo-500",
  },
  {
    value: "review",
    label: "Review Quote",
    icon: ShieldCheck,
    number: "03",
    title: "Review Quote & Hook Sentinel",
    description:
      "Before any execution, SwapMate fetches a live on-chain quote from Uniswap v4 and runs the AI Hook Sentinel to scan for price impact, slippage risk, and custom hook dangers.",
    bullets: [
      "Live quote via V4Quoter (3 fee tiers tried automatically)",
      "Hook Sentinel flags: clear / caution / blocked",
      "See price impact, gas estimate, min received",
    ],
    color: "from-pink-500/20 to-rose-500/5",
    accent: "text-pink-400",
    dotColor: "bg-pink-500",
  },
  {
    value: "execute",
    label: "Execute",
    icon: Zap,
    number: "04",
    title: "Execute with One Click",
    description:
      "Click Execute and SwapMate handles the entire on-chain flow — ERC20 → Permit2 approvals, calldata encoding via V4 SDK, and Universal Router execution.",
    bullets: [
      "Auto Permit2 approval (30-day, one-time)",
      "V4Planner: SWAP_EXACT_IN_SINGLE + SETTLE_ALL + TAKE_ALL",
      "Transaction saved to history automatically",
    ],
    color: "from-emerald-500/20 to-teal-500/5",
    accent: "text-emerald-400",
    dotColor: "bg-emerald-500",
  },
];

const stepVariants: Variants = {
  enter: { opacity: 0, y: 16, filter: "blur(4px)" },
  center: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    transition: { duration: 0.25 },
  },
};

export function HowItWorks() {
  const [active, setActive] = useState("connect");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" as `${number}px` });

  const activeStep = STEPS.find((s) => s.value === active)!;

  return (
    <section ref={ref} className="relative py-24 md:py-36 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <p className="text-[10px] tracking-[0.2em] uppercase font-mono text-primary mb-4">
            How It Works
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-foreground mb-4">
            Trading in 4 simple steps
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            From wallet connection to confirmed on-chain swap — SwapMate
            handles the complexity so you don&apos;t have to.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Manual tab triggers (base-ui Tabs uses different API) */}
          <div className="w-full bg-muted/20 border border-border rounded-xl p-1 grid grid-cols-4 gap-1 mb-8">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = active === step.value;
              return (
                <button
                  key={step.value}
                  onClick={() => setActive(step.value)}
                  className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-muted/60 text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  <span
                    className={`text-[9px] font-mono tracking-widest ${isActive ? "text-primary" : "text-muted-foreground/50"}`}
                  >
                    {step.number}
                  </span>
                  <Icon
                    className={`w-4 h-4 transition-colors ${isActive ? step.accent : ""}`}
                  />
                  <span className="text-[10px] font-medium tracking-wide hidden sm:block">
                    {step.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step content with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div
                className={`rounded-2xl border border-border bg-gradient-to-br ${activeStep.color} backdrop-blur-sm p-8 md:p-10`}
              >
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Left: Text */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className={`w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center ${activeStep.accent}`}
                      >
                        <activeStep.icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-mono tracking-widest uppercase ${activeStep.accent} opacity-70`}
                      >
                        Step {activeStep.number}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                      {activeStep.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {activeStep.description}
                    </p>
                    <ul className="space-y-2.5">
                      {activeStep.bullets.map((b, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <ArrowRight
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activeStep.accent}`}
                          />
                          <span>{b}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: Visual mockup */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-full max-w-[280px] mx-auto">
                      <StepVisual
                        step={active}
                        accent={activeStep.accent}
                        dotColor={activeStep.dotColor}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {STEPS.map((step) => (
            <button
              key={step.value}
              onClick={() => setActive(step.value)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active === step.value
                  ? "w-8 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Go to step ${step.label}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Minimal UI mockups per step ─────────────────────────────────────────────

function StepVisual({
  step,
  accent,
  dotColor,
}: {
  step: string;
  accent: string;
  dotColor: string;
}) {
  if (step === "connect") {
    return (
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 space-y-3">
        <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
          Connect Wallet
        </p>
        {["MetaMask", "WalletConnect", "Coinbase Wallet"].map((w, i) => (
          <motion.div
            key={w}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span className="text-sm font-medium text-foreground">{w}</span>
          </motion.div>
        ))}
      </div>
    );
  }
  if (step === "talk") {
    return (
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 space-y-3">
        <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
          AI Assistant
        </p>
        <div className="space-y-2">
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-lg rounded-tr-none max-w-[180px]">
              swap 0.1 ETH to USDC
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-start"
          >
            <div className="bg-muted/60 border border-border text-xs px-3 py-2 rounded-lg rounded-tl-none max-w-[200px] text-foreground">
              Swap intent parsed. Prefilling form with 0.1 ETH → USDC, slippage
              0.5%.
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
  if (step === "review") {
    const checks = [
      { label: "Hook", value: "No custom hook", state: "pass" },
      { label: "Price Impact", value: "0.05%", state: "pass" },
      { label: "Slippage", value: "0.5%", state: "pass" },
    ];
    return (
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 space-y-3">
        <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
          Hook Sentinel — Safe to execute
        </p>
        {checks.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between text-xs p-2 rounded border border-border bg-muted/20"
          >
            <span className="text-muted-foreground">{c.label}</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              {c.value}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }
  // execute
  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-5 space-y-3">
      <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
        Execution
      </p>
      {[
        "Permit2 Approval",
        "Building calldata",
        "Sending transaction",
        "Confirmed on-chain",
      ].map((label, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-2.5 text-xs"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.15 + 0.1, type: "spring", stiffness: 300 }}
            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${dotColor} bg-opacity-20`}
          >
            <span className={`text-[8px] ${accent}`}>✓</span>
          </motion.div>
          <span className="text-foreground">{label}</span>
        </motion.div>
      ))}
    </div>
  );
}
