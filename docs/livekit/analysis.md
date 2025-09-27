LiveKit Agents — What To Adopt vs. Avoid

Summary
- LiveKit Agents is a strong reference for realtime voice pipelines and orchestration.
- For Automagik Hello, we mirror ideas and wire protocols, but keep the hot path in Rust.

Adopt (Concepts & Semantics)
- Turn detection and interruption handling: lifelike barge‑in with fast tail‑cancel and resume rules.
- Pipeline orchestration: streaming STT → LLM → TTS with partials and early TTS start.
- Worker lifecycle: register workers, dispatch jobs that join rooms; clear separation of orchestration from per‑call logic.
- Tool use and multi‑agent handoff: LLM‑agnostic tool schema; forward tool calls to frontend when needed.
- WebSocket/Events design: predictable event families for audio, responses, transcripts, tool calls.

Treat as Reference Only
- Python runtime for Agents: we will not adopt Python workers for production.
- WebRTC as a mandatory transport: we prioritize raw WS for hot‑path control; WebRTC can be an interop path later.
- SDK‑specific configuration knobs that hide buffering/flush details: we need explicit control of chunking and flush.

Rust Mapping Plan
- Axum/Tokio WS server that mirrors Agents WS semantics: conversation initiation, audio chunks, agent_response, corrections, user_transcript, tool calls.
- ElevenLabs Flash v2.5 via stream‑input WS with explicit partial flush and chunk scheduling.
- Groq Whisper‑large‑v3‑turbo for streaming ASR primary; local WhisperX/faster‑whisper fallback.
- VAD baseline (WebRTC) with overlap_aware policy; soft tail‑cancel under 80ms.
- Management plane: Rust service inspired by LiveKit worker/job dispatch model.

Docs in this folder (curated)
- agents.md — framework overview
- agents/start/voice-ai.md — quickstart
- agents/build.md — building advanced apps
- agents/worker.md — worker lifecycle
- agents/ops/deployment.md — deploy
- agents/integrations.md — AI providers
- agents/start/frontend.md — frontends
- agents/start/telephony.md — telephony
- recipes.md — examples index
- home/get-started/intro-to-livekit.md — ecosystem overview

Next Steps
- Extract canonical event schemas from Agents docs and align with our WS event shapes in docs/research.md.
- Time basic agent flows (TTFB, cancel‑tail) from examples and record baselines in experiments/AH‑001/qa/metrics.json.
- Draft a Rust worker/job dispatcher spec mirroring LiveKit’s separation of concerns.
