perfect—set up a living spec for us and dropped in the initial blueprint. we’ll keep packing it with decisions and code as we go.

quick hits on your asks:

* **Docs “blueprint”**: ElevenLabs actually *does* publish all the bits you need:
  – **TTS streaming WebSocket (`stream-input`)** and a **multi-context** variant for overlapping streams. ([ElevenLabs][1])
  – **Agents WebSocket** (handshake + event shapes) so we can mirror their schema on our server. ([ElevenLabs][2])
  – A focused **latency optimization** guide (Flash/Turbo, streaming, region pinning, voice choice). ([ElevenLabs][3])
  – The docs index you sent (llms.txt) links to real-time streaming, multi-context, agents quickstart, etc. (I pulled it). ([ElevenLabs][4])
  – Also: “generate audio in real-time” overview + generic streaming notes. ([ElevenLabs][5])

* **Use SDK or raw sockets?** For the **hot path**, raw **WebSocket** wins (precise control over partial text, `flush`, chunk schedules, and warm connections). SDKs are fine for management (voice lists, CRUD). ([ElevenLabs][1])

* **Eleven v3 (alpha) for calls**: their docs explicitly say it’s **not for real-time Agents**. Use **Flash v2.5** (fastest ~75ms TTS) or **Turbo v2.5** when you need more quality. I added that guidance to the doc. ([ElevenLabs][4])

* **Whisper plan**: Primary **Groq Whisper-large-v3-turbo** (fast, $0.04/hr; billed min 10s). Local fallback via **whisper.cpp** (`whisper-rs`) preloaded. ([Groq][6])

* **Turn-taking/AST**: Start with **VAD + heuristics** (300–500ms silence), then evaluate **pyannote** (quality) and a tiny ONNX turn-end classifier if needed. I listed model options in the doc; we can also test **pipecat-ai/smart-turn-v3**. ([Hugging Face][7])

* **Local TTS fallback**: **VibeVoice** (1.5B/7B; quantized variants exist) and **ResembleAI Chatterbox** (multilingual; has watermarking). Both linked for reference. ([Hugging Face][8])

I also generated two diagrams you can download (we’ll iterate them as we refine):

* [Architecture diagram](sandbox:/mnt/data/voice_agent_architecture.png)
* [Turn sequence diagram](sandbox:/mnt/data/voice_agent_sequence.png)

if you want, next I’ll scaffold the Rust repo layout from the document (Axum WS handler, ElevenLabs TTS WS client with `flush`, Groq STT client stub, VAD gate, metrics) so you can run a minimal “speak back” demo that achieves sub-second **time-to-first-audio**.

[1]: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input?utm_source=chatgpt.com "WebSocket | ElevenLabs Documentation"
[2]: https://elevenlabs.io/docs/agents-platform/api-reference/agents-platform/websocket?utm_source=chatgpt.com "Agent WebSockets | ElevenLabs Documentation"
[3]: https://elevenlabs.io/docs/best-practices/latency-optimization?utm_source=chatgpt.com "Latency optimization | ElevenLabs Documentation"
[4]: https://elevenlabs.io/docs/llms.txt "elevenlabs.io"
[5]: https://elevenlabs.io/docs/websockets?utm_source=chatgpt.com "Generate audio in real-time | ElevenLabs Documentation"
[6]: https://groq.com/pricing?utm_source=chatgpt.com "Groq On-Demand Pricing for Tokens-as-a-Service"
[7]: https://huggingface.co/pyannote/voice-activity-detection?utm_source=chatgpt.com "pyannote/voice-activity-detection"
[8]: https://huggingface.co/vibevoice/VibeVoice-7B?utm_source=chatgpt.com "vibevoice/VibeVoice-7B"

---

LiveKit Agents: What to learn and port

References
- Repo: vendors/livekit-agents (submodule)
- Docs: https://docs.livekit.io/agents.md and Voice AI quickstart
- Worker lifecycle: workers receive dispatch and spawn jobs that join rooms
- Example agents: examples/voice_agents/basic_agent.py, background_audio.py

Focus Areas to Study
- Turn detection and interruption handling (cancel-tail timing, resume rules)
- Realtime STT→LLM→TTS orchestration and partial flush strategy
- WebRTC plumbing vs our WS-only stack; map mirroring points at protocol level
- Tool calls and multi-agent handoff abstractions we can reflect via WS

Porting Plan (Rust-first)
- Mirror Agents WS semantics where beneficial for interop in Axum/Tokio
- Keep hot path in Rust with precise scheduling for partials and chunking
- Reuse the worker/job orchestration ideas in a Rust management plane

