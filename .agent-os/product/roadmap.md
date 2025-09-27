# Product Roadmap

## Phase 1: Core MVP (Low‑latency Speak‑Back)

**Goal:** Achieve consistent sub‑second TTFB and natural barge‑in with a minimal end‑to‑end pipeline.
**Success Criteria:** Avg TTFB < 900ms; stable barge‑in; artifact‑free TTS at 95%+ turns.

### Features

- [ ] Rust Axum WS gateway — bidirectional audio/text, correlation IDs `[M]`
- [ ] ElevenLabs TTS Flash v2.5 via raw WebSocket stream‑input + partial flush `[M]`
- [ ] EXP toggle for v3 alpha multi‑context streaming `[S]`
- [ ] Groq Whisper‑large‑v3‑turbo STT client with streaming and timestamps `[M]`
- [ ] VAD + heuristics turn‑end; basic barge‑in handling `[S]`
- [ ] Metrics: per‑turn TTFB, ASR confidence, TTS artifacts `[S]`
- [ ] Minimal demo UI (htmx) + audio worklet, latency overlays `[S]`

### Dependencies

- Groq API, ElevenLabs API, regional pinning

## Phase 2: Human‑Likeness Experiments

**Goal:** Reach natural overlap and conversational cadence approaching human norms.
**Success Criteria:** Evaluator human‑likeness score ≥ 8/10; reduced interruption collisions by 50%.

### Features

- [ ] ASD/diarization options (pyannote, Resemblyzer) for crosstalk policies `[M]`
- [ ] Prosody shaping (pause injection, micro‑backchannels, timing heuristics) `[S]`
- [ ] Strategy framework: half‑duplex, rapid‑duplex, overlap‑aware `[M]`
- [ ] A/B harness across strategies, with evaluator scoring `[S]`
- [ ] TTS model experiments: Flash vs Turbo vs v3 alpha `[S]`
- [ ] Human‑likeness metrics: overlap timing deltas, turn duration distributions `[S]`

### Dependencies

- HF models (pyannote et al.), evaluator rubric and scripts

## Phase 3: Scale & Polish

**Goal:** Robustness and operational excellence for teams.
**Success Criteria:** P99 TTFB < 1200ms under load; zero‑downtime deploys; complete dashboards.

### Features

- [ ] Observability: OpenTelemetry traces, Prometheus metrics, Grafana dashboards `[S]`
- [ ] Concurrency and backpressure controls; adaptive chunk sizes `[M]`
- [ ] Region and provider pinning strategies; failover `[M]`
- [ ] Safety/limits: rate limits, timeouts, transcript redaction `[S]`
- [ ] Content recording with artifact snapshots for QA `[S]`

### Dependencies

- CI/CD, infra automation, secret management

## Phase 4: Advanced Techniques

**Goal:** Push toward human‑level dialogue quality.
**Success Criteria:** Evaluator ≥ 9/10; user study parity with human baseline on cadence/prosody.

### Features

- [ ] Emotion/intent‑aware prosody hints into TTS `[M]`
- [ ] Multi‑speaker and interlocutor modeling `[M]`
- [ ] Predictive turn‑starts and anticipatory speaking `[L]`
- [ ] On‑device/edge STT/TTS options (quantized) `[L]`
- [ ] RLHF‑style tuning with evaluator feedback loops `[L]`

### Dependencies

- Additional HF/academic models, user study harness

## Effort Scale
- XS: 1 day
- S: 2–3 days
- M: 1 week
- L: 2 weeks
- XL: 3+ weeks

