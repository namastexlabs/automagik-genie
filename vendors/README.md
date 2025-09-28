Vendors (Template Notice)

This directory contains upstream repositories added as Git submodules for research and interop. When installing this Genie template into a target repository, treat vendor docs as examples and adapt or ignore them based on your project’s {{DOMAIN}} and {{TECH_STACK}}.

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

Swift (Next.js) — Usage
- Location: `vendors/swift`
- Run standalone (baseline):
  - Copy `vendors/swift/.env.example` to `vendors/swift/.env.local` and set `GROQ_API_KEY` and `CARTESIA_API_KEY`.
  - From `vendors/swift/`: `pnpm install && pnpm dev`
- Integrate with your project (Agents WS clone or equivalent):
  - Goal: connect to our WS (ElevenLabs Agents‑compatible) without external keys.
  - Add an Agents WS client in Swift pointing to `NEXT_PUBLIC_VOICE_WS_URL` (e.g., `ws://localhost:8080/ws/agents`).
  - Event types to support: `conversation_initiation_metadata`, `audio`, `agent_response`, `agent_response_correction`, `user_transcript`; and client events `contextual_update`, `user_message`, `user_activity`.
  - Minimal sketch:
    - `const ws = new WebSocket(process.env.NEXT_PUBLIC_VOICE_WS_URL!)`
    - Switch on `evt.type` to route audio/text events; map audio base64 → AudioWorklet buffer.
  - Notes: Do not modify upstream on main; keep changes in a local branch or document patches.

LiveKit Examples — Key paths
- Location: `vendors/livekit-examples`
- Complex recipe to study: `complex-agents/medical_office_triage`
- Follow upstream README for environment and run instructions.

Hume EVI Next.js Starter — Notes
- Location: `vendors/hume-evi-next-js-starter`
- Use to study conversational UI patterns and EVI wiring; follow upstream README to run.
