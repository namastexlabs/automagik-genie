SIP Integration — Notes and Plan (LiveKit Reference)

What LiveKit Does
- Trunking: Configure inbound and outbound SIP trunks with common providers (Twilio, Telnyx, Wavix, Plivo). See quickstarts under `docs/livekit/all/sip/quickstarts/*`.
- Dispatch rule: Maps inbound calls to rooms (individual or shared) and optionally dispatches agents by name with metadata. `CreateSIPDispatchRule` API. See `sip/dispatch-rule.md`.
- SIP participant: Bridges PSTN audio into the room; propagates DTMF events to the app. See `sip/sip-participant.md`, `sip/dtmf.md`.
- Transfers: Warm (agent-assisted) and cold transfer workflows; warm transfer uses a second agent session for supervisor consult then merges. See `sip/transfer-warm.md`, `sip/transfer-cold.md`.
- Ops: Secure trunking, HD voice, troubleshooting. See `sip/secure-trunking.md`, `sip/hd-voice.md`, `sip/troubleshooting.md`.

Adopt for Automagik Hello (Later Phase)
- Keep WS hot path; use SIP as an ingress/egress transport into rooms. Minimize added latency.
- Prefer explicit agent dispatch so calls can target specific strategies and metadata.
- Map DTMF to agent tool calls (IVR-like flows) with clear policy boundaries.
- Implement warm transfer as a workflow: caller room + supervisor room, with summary tool before merge.

MVP Scope (Post-GA)
- Inbound trunk + dispatch rule → single-agent room per call (prefix `call-`).
- Agent auto-join under 150 ms via dispatch metadata (align with worker/options.md).
- DTMF handling tool; announce in transcript for evaluator.
- Outbound dialing tool (click-to-call) with basic retry.

Key Files (local)
- docs/livekit/all/sip/dispatch-rule.md
- docs/livekit/all/sip/trunk-inbound.md
- docs/livekit/all/sip/trunk-outbound.md
- docs/livekit/all/sip/dtmf.md
- docs/livekit/all/sip/sip-participant.md
- docs/livekit/all/sip/transfer-warm.md
- docs/livekit/all/sip/transfer-cold.md
- docs/livekit/all/sip/accepting-calls.md, making-calls.md, outbound-calls.md

