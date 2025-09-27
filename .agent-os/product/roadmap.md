# Product Roadmap: Build-in-Public Strategy

## 🚀 Phase 0: Proof of Concept (Week 1-2)

**Goal:** Validate core technical feasibility and baseline performance.
**Success Criteria:** Working end-to-end pipeline with < 1s TTFB.
**Public Milestone:** "Day 1: First successful voice conversation"

### Features
- [x] Basic WebSocket server (Rust/Axum) `[XS]`
- [ ] ElevenLabs TTS integration (Flash v2.5) `[S]`
- [ ] Groq Whisper STT integration `[S]`
- [ ] Simple VAD with WebRTC `[XS]`
- [ ] Raw session logging for analysis `[XS]`
- [ ] Metrics collection (TTFB, ASR confidence per ElevenLabs schema) `[XS]`
- [ ] CLI test harness `[XS]`

### Build-in-Public
- [ ] Twitter/X thread: "Building the fastest voice agent from scratch"
- [ ] GitHub repo public from day 1
- [ ] Daily progress videos showing latency improvements

## 🔎 Parallel Track: LiveKit Agents Recon (Weeks 1-3)

Goal: Learn from LiveKit Agents to accelerate our design while keeping a Rust-first runtime.

Success Criteria:
- Run LiveKit voice quickstart end-to-end and document timing (TTFB, barge-in cancel latency, overlap cadence)
- Identify 3–5 concrete patterns to port (turn detection, interruption handling, pipeline orchestration, worker/job model)
- Produce a migration note outlining how to mirror Agents WS semantics in our Axum/Tokio stack

