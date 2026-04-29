"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppKitAccount } from "@reown/appkit/react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AIMessage, ParsedSwapIntent, QuoteResult, BatchSwapIntent, BatchSwapItem } from "@/lib/swap/types";
import type { Token } from "@/lib/swap/types";

interface AIAssistantProps {
  onSwapIntent?: (intent: ParsedSwapIntent) => void;
  onBatchSwapIntent?: (batch: BatchSwapIntent) => void;
  quoteContext?: {
    tokenIn?: Token;
    tokenOut?: Token;
    amountIn?: string;
    quote?: QuoteResult | null;
  };
}

function parseIntent(text: string): ParsedSwapIntent | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*"intent"[\s\S]*\}/i);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const intentValue = (parsed.intent || parsed.Intent)?.toLowerCase();
      if (intentValue === "swap") {
        return {
          tokenIn: parsed.tokenIn || parsed.TokenIn,
          tokenOut: parsed.tokenOut || parsed.TokenOut,
          amount: parsed.amount || parsed.Amount,
          slippage: parsed.slippage || parsed.Slippage,
          slippageBps: parsed.slippageBps,
          riskNote: parsed.riskNote,
          action: (parsed.action || parsed.Action)?.toLowerCase()
        };
      }
    }
  } catch {}
  return null;
}

function parseBatchIntent(text: string): BatchSwapIntent | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*"intent"[\s\S]*\}/i);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const intentValue = (parsed.intent || parsed.Intent)?.toLowerCase();
      if (intentValue === "batch_swap" && Array.isArray(parsed.swaps)) {
        const swaps: BatchSwapItem[] = parsed.swaps.map((s: ParsedSwapIntent, i: number) => ({
          ...s,
          id: `batch-${Date.now()}-${i}`,
          status: "pending" as const,
        }));
        return { swaps };
      }
    }
  } catch {}
  return null;
}

function MessageBubble({ msg }: { msg: AIMessage }) {
  const isUser = msg.role === "user";

  // Strip JSON blocks (with or without markdown) from display
  const displayContent = msg.content
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/\{[\s\S]*"intent"[\s\S]*\}/i, "")
    .trim();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono">
        {isUser ? "You" : "SwapMate AI"}
      </p>
      <div
        className={`max-w-[90%] px-3.5 py-2.5 rounded-md text-[13px] leading-relaxed whitespace-pre-wrap break-words [word-break:break-word] shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-muted/60 text-foreground border border-border/50 rounded-tl-none"
        }`}
      >
        {displayContent || "..."}
      </div>
    </motion.div>
  );
}

export function AIAssistant({ onSwapIntent, onBatchSwapIntent, quoteContext }: AIAssistantProps) {
  const { isConnected } = useAppKitAccount();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "I can help you swap tokens on Uniswap v4 Sepolia. Try: \"swap 0.1 ETH to USDC\" or ask me about price impact, slippage, or how swaps work.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When quote context changes, auto-trigger AI analysis
  useEffect(() => {
    if (!quoteContext?.quote) return;
    const { tokenIn, tokenOut, amountIn, quote } = quoteContext;
    if (!tokenIn || !tokenOut || !amountIn) return;

    const analysisMsg = `Quote received: ${amountIn} ${tokenIn.symbol} → analyze this quote for me.`;
    sendMessage(analysisMsg, quoteContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteContext?.quote]);

  async function sendMessage(
    text: string,
    ctx?: AIAssistantProps["quoteContext"]
  ) {
    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const historyForApi = [
      ...messages.filter((m) => m.id !== "init"),
      userMsg,
    ].map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
    ]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          context: ctx ?? quoteContext,
        }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      // Simulate a typing delay for smoother UI experience
      let currentText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        currentText += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: currentText } : m
          )
        );
      }
      
      fullText = currentText;

      // Try to parse batch swap intent first, then single swap
      const batchIntent = parseBatchIntent(fullText);
      if (batchIntent && onBatchSwapIntent) {
        onBatchSwapIntent(batchIntent);
      } else {
        const intent = parseIntent(fullText);
        if (intent && onSwapIntent) {
          onSwapIntent(intent);
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        sendMessage(input.trim());
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/5">
        <div className="flex items-center gap-3.5">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className={`absolute -inset-1 bg-primary/30 rounded-full blur-md transition-opacity duration-700 ${isStreaming ? "opacity-100" : "opacity-0"}`} />
            <img 
              src="/images/robot-avatar.png" 
              alt="SwapMate AI Mascot" 
              className="w-10 h-10 rounded-full object-cover border border-border/50 relative z-10 shadow-sm bg-card" 
            />
          </motion.div>
          <div className="flex flex-col">
            <h2 className="text-[13px] font-semibold tracking-wide text-foreground flex items-center gap-2">
              SwapMate AI
              <div className="flex h-2 w-2 relative">
                {isStreaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-500 ${isStreaming ? "bg-primary" : "bg-muted-foreground/30"}`}></span>
              </div>
            </h2>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">
              {isStreaming ? "Thinking..." : "Ready to help"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 space-y-6 min-h-0 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-1.5 items-start"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono">SwapMate AI</p>
              <div className="px-4 py-3.5 rounded-md bg-muted/60 border border-border/50 rounded-tl-none flex items-center gap-1.5">
                <motion.div className="w-1.5 h-1.5 bg-primary/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-primary/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-primary/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} className="h-2" />
      </div>

      <Separator className="opacity-50" />

      {/* Input */}
      <div className="p-3 space-y-2">
        <Textarea
          ref={textareaRef}
          id="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isConnected
              ? 'Try "swap 0.5 ETH to USDC" or ask a question...'
              : "Connect your wallet to get started..."
          }
          disabled={isStreaming || !isConnected}
          rows={2}
          className="resize-none text-sm rounded-sm border-border focus:border-primary/40 bg-muted/30 placeholder:text-muted-foreground/50 transition-colors"
        />
        <Button
          id="ai-send-btn"
          size="sm"
          onClick={() => input.trim() && sendMessage(input.trim())}
          disabled={isStreaming || !input.trim() || !isConnected}
          className="w-full rounded-sm uppercase tracking-widest text-[10px] font-medium bg-primary hover:bg-primary/90 transition-all duration-200"
        >
          {isStreaming ? "Thinking..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
