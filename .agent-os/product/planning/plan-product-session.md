# Product Planning Session Context (Automagik Hello)

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
  - TTFB < 900ms avg, P99 < 1200ms
  - Interruption tail < 100ms; false‑interruption resume ≤ 2s
  - Protocol parity: clients work unchanged
  - Evaluator human‑likeness ≥ 8/10; ASR confidence > 0.8
- Gating checks (from decision doc)
  - Gate 1: Baseline end‑to‑end under ~1.5s
  - Gate 2: Latency/overlap targets met
  - Gate 3: Protocol fidelity confirmed
  - Gate 4: Conversation quality acceptable
  - Gate 5: Scalability/stability under load

Next Actions
- Align roadmap tasks with phases; wire metrics capture; start AH‑001 baseline and evaluator loop

