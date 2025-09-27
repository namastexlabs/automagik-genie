# Automagik Hello

Ultra-low latency, human-like voice conversation framework built in Rust.

## Vision

Build the fastest, most natural voice conversation stack by learning from 150+ production conversations and implementing proven patterns.

## Key Insights from Production Data

- **26.8% failure rate** in current production systems
- **"None" response cascades** destroy user trust
- **Turn-taking collisions** break natural flow
- **Latency perception** matters more than actual latency

## Core Features

- **Sub-300ms TTFB** with ElevenLabs Flash v2.5
- **Natural turn-taking** with UltraVAD for human-like interruptions
- **Fallback resilience** preventing "None" response cascades
- **ElevenLabs Agents WebSocket compatible** drop-in replacement
- **Production metrics** matching ElevenLabs conversation API schema

## Technical Stack

- **Runtime**: Rust (Tokio/Axum) for predictable latency
- **TTS**: ElevenLabs Flash v2.5 (75ms inference) via WebSocket
- **STT**: Groq Whisper-large-v3-turbo (100-150ms)
- **VAD**: WebRTC baseline, UltraVAD planned
- **Region**: Brazil-first (sa-east-1) deployment

## Documentation

- [Product Mission](.agent-os/product/mission.md) - Why we're building this
- [Technical Stack](.agent-os/product/tech-stack.md) - Technology choices
- [Roadmap](.agent-os/product/roadmap.md) - Development phases
- [Environment Config](.agent-os/product/environment.md) - All configuration options
- [Production Insights](docs/elevenlabs/production-insights.md) - Learnings from real data
- [Research Notes](research.md) - Architecture decisions and evidence

## Current Status

**Phase 0: Proof of Concept** - Building initial pipeline with production learnings integrated

## Repository Structure

```
.agent-os/product/       # Product documentation
docs/                    # Technical documentation
experiments/AH-XXX/      # Experiment tracking
research.md              # Architecture research
CLAUDE.md               # AI assistant guidelines
```

## Submodules (Vendors)

- `vendors/livekit-agents` — LiveKit Agents (Python) examples and SDK
- `vendors/hume-evi-next-js-starter` — Hume EVI Next.js starter
- `vendors/swift` — Swift (Next.js) voice UI

Update your checkout:

```
git submodule update --init --recursive
```

## Key Metrics

| Metric | Target | Current Production |
|--------|--------|-------------------|
| TTFB | < 300ms | Variable/High |
| Failure Rate | < 10% | 26.8% |
| "None" Responses | < 1% | ~16% in failures |
| ASR Confidence | > 0.8 | < 0.7 causes failures |

## Philosophy

Learn from production failures to build better from day one. Every architectural decision is informed by real-world data from 150+ conversations.
