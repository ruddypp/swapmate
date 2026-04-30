# SwapMate

An AI-native token swap interface built on Uniswap v4, running on Ethereum Sepolia testnet.

---

## What It Is

SwapMate replaces the traditional DeFi form UI with a conversational AI assistant. You describe what you want to do — "swap 0.1 ETH to USDC" or "split 0.5 ETH into USDC, UNI, and LINK" — and the system handles the execution: fetching a live on-chain quote, scanning the route for risk, managing Permit2 approvals, encoding Universal Router calldata, and submitting the transaction.

The AI is not a help widget. It directly controls UI state, sets slippage based on context, plans batch swap sequences, and analyzes wallet portfolios.

---

## Features

**Intent-Based Trading**
Parse natural language into structured swap operations. The AI fills the swap form, triggers quote fetches, and optionally proceeds to execution without additional user input.

**Batch Swap**
A single prompt like "diversify my ETH into three tokens" produces a sequential multi-swap plan that the system executes one transaction at a time.

**AI Hook Sentinel**
Every Uniswap v4 quote is evaluated before execution. The Sentinel checks price impact, slippage tolerance, and the presence of unverified custom hook contracts on the pool. Trades that breach configured guardrails are blocked automatically.

**Dynamic Slippage**
The AI adjusts slippage recommendations based on urgency signals, trade size, and token liquidity characteristics. The UI shows an "AI TUNED" indicator when the model has overridden the default.

**Portfolio Analysis**
Live Sepolia token balances are passed to the AI, which returns a risk level, concentration summary, and specific suggested swaps with pre-filled amounts.

**Swap History**
All executed swaps are persisted in localStorage with transaction hash, token pair, amounts, and status. No backend or database required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 |
| Blockchain | Sepolia testnet (chainId 11155111) |
| Protocol | Uniswap v4 — V4Quoter, Universal Router, Permit2 |
| Wallet | Reown AppKit + WagmiAdapter |
| Wagmi | v3 |
| Viem | v2 |
| AI | Groq API — openai/gpt-oss-120b |
| Animation | Framer Motion |
| UI | Shadcn/ui, TailwindCSS v4 |
| State | TanStack React Query v5 |

---

## Contract Addresses (Sepolia)

| Contract | Address |
|---|---|
| Pool Manager | 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543 |
| V4 Quoter | 0x61b3f2011a92d183c7dbadbda940a7555ccf9227 |
| Universal Router | 0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b |
| Permit2 | 0x000000000022D473030F116dDEE9F6B43aC78BA3 |

---

## Supported Tokens

ETH, WETH, USDC, UNI, LINK — all on Sepolia testnet.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
GROQ_API_KEY=                    # from console.groq.com
NEXT_PUBLIC_REOWN_PROJECT_ID=    # from cloud.reown.com
NEXT_PUBLIC_RPC_URL=             # Alchemy or Infura Sepolia endpoint
```

---

## Running Locally

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000. The /app route is the main trading interface.

---

## How the Swap Flow Works

1. User types intent in the AI Assistant panel
2. AI parses the message and outputs a JSON intent block
3. The intent prefills the swap form and triggers a quote from /api/swap/quote
4. The quote endpoint calls V4Quoter.quoteExactInputSingle across three fee tiers (500, 3000, 10000) and returns the first successful result
5. The Hook Sentinel evaluates the quote and returns a status: clear, caution, or blocked
6. If clear or caution, the user (or AI on auto-execute) proceeds
7. ERC20 to Permit2 and Permit2 to Universal Router approvals are checked and submitted if needed
8. Calldata is built using @uniswap/v4-sdk V4Planner and @uniswap/universal-router-sdk RoutePlanner
9. UniversalRouter.execute() is called with a 20-minute deadline
10. The confirmed swap record is written to localStorage

---

## Project Structure

```
app/
  page.tsx              landing page
  app/page.tsx          main trading dashboard
  api/ai/               AI chat streaming endpoint
  api/swap/quote/       on-chain quote endpoint
  api/swap/sentinel/    hook sentinel endpoint
  api/portfolio/        portfolio analysis endpoint

components/
  swap/SwapPanel.tsx    swap form and execution logic
  swap/SwapResultModal  quote display and execute button
  swap/SwapHistory      local swap history
  ai/AIAssistant.tsx    streaming chat panel
  portfolio/            portfolio UI components

lib/
  swap/quote.ts         V4Quoter integration
  swap/execute.ts       approval, calldata, and execution
  swap/sentinel.ts      guardrail evaluation engine
  portfolio/            balance fetching
  groq-client.ts        AI client and system prompt
```

---

## Deployment

The app is configured for Vercel. Set the environment variables in the Vercel project settings and deploy from the repository root. No build configuration changes are required beyond what is in next.config.ts.

---

## Notes

This project runs exclusively on Sepolia testnet. No real funds are involved. Token balances displayed in the portfolio view are Sepolia testnet values and carry no market value.

The Groq API key is a server-side secret and is never exposed to the browser.
