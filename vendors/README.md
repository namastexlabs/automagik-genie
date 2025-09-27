Vendors

This directory contains upstream repositories added as Git submodules for research and interop.

Included submodules
- vendors/livekit-agents → https://github.com/livekit/agents
  - Purpose: learn their realtime Agents framework (STT→LLM→TTS pipeline, turn detection, interruptions, worker/job model) and evaluate fit vs our Rust-first stack.
  - Notes: primary SDK is Python. LiveKit has Rust SDKs for core LiveKit, but the Agents framework itself is Python today.
- vendors/livekit-examples → https://github.com/livekit-examples/python-agents-examples
  - Purpose: analyze end-to-end recipes (e.g., complex-agents/medical_office_triage) for orchestration patterns, tool use, and turn policy.
- vendors/hume-evi-next-js-starter → https://github.com/humeai/hume-evi-next-js-starter
  - Purpose: study Hume EVI UI/flow and conversational UX patterns we can adapt to our demo UI and evaluator flows.
 - vendors/swift → https://github.com/ai-ng/swift
  - Purpose: Next.js voice UI with VAD and streaming pipeline; adapt to consume our Agents‑compatible WS.

Workflow
- Update submodules: `git submodule update --init --recursive`
- Pull latest from upstreams: `git submodule foreach git pull origin HEAD`
- Pin a revision when referencing code: prefer commit SHAs in docs to keep reproducible evaluations.

Vendor lock-in considerations
- Treat these repos as reference implementations. We copy patterns, not code, into our Rust runtime unless licensing/fit is vetted.
- Keep our hot path (WS, scheduling, partial flush, VAD/overlap policy) in Rust. Use upstream ideas for strategy and metrics.
- Evaluate cost/latency trade-offs independently; avoid hard dependencies that block local/offline fallbacks.

Pointers
- LiveKit Agents quickstart and examples: `vendors/livekit-agents/examples/voice_agents/`
  - basic_agent.py, background_audio.py for turn-taking/overlap and audio mixing ideas.
- Hume starter: Next.js scaffolding for conversational UI and metrics overlays we can borrow for `examples/demo-ui/` later.