Region, Duplex/Overlap, Tail‑Cancel, and Strict Agents WS Mirroring

Overview
- Brazil‑first, bilingual (pt‑BR and en): Prioritize RTT from Brazil users to our server and to speech providers. When possible, deploy servers in `sa-east-1` (São Paulo) or nearest POPs and keep speech providers region‑pinned.
- ElevenLabs region pinning: ElevenLabs does not expose a public WS region parameter in the URL; treat `PIN_TTS_REGION` as a future/conditional flag for provider‑specific endpoints. Co‑locate our server near the provider’s primary region in practice.
- Groq Whisper‑large‑v3‑turbo: Global endpoint today; colocate our server in a region with lowest RTT from Brazil and to Groq’s POPs.

What “Region” Means
- Deployment region: where our Axum/Tokio server runs (e.g., `sa-east-1`, `us-east-1`). Affects RTT to end users and providers.
- Provider region: the data‑center/POP used by TTS/STT vendors. When vendors allow pinning, select the nearest region to our server and end users to reduce round‑trips.
- Practical default for pt‑BR focus: deploy in `sa-east-1` and route to the closest provider POP; fallback to `us-east` when providers are US‑centric.

Duplex and Overlap (Plain English)
- Half‑duplex: Only one party speaks at a time (walkie‑talkie style). Easy but unnatural.
- Rapid duplex: System speaks while listening; will cut or pause promptly if the user barges in.
- Overlap: Short, natural overlaps such as backchannels (“uh‑huh”, “certo”) or brief interjections. Overlap‑aware systems allow these small overlaps, cancel quickly on user barge‑in, and resume after a brief silence.

Our Defaults
- OVERLAP_POLICY = `overlap_aware`: allow micro‑backchannels and short overlaps, cancel tail on user speech, and resume after 250–350ms silence.
- CANCEL_TAIL_MODE = `soft` with CANCEL_TAIL_FADE_MS ≈ 60ms to minimize artifacts.
- ASR_PARTIAL_TRIGGER_CONF = 0.6 to start speaking on early intent; increase to 0.7 if false starts occur.
- TTS_FLUSH_ON_TURN_END = 1 to bound tail latency.
- TTS_KEEPALIVE_INTERVAL_MS = 15000: send a single space " " periodically; empty string closes the WS.

Tail‑Cancel Behavior (Explained)
- Hard cancel (`hard`): Immediately stop audio playback/output. Lowest latency; can sound abrupt.
- Soft cancel (`soft`): Fade out quickly (≈ 60ms). Slightly higher latency; reduces perceived harshness.
- Target: cancel‑tail latency < 80ms from barge‑in to audible stop; soft fade at 60ms typically stays under this budget when pipeline is optimized.

TTFB/Quality Tuning
- Provider defaults: Balanced TTFB and quality—use these first.
- Alternative schedule: `TTS_CHUNK_LENGTH_SCHEDULE=50,120,160,290` can reduce TTFB at some quality cost in long utterances (try in overlap experiments: AH‑002/AH‑005).
- Always flush on turn end (flush: true) to force buffered text to audio and bound tail latency.

Strict Agents WS Mirroring (Drop‑in Replacement)
- Our default socket format mirrors ElevenLabs Agents WS event types and payload shapes exactly (no toggle).
- Server→Client events to emit:
  - `conversation_initiation_metadata` (IDs, audio formats)
  - `ping` (SDKs respond automatically; keep for health)
  - `audio` (base64 chunks with event_id)
  - `agent_response` (first chunk includes the text)
  - `agent_response_correction` (send truncated response after interruption)
  - `user_transcript` (finalized ASR)
- Client→Server events to accept:
  - `contextual_update` (non‑interrupting background info)
  - `user_message` (text injection equivalent to spoken input)
  - `user_activity` (keepalive/activity to avoid agent interrupt)

WS Hot‑Path Controls (Provider Evidence)
- WebSockets are not available for `eleven_v3`; use `eleven_flash_v2_5` for latency‑critical flows.
- **auto_mode=true**: Reduces latency by disabling chunk schedule and buffers (recommended for full sentences/phrases)
- Use `chunk_length_schedule` to tune buffering thresholds for TTFB vs quality (only if auto_mode disabled).
- Use `flush: true` at turn end to force generation of buffered text.
- Keep connection alive by sending a single space " "; empty string closes the WS.
- **optimize_streaming_latency** is deprecated - do not use.

