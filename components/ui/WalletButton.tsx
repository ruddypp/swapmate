"use client";

import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  if (isConnected && address) {
    return (
      <button
        onClick={() => open({ view: "Account" })}
        className="text-[11px] font-mono tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 border border-border px-3 py-1.5 rounded-sm hover:border-primary/30"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => open({ view: "Connect" })}
      className="text-[11px] tracking-widest uppercase font-medium rounded-sm border-border hover:border-primary/40 hover:text-primary transition-all duration-200"
      id="connect-wallet-btn"
    >
      Connect Wallet
    </Button>
  );
}
