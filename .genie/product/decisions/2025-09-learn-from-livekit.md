# Decision Report: LEARN_FROM LiveKit Agents (Build In‑House Rust Pipeline)

Decision
- Outcome: LEARN_FROM (use LiveKit as a blueprint; do not adopt framework)
- Hot path: Rust (Tokio/Axum) with ElevenLabs‑compatible WebSocket protocol
- Focus: Sub‑second TTFB, robust barge‑in, natural overlap, exact protocol parity

Why
- Latency/control: Avoid ~150ms worker dispatch and extra hops; precise flush/overlap timing in Rust
- Rust‑first performance: Async tasks per session; minimal memory/startup overhead
- Protocol fit: Mirror ElevenLabs Agents WS schema exactly (events + base64 audio)
- Flexibility: No dependency on LiveKit server/Python workers; cherry‑pick patterns

What We’ll Reproduce (Blueprint)
- Turn detection: VAD+heuristics first (300–500ms silence), optional transformer later
- Interruption handling: Cut TTS within 60–80ms; truncate unspoken text; resume after false alarms
- Streaming pipeline: Concurrent STT → LLM → TTS; partials to preempt replies; final flush
- Lifecycle/scaling: One Axum server; async task per session; strong error boundaries
- Integrations: Groq Whisper‑large‑v3‑turbo (partial/final) and ElevenLabs Flash v2.5 WS
- Client protocol: Emit ElevenLabs’ events (user_transcript, agent_response, audio, agent_response_correction, ping)

Risks & Mitigations
- Dev effort: Iterate against LiveKit docs/examples; port specific models if needed
- Latency/sync: Instrument per‑stage timings; reuse connections; region pinning
- Nuanced turn‑taking: Add transformer turn model if VAD‑only insufficient
- Vendor dependency: Keep local fallbacks (WhisperX/faster‑whisper, local TTS)
- Ops ownership: Containerize; add tracing/metrics; horizontal scale for isolation

Gating Criteria
1) Baseline pipeline working: end‑to‑end, sub‑~1.5s first audio, no crashes
2) Latency & overlap: TTFB ~1s; interruption tail < 100ms; smooth resume
3) Protocol fidelity: Clients work unchanged against our WS server
4) Conversation quality: Natural flow; minimal false cuts/delays; evaluator ≥ 8/10
5) Scalability & stability: Handles expected concurrency; no leaks; stable under load

Phased Implementation
- Phase 0: WS echo spike (audio in→out); measure baseline
- Phase 1: STT/TTS clients (Groq partial/final; ElevenLabs WS streaming + flush/keepalive)
- Phase 2: Session engine (AgentSession state, VAD turn detection, barge‑in, LLM/TTS orchestration)
- Phase 3: Protocol parity (emit ElevenLabs events; verify with existing client)
- Phase 4: Tuning & metrics (overlap‑aware policy, micro‑pauses, structured logs, per‑turn metrics)

JSON Summary
```json
{
  "decision": "LEARN_FROM",
  "gates": [
    "Baseline pipeline working end-to-end with sub-1.5s first response and no crashes",
    "Latency and interruption targets met in testing (TTFB ~1s, interruption <100ms tail)",
    "Protocol fidelity with ElevenLabs API confirmed (clients work unchanged)",
    "Conversation quality acceptable in beta (no excessive false cuts or delays)",
    "Scalability and stability proven under load (resource use per session OK, no mem leaks)"
  ],
  "risks": [
    "Higher dev effort vs framework",
    "Latency or audio sync issues",
    "Missing subtle turn-taking features",
    "Dependency on STT/TTS vendors",
    "Full ownership of ops & bugs"
  ],
  "next_steps": [
    "Set up Rust WS server and verify audio I/O",
    "Implement Groq STT and ElevenLabs TTS async clients; test streaming and flush",
    "Build VAD-based turn detection and interruption logic",
    "Integrate LLM and connect STT → LLM → TTS with streaming",
    "Emit ElevenLabs-style events over WS; test with existing client",
    "Iterate on timing and overlap; measure end-to-end latency; add metrics"
  ]
}
```

References
- LiveKit Agents: turn‑taking, interruption handling, worker lifecycle, examples (local notes)
- ElevenLabs streaming API and Agents WS schema (local notes)