Evidence (llms.txt lines)
- WebSocket guide: model limits, keepalive, chunk schedule, flush
  - @.cache/external/elevenlabs/elevenlabs.io_docs_websockets_llms.txt:12, :59–63, :246–274, :280–293, :296–300
- Agents WS event families and schemas (for strict mirroring)
  - @.cache/external/elevenlabs/elevenlabs.io_docs_agents-platform_customization_events_llms.txt:12–21
  - @.cache/external/elevenlabs/elevenlabs.io_docs_agents-platform_customization_events_client-events_llms.txt:41–88, :116–164
  - @.cache/external/elevenlabs/elevenlabs.io_docs_agents-platform_customization_events_client-to-server-events_llms.txt:23–38, :58–122

Operational Guidance (Brazil Focus)
- Prefer hosting in `sa-east-1` for lower last‑mile RTT to Brazilian users; benchmark RTT to ElevenLabs and Groq from that region vs `us-east-1` and select the minimum aggregate RTT.
- If providers do not expose region pinning: place our server where the sum of (user→server RTT + server→provider RTT) is minimized.

Experiment Pointers
- AH‑001 (baseline speak‑back): defaults above; measure TTFB, cancel‑tail latency, ASR conf.
- AH‑002 (rapid duplex overlap): enable overlap‑aware, try `TTS_CHUNK_LENGTH_SCHEDULE=50,120,160,290` and compare artifacts; confirm cancel‑tail < 80ms.
- AH‑005 (chunk & region ablation): sweep chunk schedules and deployment regions; log p50/p95 TTFB and artifact rates.

---

## Critical Implementation Details (Lock-in Before Dev)

### Audio Format Specifications
**Client Input (User Audio)**
- Format: `pcm_16000` (16kHz PCM for ASR input)
- Encoding: Raw PCM, 16-bit signed, little-endian
- Channels: Mono
- Frame size: 320 bytes (20ms @ 16kHz)

**Agent Output (TTS Audio)**
- Format: `pcm_44100` (44.1kHz PCM for high quality)
- Alternative: `pcm_24000` (24kHz for bandwidth optimization)
- Encoding: Base64 in WebSocket frames
- Chunks: ~160ms default, configurable via schedule

### WebSocket Endpoints

**ElevenLabs TTS WebSocket (stream-input)**
```
wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input
```
Parameters:
- `model_id`: eleven_flash_v2_5 (required for real-time)
- `output_format`: mp3_22050_32 or pcm_44100
- `auto_mode`: true (disables chunk schedule for lowest latency)
- `optimize_streaming_latency`: DEPRECATED - do not use
- `inactivity_timeout`: max 180s
- `sync_alignment`: for word-level timing

**Our Gateway WebSocket (ElevenLabs Agents compatible)**
```
wss://{server}/v1/convai/conversation
```

### Complete WebSocket Event Schema

**Server→Client Events (We Must Emit All)**
```typescript
// 1. conversation_initiation_metadata
{
  "type": "conversation_initiation_metadata",
  "conversation_initiation_metadata_event": {
    "conversation_id": string,  // UUID v4
    "agent_output_audio_format": "pcm_44100",
    "user_input_audio_format": "pcm_16000"
  }
}

// 2. ping (health check)
{
  "type": "ping",
  "ping_event": {
    "event_id": number,
    "ping_ms": number  // Optional estimated latency
  }
}

// 3. audio (TTS chunks)
{
  "type": "audio",
  "audio_event": {
    "audio_base_64": string,  // Base64 encoded PCM
    "event_id": number  // Sequential for ordering
  }
}

// 4. agent_response (text with first audio)
{
  "type": "agent_response",
  "agent_response_event": {
    "agent_response": string  // Full text
  }
}

// 5. agent_response_correction (after interruption)
{
  "type": "agent_response_correction",
  "agent_response_correction_event": {
    "original_agent_response": string,
    "corrected_agent_response": string  // Truncated
  }
}

// 6. user_transcript (finalized ASR)
{
  "type": "user_transcript",
  "user_transcription_event": {
    "user_transcript": string
  }
}

// 7. vad_score (voice activity probability)
{
  "type": "vad_score",
  "vad_score_event": {
    "vad_score": number  // 0.0 to 1.0
  }
}

// 8. client_tool_call (function request)
{
  "type": "client_tool_call",
  "client_tool_call": {
    "tool_name": string,
    "tool_call_id": string,
    "parameters": object
  }
}

// 9. agent_tool_response (tool execution result)
{
  "type": "agent_tool_response",
  "agent_tool_response": {
    "tool_name": string,
    "tool_call_id": string,
    "tool_type": "system" | "custom",
    "is_error": boolean
  }
}
```