Tasks
- [x] Add submodule: `vendors/livekit-agents`
- [x] Add submodule: `vendors/hume-evi-next-js-starter`
- [ ] Read: Agents Worker lifecycle, Voice AI quickstart, examples/voice_agents/*
- [ ] Benchmark: TTFB and cancel-tail latency using provided examples
- [ ] Compare: LiveKit turn model vs our VAD+heuristics; draft overlap_aware policy deltas
- [ ] Draft: "Rust parity plan" mapping Agents abstractions → Tokio/Axum components

Risk & Lock-in Notes
- Keep our hot path in Rust; do not depend on Python workers for production
- Treat Agents as a reference protocol/abstractions; mirror where compatible (WS semantics, events)
- Ensure local/offline fallbacks (WhisperX/faster-whisper, local TTS) remain first-class

## 🎯 Phase 1: Minimal Viable Product (Week 3-6)

**Goal:** Achieve production-ready latency and basic ElevenLabs compatibility.
**Success Criteria:** < 200ms TTS TTFB, < 300ms ASR latency, stable WebSocket protocol.
**Public Milestone:** "Open-source ElevenLabs-compatible voice server"

### Core Pipeline
- [ ] Full ElevenLabs WebSocket protocol implementation `[M]`
- [ ] Transcript schema compatibility (docs/transcript-schema.md) `[S]`
- [ ] AG-UI event streaming integration `[M]`
- [ ] Activity events for mid-run progress `[S]`
- [ ] Session serialization and replay `[S]`
- [ ] Interrupt-aware lifecycle (barge-in) `[M]`
- [ ] Basic metrics collection (TTFB, latency, confidence) `[S]`
- [ ] Fallback response system (prevent "None" cascades observed in production) `[S]`

### Developer Experience
- [ ] Docker compose setup `[S]`
- [ ] Environment configuration (docs/environment.md) `[XS]`
- [ ] Basic demo UI with AudioWorklet `[S]`
- [ ] Quick-start guide and examples `[S]`

### Build-in-Public
- [ ] Blog post: "How we achieved < 200ms voice latency"
- [ ] YouTube demo: Real-time conversation with metrics overlay
- [ ] Hacker News launch: "Show HN: Open-source voice agent with sub-200ms latency"

## 🔬 Phase 2: AG-UI Experimentation (Week 7-10)

**Goal:** Leverage AG-UI for human-like conversational experiences.
**Success Criteria:** Extract and analyze 100+ conversation sessions, identify optimization patterns.
**Public Milestone:** "Teaching AI to talk like humans"

### AG-UI Integration
- [ ] Full AG-UI transfer protocol implementation `[M]`
- [ ] Activity events for STT/TTS/LLM progress `[S]`
- [ ] Raw session log extraction APIs `[S]`
- [ ] Conversation replay system `[M]`
- [ ] A/B testing framework with AG-UI events `[M]`

### Human-Likeness Experiments
- [ ] Overlap strategies (repair-first vs continuity-first) `[M]`
- [ ] Micro-backchannel injection ("mm-hmm", "certo" for pt-BR) `[S]`
- [ ] Prosody shaping with pause patterns `[S]`
- [ ] **UltraVAD integration** for natural turn-taking `[M]` 🔥
- [ ] **Ultravox exploration** for end-to-end speech LLM `[L]` 🔥
- [ ] VAD model comparison (WebRTC vs UltraVAD vs pyannote) `[M]`
- [ ] Hybrid approach: UltraVAD + Ultravox pipeline `[L]`
- [ ] Connection quality perception monitoring (production insight) `[S]`

### Analytics Pipeline
- [ ] Session recording with timing data `[S]`
- [ ] Automated metric extraction `[S]`
- [ ] Human-likeness scoring rubric `[S]`
- [ ] Performance regression detection `[S]`

### Build-in-Public
- [ ] Weekly metrics dashboard updates
- [ ] Open dataset: 100 annotated conversations
- [ ] Community challenge: "Beat our latency benchmark"
- [ ] Technical deep-dive: "AG-UI protocol for voice agents"

## 🎨 Phase 3: Management Plane (Week 11-14)

**Goal:** Full ElevenLabs API compatibility for enterprise adoption.
**Success Criteria:** 100% API coverage, multi-tenant support, production stability.
**Public Milestone:** "Enterprise-ready voice platform"

### Management APIs
- [ ] Agent CRUD operations (REST API) `[M]`
- [ ] Agent versioning and snapshots `[S]`
- [ ] Conversation management APIs `[M]`
- [ ] Knowledge base and RAG support `[M]`
- [ ] Tool management (client/server/system) `[M]`
- [ ] Test suite management `[S]`
- [ ] Webhook delivery system `[S]`

### Infrastructure
- [ ] PostgreSQL metadata store `[M]`
- [ ] Redis session cache `[S]`
- [ ] S3-compatible audio storage `[S]`
- [ ] Multi-tenant isolation `[M]`
- [ ] Rate limiting and quotas `[S]`

### Build-in-Public
- [ ] Partnership announcements
- [ ] Enterprise pilot case studies
- [ ] API documentation site launch
- [ ] Community SDK contributions

## 🌍 Phase 4: Public Launch (Week 15-18)

**Goal:** General availability with cloud offering and self-host options.
**Success Criteria:** 1000+ developers, 10k+ daily conversations, < 100ms P50 latency.
**Public Milestone:** "The world's fastest open-source voice platform"

### Production Features
- [ ] Global edge deployment (multi-region) `[L]`
- [ ] Auto-scaling and load balancing `[M]`
- [ ] Observability (OpenTelemetry, Grafana) `[M]`
- [ ] Zero-downtime deployments `[M]`
- [ ] Backup and disaster recovery `[M]`

### Developer Ecosystem
- [ ] Official SDKs (Python, JS/TS, Go, Rust) `[L]`
- [ ] Terraform modules `[M]`
- [ ] Kubernetes operators `[M]`
- [ ] Integration templates (Twilio, Vonage, etc.) `[M]`
- [ ] Community marketplace for agents `[L]`

### Advanced Features
- [ ] Multi-voice support `[M]`
- [ ] Language auto-detection `[S]`
- [ ] Custom LLM endpoints `[M]`
- [ ] MCP (Model Context Protocol) `[S]`
- [ ] Batch calling orchestration `[M]`

### Build-in-Public
- [ ] ProductHunt launch
- [ ] Open-source sustainability model announcement
- [ ] Conference talks and demos
- [ ] "Voice Agent Cookbook" publication

## 🚀 Phase 5: Beyond Human Parity (Month 6+)

**Goal:** Push boundaries of voice interaction technology.
**Success Criteria:** Evaluator score ≥ 9/10, indistinguishable from human conversation.
**Public Milestone:** "AI that sounds more human than humans"

### Research & Innovation
- [ ] Emotion-aware prosody generation `[L]`
- [ ] Predictive speaking (anticipatory responses) `[L]`
- [ ] Multi-party conversation support `[XL]`
- [ ] On-device inference options `[L]`
- [ ] RLHF fine-tuning pipeline `[XL]`
- [ ] Neural codec integration `[L]`

### Platform Evolution
- [ ] Visual workflow builder `[XL]`
- [ ] Success evaluation analytics `[M]`
- [ ] Compliance features (GDPR, HIPAA) `[L]`
- [ ] White-label solutions `[L]`
- [ ] Voice cloning integration `[M]`

### Build-in-Public
- [ ] Research paper publications
- [ ] Open benchmark suite
- [ ] Annual community conference
- [ ] Innovation challenges with prizes

## Build-in-Public Strategy

### Weekly Cadence
- **Monday**: Architecture decision posts
- **Wednesday**: Performance metrics update
- **Friday**: Demo video or code walkthrough

### Content Channels
- **GitHub**: All code, issues, discussions
- **Twitter/X**: Daily updates, metrics screenshots
- **YouTube**: Weekly demos, technical deep-dives
- **Blog**: Detailed technical posts, learnings
- **Discord**: Community chat, real-time support

### Success Metrics
- GitHub stars progression
- Community contributors
- Production deployments
- Latency benchmarks
- User testimonials

### Key Milestones Timeline
- Week 2: First voice conversation
- Week 6: MVP with < 200ms latency
- Week 10: 100 conversations dataset
- Week 14: Enterprise API launch
- Week 18: Public cloud offering
- Month 6: Human parity achieved

## ☎️ Phase 6: Telephony (SIP) Integration (Post-GA)

Goal: Add reliable PSTN connectivity via SIP with agent handoff while preserving low-latency agent behavior.

Success Criteria:
- Inbound calls route to rooms via SIP dispatch rules; agent auto-dispatch joins within < 150 ms.
- DTMF support for IVR-like navigation; event mapping to our WS/strategy layer.
- Warm/cold transfer flows working end-to-end with contextual summaries.

Scope (informed by LiveKit docs)
- SIP trunking: inbound/outbound trunks; secure trunking; HD voice.
- Dispatch rules: map DID → room naming + explicit agent dispatch metadata.
- SIP participant: bridge PSTN audio to room; surface DTMF events.
- Transfers: agent-assisted warm transfer; cold transfer; return-to-agent on failure.

Tasks
- [ ] Evaluate using LiveKit SIP service vs. building minimal bridge `[M]`
- [ ] Implement dispatch rule mapping → room + agent dispatch `[S]`
- [ ] Inbound trunk quickstart (provider: Twilio/Telnyx) `[S]`
- [ ] Outbound dialing from agent tools (click-to-call) `[S]`
- [ ] DTMF → tool events; IVR policy scaffolding `[S]`
- [ ] Warm transfer workflow: supervisor consult + merge `[M]`
- [ ] Cold transfer workflow `[S]`
- [ ] Monitoring and retries (carrier errors) `[S]`

References (local archive)
- docs/livekit/all/sip/dispatch-rule.md
- docs/livekit/all/sip/trunk-inbound.md, trunk-outbound.md, secure-trunking.md
- docs/livekit/all/sip/dtmf.md, sip-participant.md
- docs/livekit/all/sip/transfer-warm.md, transfer-cold.md
- docs/livekit/all/sip/accepting-calls.md, making-calls.md, outbound-calls.md

## Technical Effort Scale
- **XS**: < 1 day
- **S**: 2-3 days
- **M**: 1 week
- **L**: 2 weeks
- **XL**: 3+ weeks

## Dependencies by Phase

### Phase 0-1
- ElevenLabs API key
- Groq API key
- Basic cloud infrastructure

### Phase 2-3
- PostgreSQL, Redis
- S3-compatible storage
- CI/CD pipeline

### Phase 4-5
- Multi-region infrastructure
- CDN for edge deployment
- ML training infrastructure
