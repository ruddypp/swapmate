# SwapMate — Project Submission Answers

---

Project Name: SwapMate

---

## Project Overview

SwapMate is a DeFi swap interface built on Uniswap v4, running on Ethereum Sepolia testnet. Instead of the usual form-based UI, users interact through a conversational AI assistant — you type what you want to trade, and the app handles the rest: fetching a live on-chain quote, scanning the route for risk, managing token approvals, and submitting the transaction.

AI is central to the product, not an add-on. It parses natural language into swap intents, adjusts slippage based on context, plans multi-token batch swaps from a single message, and analyzes wallet portfolios. A secondary system called the Hook Sentinel evaluates every quote before execution and can block a trade if it detects a guardrail breach — particularly relevant for Uniswap v4 where custom hook contracts can behave unexpectedly.

---

## Tech Stack & AI Integration

Frontend Framework: Next.js 16 (App Router)

AI Model / API Used: Groq API — openai/gpt-oss-120b

How AI is Integrated:

The AI assistant parses free-form user messages into structured JSON swap intents, which are used to prefill the swap form and trigger quote fetches automatically. For batch swaps, a single prompt like "split 0.5 ETH into USDC, UNI, and LINK" generates a full sequential swap plan.

The model also adjusts slippage dynamically based on urgency signals, trade size, and token volatility — the UI shows an "AI TUNED" badge when the default is overridden.

For portfolio analysis, live wallet balances are passed as context and the AI returns a risk assessment plus specific suggested swaps.

All responses stream token-by-token from a Next.js API route. Markdown is stripped client-side before display.

---

## Project Branding

Logo / Art: A robot avatar used in the navbar, hero section, AI chat header, and as the favicon.

Branding Notes:

The color palette is built around a single oklch purple as the primary accent on a near-black background. Dark mode only — no light mode variant. Typography uses Geist Sans and Geist Mono with small-caps monospace labels throughout, giving the interface a technical, instrument-like feel. The landing page features a Three.js WebGL ring animation in the hero and custom BorderGlow cards that react to cursor position.

---

## What Makes It Unique

Most swap interfaces require users to understand fee tiers, slippage tolerances, and approval flows upfront. SwapMate removes that friction — the AI controls the UI state directly from natural language input.

What separates this from a chatbot wrapper is depth: parsed intents prefill the form, trigger quotes, tune slippage, and on "execute" commands, proceed through the entire on-chain flow without additional user input beyond wallet confirmation.

The Hook Sentinel is specific to Uniswap v4 — it surfaces the risk of custom hook contracts to the user in a readable format and enforces automatic blocking when an unverified hook is detected. Most consumer tools ignore this entirely.