**Client→Server Events (We Must Accept All)**
```typescript
// 1. pong (health response)
{
  "type": "pong"
}

// 2. contextual_update (background info)
{
  "type": "contextual_update",
  "text": string
}

// 3. user_message (text injection)
{
  "type": "user_message",
  "text": string
}

// 4. user_activity (keepalive)
{
  "type": "user_activity"
}

// 5. client_tool_result (tool response)
{
  "type": "client_tool_result",
  "tool_call_id": string,
  "result": any,
  "is_error": boolean
}

// 6. conversation_initiation_client_data (handshake)
{
  "type": "conversation_initiation_client_data",
  "conversation_config_override": {
    "agent": {
      "prompt": {"prompt": string},
      "first_message": string,
      "language": string
    },
    "tts": {
      "voice_id": string,
      "model_id": string,
      "language": string,
      "voice_settings": {
        "stability": number,
        "similarity_boost": number,
        "style": number,
        "use_speaker_boost": boolean
      }
    },
    "stt": {
      "language": string,
      "keywords": string[]  // Optional boost words
    }
  }
}

// 7. audio (user audio chunks)
{
  "type": "audio",
  "audio": string  // Base64 PCM @ 16kHz
}
```

### Connection Lifecycle (Strict Requirements)

1. **Handshake Sequence**
   ```
   Client connects → WSS upgrade
   Client sends → conversation_initiation_client_data
   Server sends → conversation_initiation_metadata
   Server sends → ping (within 1s)
   Client sends → pong (must respond)
   ```

2. **Keepalive Requirements**
   - Ping interval: 15-20s
   - Client MUST respond with pong
   - Missing pong = connection terminated
   - User activity resets turn timer

3. **Termination Signals**
   - Empty string "" on TTS WS = close
   - Missing pong after 2 pings = close
   - Explicit close frame
   - Inactivity timeout (default 20s)

### Voice Settings (Exact Ranges)

**ElevenLabs TTS Parameters**
- `stability`: 0.0-1.0 (default 0.5) - Lower = more variable
- `similarity_boost`: 0.0-1.0 (default 0.75) - Higher = closer to original
- `style`: 0.0-1.0 (default 0.0) - Higher = more expressive
- `use_speaker_boost`: boolean (default false) - Enhance clarity

**Model Selection Rules**
- `eleven_flash_v2_5`: Use for ALL real-time (~75ms model inference)
- `eleven_turbo_v2_5`: Quality mode when willing to trade latency for quality
- `eleven_v3`: NEVER for real-time (no WS support, high latency)
- `eleven_multilingual_v2`: Fallback for rare languages
- **Voice impact**: Default/IVC voices faster than PVC (cold start difference)

### Error Handling Matrix

| Error Type | Client Action | Server Response |
|------------|---------------|-----------------|
| TTS timeout | Retry with backoff | Send silence, log |
| ASR low conf (<0.3) | Request repeat | "Could you repeat?" |
| Tool call fail | Send is_error=true | Acknowledge, continue |
| WS disconnect | Reconnect with state | Resume from last event_id |
| Rate limit | Exponential backoff | 429 status, retry-after |

### State Management

**Server Must Track**
- Current event_id counter
- Audio playback position
- Pending tool calls
- Turn state (listening/speaking/processing)
- Interruption points for corrections

**Client State Requirements**
- Buffer audio chunks by event_id
- Track VAD scores for UI
- Queue tool results
- Maintain conversation history

### Performance Targets (Based on ElevenLabs Production Data)

**Actual Production Metrics from docs/transcript_raw.json:**
- **TTS TTFB (convai_tts_service_ttfb)**:
  - Best: 108ms
  - Average: 130-200ms
  - Acceptable: up to 815ms
- **ASR Trailing Latency**:
  - Best: 130ms
  - Average: 150-300ms
  - Worst case: 791ms
- **LLM Performance**:
  - TTFB: 911ms - 3.45s
  - First sentence: 930ms - 2.79s
  - Last sentence: 1.21s - 2.96s
- **RAG Retrieval**: 131ms - 1.3s

