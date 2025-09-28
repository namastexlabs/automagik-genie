# Product Planning Session Context (Template)

Purpose
- Keep session context, auto‑context references, and the Discovery → Implementation → Verification scaffold outside of command files.
- Source of truth for ongoing planning sessions triggered by `.claude/commands/plan-product.md`.

Decision Baseline
- Decision: LEARN_FROM LiveKit Agents (build in-house Rust pipeline; mirror ElevenLabs Agents WS protocol; no framework adoption)
- Rationale: Latency/control, Rust‑first hot path, protocol compatibility, avoid lock‑in
- Decision doc: @.agent-os/product/decisions/2025-09-learn-from-livekit.md

Auto‑Context
- Mission: @.agent-os/product/mission.md
- Tech stack: @.agent-os/product/tech-stack.md
- Roadmap: @.agent-os/product/roadmap.md
- Research notes: @docs/research.md
- Evaluator rubric/templates (optional): @.genie/agents/evaluator.md
- Experiment artifacts (when present): @experiments/AH-001/qa/transcript_raw.txt, @experiments/AH-001/qa/metrics.json

Discovery
- Target protocol: ElevenLabs Agents WS schema (user_transcript, agent_response, audio, agent_response_correction, ping)
- LiveKit → Rust mapping: turn detection, interruption, streaming STT/LLM/TTS, worker lifecycle
- Environments/regions: ELEVENLABS_API_KEY, GROQ_API_KEY; region pinning; model defaults
- Success boundaries and gates: see “Gating Criteria” in decision doc

Implementation
- Phase 0: WS echo spike (Axum/Tokio) to prove audio I/O and baseline TTFB
- Phase 1: Streaming clients
  - Groq STT async client with partial/final transcripts
  - ElevenLabs TTS WS client: flush, keepalive, chunk streaming
- Phase 2: Session engine
  - AgentSession state (Idle/Listening/Thinking/Speaking)
  - VAD-based turn detection (300–500ms silence), barge‑in, false‑interruption resume
  - LLM streaming and TTS orchestration; tail‑cancel on interrupt
- Phase 3: Protocol fidelity
  - Emit ElevenLabs‑compatible JSON events; validate with existing clients unchanged
- Phase 4: Tuning and metrics
  - Overlap‑aware policy; micro‑pauses/backchannels; structured logs; per‑turn metrics

Verification
- Success criteria
  - TTFB < 200ms P50, P99 < 300ms
  - Interruption tail < 100ms; false‑interruption resume ≤ 2s
  - Protocol parity: clients work unchanged
  - Evaluator human‑likeness ≥ 8/10; ASR confidence > 0.8
- Gating checks (from decision doc)
  - Gate 1: Baseline end‑to‑end TTFA < 400ms
  - Gate 2: Latency/overlap targets met
  - Gate 3: Protocol fidelity confirmed
  - Gate 4: Conversation quality acceptable
  - Gate 5: Scalability/stability under load

## Session 2025-09-27

### Discovery
- Confirm ElevenLabs `stream-input` requires keepalive pings and `flush` semantics; capture handshake steps from @docs/research.md for implementation reference.
- Establish network prerequisites (ELEVENLABS/GROQ keys, region pinning) and document env expectations alongside `.agent-os/product/environment.md` so Phase 0 engineers can run binaries without guesswork.
- Inventory WS/audio building blocks: Axum upgrade path, `tokio::sync::mpsc` for audio frames, candidate VAD crates (webrtc, silero) and metrics sinks to align with Roadmap Phase 0 checkboxes.

### Implementation
- Stand up `server/` skeleton with Axum WS echo that streams dummy PCM and records round-trip timestamps; gate with local metric logging to verify < 400 ms loop time.
- Spike ElevenLabs Flash v2.5 client: persistent WS, early partial flush, chunk scheduler (120–200 ms) and heartbeat timer to avoid idle disconnects.
- Prototype Groq Whisper turbo wrapper using streaming partials; emit turn markers into session state machine and queue final transcripts for event serialization.
- Define instrumentation schema (per-turn `ttfb_ms`, `tail_cancel_ms`, `asr_confidence`) and wire to structured logs plus `experiments/AH-001/qa/metrics.json` exporter.

### Verification
- Run local WS echo benchmark to confirm we hit Gate 1 (< ~300 ms TTFA at P99) before layering external services; capture results in `docs/research.md`.
- After wiring ElevenLabs/Groq clients, execute AH-001 baseline session and record evaluator-ready artifacts (`conversation.json`, `transcript_raw.txt`, metrics) for scoring.
- Track TTFB and tail-cancel metrics across at least 10 agent turns; flag deviations >10% from the 200 ms P50 / 300 ms P99 targets for remediation before expanding feature scope.
- Schedule regression check: re-run evaluator once overlap-aware policy lands to verify ≥8/10 human-likeness while keeping latency guardrails.

Next Actions
- Spin up `server/` Axum WS echo spike and land instrumentation hooks for Gate 1 validation.
- Draft ElevenLabs Flash v2.5 streaming client (auth, ping/flush) and capture open questions on chunking in `docs/research.md`.
- Author Groq Whisper turbo integration notes (latency expectations, partial confidences) and outline implementation tasks for Phase 1 backlog.
- Prepare AH-001 artifact pipeline (conversation, transcript, metrics) so evaluator loop can start immediately after first end-to-end run.
