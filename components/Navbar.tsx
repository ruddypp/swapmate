"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/ui/WalletButton";

interface NavbarProps {
  isApp?: boolean;
  activeTab?: "swap" | "history";
  setActiveTab?: (tab: "swap" | "history") => void;
  className?: string;
}

export function Navbar({ isApp = false, activeTab, setActiveTab, className = "" }: NavbarProps) {
  const content = (
    <>
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shadow-lg shadow-primary/20 flex-shrink-0">
            <img src="/images/robot-avatar.png" alt="SwapMate Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-foreground">
              SwapMate
            </span>
            <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase mt-0.5">
              Sepolia Testnet
            </span>
          </div>
        </Link>
        
        {isApp && setActiveTab && (
          <>
            <Separator orientation="vertical" className="h-5 hidden md:block" />
            <nav className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setActiveTab("swap")}
                className={`text-[11px] tracking-widest uppercase transition-colors duration-150 ${
                  activeTab === "swap"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Swap
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`text-[11px] tracking-widest uppercase transition-colors duration-150 ${
                  activeTab === "history"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                History
              </button>
            </nav>
          </>
        )}
      </div>

      <div>
        {isApp ? (
          <WalletButton />
        ) : (
          <Link href="/app">
            <Button className="rounded-full px-6 font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-white text-black hover:bg-white/90">
              Launch App
            </Button>
          </Link>
        )}
      </div>
    </>
  );

  if (isApp) {
    return (
      <header className={`border-b border-border px-6 py-4 flex items-center justify-between relative z-10 bg-background/80 backdrop-blur-sm ${className}`}>
        {content}
      </header>
    );
  }

  // Landing page uses a fixed navbar
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border ${className}`}
    >
      {content}
    </motion.nav>
  );
}