**Our Targets (matching ElevenLabs standards):**
- **TTS TTFB**: < 200ms (p50), < 815ms (p95)
- **ASR Latency**: < 300ms (p50), < 800ms (p95)
- **End-to-end TTFA**: < 1000ms typical
- **Barge-in response**: < 80ms to stop audio
- **VAD detection**: 10/20/30ms frames (WebRTC constraints)

### Deployment Architecture

```
┌─────────────┐
│   Client    │ (Brazil users)
└──────┬──────┘
       │ WSS (ElevenLabs protocol)
       ↓
┌─────────────┐
│ Our Server  │ sa-east-1 (São Paulo)
│   (Rust)    │
└──────┬──────┘
       ├── TTS WS → ElevenLabs (us-east)
       ├── ASR API → Groq (global)
       └── Fallback → Local Whisper

Latencies:
- User→Server: 10-30ms (Brazil local)
- Server→ElevenLabs: 150-200ms
- Server→Groq: 100-150ms
- Total TTFB: 260-380ms infra + 75ms TTS = 335-455ms
```

### Research Updates

**🚨 BREAKTHROUGH: Fixie AI Solutions (Game-Changers)**

**UltraVAD** - Next-gen multimodal VAD (0.7B parameters):
- Purpose-built for voice agents with natural turn-taking
- Handles interruptions and overlapping speech gracefully
- Feature extraction model optimized for real-time processing
- Solves the "messy world" problem of human conversation
- Available on HuggingFace: `fixie-ai/ultraVAD`

**Ultravox** - Multimodal Speech LLM (8B-70B parameters):
- **Revolutionary approach**: Direct audio-to-LLM without separate ASR stage
- Processes audio via `<|audio|>` pseudo-token
- Built on Whisper-large-v3-turbo encoder + Llama/Qwen/Gemma LLMs
- 42 language support with noise robustness
- Outputs `((noise))` for unintelligible audio
- **Key advantage**: Eliminates ASR→LLM latency completely
- Training: 2-3 hours on 8xH100 for v0.4
- Available: `fixie-ai/ultravox-v0_6-qwen-3-32b`

**Integration Strategy**:
1. **Phase 0-1**: WebRTC VAD for basic POC (< 10ms latency)
2. **Phase 2**: Deploy UltraVAD for human-like turn-taking
3. **Phase 3+**: Explore Ultravox for end-to-end speech understanding
4. **Innovation**: Combine UltraVAD for interruption detection + Ultravox for speech processing
5. **Fallback**: Keep traditional pipeline (Whisper + LLM) for compatibility

**Traditional VAD Options** (for reference):
- WebRTC: Fast but basic (< 10ms)
- pyannote: More accurate, higher latency (50-100ms)
- Silero: Good balance (20-30ms)
- pipecat-ai/smart-turn-v3: Turn-end classifier

### Missing Pieces to Add Before Dev

1. **Add to environment.md**:
   - `AGENTS_WS_MIRROR=1` (always on, no toggle)
   - Audio format configs
   - Tool timeout settings

2. **Create `websocket-protocol.md`**:
   - Full event type reference
   - Sequence diagrams
   - Error codes

3. **Create `audio-pipeline.md`**:
   - PCM format details
   - Buffer management
   - Chunk alignment

4. **Update roadmap.md**:
   - Add tool support milestone
   - VAD score streaming
   - State recovery system

---

## LiveKit Learnings Blueprint (LEARN_FROM)

Scope: Port proven patterns from LiveKit into our Rust stack while mirroring ElevenLabs Agents WS.

- Turn Detection
  - Start with VAD+heuristics (300–500ms silence, min speech duration)
  - Add short max-wait for continuation; consider transformer turn model later

- Interruption Handling
  - Detect user speech during TTS; stop within 60–80ms with short fade
  - Truncate unspoken assistant text; send `agent_response_correction`
  - Resume if false alarm after ~2s of no STT transcript

- Streaming Pipeline
  - Concurrent STT → LLM → TTS; allow partials to preempt replies when intent ≥ 0.6 conf
  - ElevenLabs WS: stream chunks, keepalive pings, final flush at turn end

- Lifecycle & Scaling
  - Async task per session in Axum/Tokio; strong error boundaries
  - Horizontal scale for isolation; metrics at each stage (STT/LLM/TTS)

- Protocol Parity
  - Emit ElevenLabs events: `conversation_initiation_metadata`, `ping`, `audio`, `agent_response`, `agent_response_correction`, `user_transcript`, optional `vad_score`
  - Validate ordering and fields against client expectations

Reference: @.agent-os/product/decisions/2025-09-learn-from-livekit.md
