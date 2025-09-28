# API Overview

This document summarizes the external interfaces {{PROJECT_NAME}} exposes or consumes. It complements detailed protocol references (`docs/websocket-protocol.md`, `docs/management-api.md`) with a concise checklist for implementers.

## 1. Real-Time Conversation WebSocket

- **Endpoint**: `wss://{server}/v1/convai/conversation`
- **Protocol**: RFC 6455 WebSocket, no subprotocol negotiation
- **Auth**: API key or bearer token in the initial HTTP upgrade headers (exact scheme TBD in Phase 1)
- **Compatibility**: Drop-in replacement for ElevenLabs Agents WebSocket

### Required Events

| Direction | Event Type | Notes |
|-----------|------------|-------|
| S→C | `conversation_initiation_metadata` | Confirms formats (`pcm_16000` in, `pcm_44100` out) |
| S→C | `ping` | 15s heartbeat; client must respond with `pong` |
| S→C | `agent_response` | Text content synced with first audio chunk |
| S→C | `audio` | Base64 PCM chunks with sequential `event_id` |
| S→C | `agent_response_correction` | Sent after barge-in to truncate speech |
| S→C | `user_transcript` | Finalized ASR result for logging |
| C→S | `conversation_initiation_client_data` | Session configuration overrides |
| C→S | `user_audio_chunk` | Base64 PCM/Opus payload |
| C→S | `user_message` | Text injection equivalent to spoken input |
| C→S | `contextual_update` | Non-blocking metadata (e.g., CRM context) |

See the full schema in [WebSocket Protocol Reference](websocket-protocol.md).

### Timing Targets

- Pong response: < 5 s
- First audio chunk after transcript: < 300 ms (P99)
- Interruption response: < 80 ms

## 2. Metrics & Transcript Artifacts

{{PROJECT_NAME}} emits artifacts that match your chosen provider schemas ({{APIS}}), or your own internal schema.

- **Format**: JSON array of turns (store wherever the active wish specifies; no default path)

> Note: The repository does not currently persist conversation transcripts by default—capture them manually when needed.
- **Schema**: Documented in [Transcript Schema](transcript-schema.md)
- **Key Metrics**: `ttfb_ms`, `convai_asr_trailing_service_latency`, `asr_confidence`

### Export Workflow

1. Fetch conversation data from ElevenLabs (`list_conversations`, `get_conversation`).
2. Store canonical transcript and metrics locally.
3. Feed the artifacts into the evaluator rubric (see `AGENTS.md`).

## 3. Management APIs (Planned)

Phase 1 introduces REST endpoints for agent, session, and metrics management. Names mirror ElevenLabs REST routes so client migrations stay trivial.

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `GET` | `/v1/agents` | Planned | List registered agents |
| `POST` | `/v1/agents` | Planned | Create/update agent configuration |
| `GET` | `/v1/agents/{agent_id}` | Planned | Retrieve agent details |
| `GET` | `/v1/conversations` | Planned | Filter conversations, optionally by agent |
| `GET` | `/v1/conversations/{conversation_id}` | Planned | Fetch transcript + metrics bundle |
| `GET` | `/v1/conversations/{conversation_id}/audio` | Planned | Download synthesized audio |
| `POST` | `/v1/conversations/{conversation_id}/feedback` | Planned | Submit manual QA annotations |

Design details, including request/response payloads, live in [ElevenLabs Agents Platform Management APIs](management-api.md) until the Rust implementation materializes.

## 4. Provider Integrations

{{PROJECT_NAME}} may depend on external providers ({{APIS}}) for critical services:

- **ElevenLabs TTS**: `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input`
- **Groq Whisper STT**: `https://api.groq.com/openai/v1/audio/transcriptions` (REST) or streaming equivalent when available

Developers should pin regions and reuse connections according to the [ElevenLabs Key Findings](elevenlabs/key-findings.md) and [Operational Guidance](research.md#operational-guidance-brazil-focus).

## 5. Reference CLI Snippets

Use these commands to validate credentials and harvest artifacts:

```bash
# ElevenLabs: list models
curl -sS -H "xi-api-key: $ELEVENLABS_API_KEY" \
  https://api.elevenlabs.io/v1/models | jq '.[].name'

# Groq: verify Whisper access
curl -sS -H "Authorization: Bearer $GROQ_API_KEY" \
  https://api.groq.com/openai/v1/models | jq '.data[].id'

# Download conversation artifact (choose an appropriate destination)
curl -sS "https://api.elevenlabs.io/v1/convai/conversations/<CONV_ID>" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -o artifacts/conversation.json
```

Keep this overview in sync with the canonical protocol documents whenever endpoints evolve.
