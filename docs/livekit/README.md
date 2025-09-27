LiveKit Docs (Curated)

This folder contains the essential LiveKit documentation for Automagik Hello research.

Included essentials
- agents.md — Framework overview and links
- agents/start/voice-ai.md — Quickstart for voice agents
- agents/build.md — Building advanced voice AI apps
- agents/worker.md — Worker lifecycle (dispatch, jobs)
- agents/ops/deployment.md — Deployment to LiveKit Cloud or custom
- agents/integrations.md — AI provider integrations
- agents/start/frontend.md — Web/mobile frontend integration
- recipes.md — Example index and recipes
- home/get-started/intro-to-livekit.md — Ecosystem overview

Pruned (non-essential for our scope)
- agents/start/telephony.md — telephony not in near-term scope
- agents/start/playground.md — not required
- agents/ops/recording.md — egress/recording out-of-scope
- agents/ops/deployment/{builds,cli,custom,logs,secrets}.md — ops details not critical now
- agents/build/vision.md — vision not needed for voice agent work
- agents/integrations/realtime/openai.md — keep parent realtime.md only

Notes
- Full set downloaded temporarily under docs/livekit/all during curation.
- We focus on Agents WS semantics, turn detection, interruptions, and pipeline orchestration to inform our Rust-first design.
