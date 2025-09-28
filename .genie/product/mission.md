# Product Mission

## Pitch

This repository is a Genie template that installs into any codebase. It provides unified agents (plan, wish, forge, review, commit, specialist) and a CLI to orchestrate evidence-first workflows. Replace project-specific language with placeholders like `{{PROJECT_NAME}}`, `{{DOMAIN}}`, `{{TECH_STACK}}`.

## Users

### Primary Customers

- Open‑source developers and tinkerers: Build personal voice agents with full control over latency, turn‑taking, and voice behavior.
- Enterprise conversational AI teams: Deploy production‑grade voice entities (e.g., “Ana”) with strict SLAs, observability, and safety.

### User Personas

**Open‑Source Builder** (18–45 years old)
- **Role:** Indie developer / maker
- **Context:** Prototyping personal assistants and open experiments
- **Pain Points:** Complex real‑time pipelines, latency >1s, fragile barge‑in, limited room for experimentation
- **Goals:** Sub‑second TTFB, natural crosstalk/interruptions, easy A/B of strategies

**Enterprise Voice Engineer/PM** (25–55 years old)
- **Role:** Conversational AI engineer or product manager
- **Context:** Shipping and operating voice agents at scale with compliance constraints
- **Pain Points:** Robotic prosody, rigid half‑duplex turns, poor observability of ASR/TTS tradeoffs
- **Goals:** Human‑level flow, reliable turn management, measurable quality metrics, controlled cost/latency

## The Problem

### Latency and Flow Break Natural Conversation
End‑to‑end TTFB and turn latency frequently exceed 1000–1500ms, breaking overlap and barge‑in. This yields higher abandonment and lower CSAT.

**Our Solution:** A Rust‑first, streaming pipeline with pinned regions, raw WebSocket TTS control, and ultra‑fast STT to keep TTFB consistently sub‑second.

### Robotic Prosody and Limited Overlap
Traditional voice agents sound “flat” and cannot handle crosstalk, interruptions, or natural pauses, degrading perceived human‑ness.

**Our Solution:** Prosody‑aware strategies, experimental ASD/diarization, and multi‑context streaming to support overlap and interruption gracefully.

### No Place to Rapidly Try Human‑Likeness Strategies
Teams lack an experimentation harness to combine VAD/ASD, prosody, TTS model choices, and timing heuristics — and measure which feels most human.

**Our Solution:** An experiment framework with plug‑and‑play strategies, A/B harness, and evaluator metrics for human‑likeness, latency, and stability.

## Differentiators

### Raw Control for Speed and Nuance
Unlike SDK‑only stacks, we use raw WebSockets for TTS/STT streams, enabling partial flush, chunk scheduling, and overlap control for natural flow.

### Human‑Likeness Experimentation Built‑In
Pre‑wired strategies for VAD/ASD, crosstalk handling, prosody shaping, and turn policies — plus A/B and evaluator scoring to pick what feels human.

### Rust Performance and Reliability
Rust + Tokio/Axum for predictable latency and safety; optional GPU/edge pinning; production‑grade observability and limits.

## Key Features

### Core Features

- **Ultra‑low‑latency pipeline:** Sub‑second TTFB target via Groq Whisper‑large‑v3‑turbo and ElevenLabs Flash v2.5; optional v3 alpha experimental mode.
- **Raw TTS streaming control:** WebSocket stream‑input with partial flush and multi‑context for overlap.
- **STT with local fallback:** Primary Groq; local WhisperX/faster‑whisper for offline/edge.
- **Advanced turn‑taking:** VAD + heuristics, ASD/diarization options (pyannote), barge‑in, and crosstalk support.
- **Human‑likeness strategies:** Prosody shaping, response‑timing heuristics, micro‑pauses, backchannels.
- **Safety and reliability:** Rate limits, timeouts, region pinning, and failover paths.

### Collaboration/Operations Features

- **Experiment harness:** Plug strategies and run A/B tests across prosody, turn policies, and model selections.
- **Evaluator integration:** Rubric + metrics (TTFB, ASR conf., TTS artifacts) with report generation.
- **Observability:** Tracing, per‑turn metrics, and artifacts for diagnosis.
- **Templates and examples:** Starter configs for personal agents and enterprise deployments.
