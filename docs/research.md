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

## Quick Navigation
- [Blueprint Overview](#real-time-voice-agent--rust-backend-blueprint)
- [Mission & Constraints](#0-mission--constraints)
- [Runtime Architecture](#2-runtime-architecture-rust-first)
- [Protocol Compatibility](#3-protocol-compatibility-elevenlabs-agents-ws)
- [Turn-Taking & Endpointing](#4-turn-taking--endpointing)
- [Latency Budget](#9-latency-budget-per-turn)
- [LiveKit POC Benchmark](#livekit-poc-side-by-side-benchmark)
- [Operational Guidance](#operational-guidance-brazil-focus)

## Real-Time Voice Agent — Rust Backend Blueprint

Living document. We’ll keep expanding this as we go.

### 0) Mission & Constraints
- Goal: Backend-only service that mimics the ElevenLabs Agents WebSocket schema for real-time voice (drop-in replacement) while running our own GPT agent.
- Primary providers: Groq Whisper-large-v3-turbo for STT; ElevenLabs TTS (Flash v2.5/Turbo v2.5) for outbound speech.
- Secondary/local fallbacks: whisper.cpp (via whisper-rs) plus VibeVoice or ResembleAI Chatterbox for TTS.
- LLM stack: Groq (primary) → Cerebras (secondary) → local vLLM (GPT-OSS-120B).
- Latency target: TTFA < 200 ms at P50 and < 300 ms at P99, measured from end-of-speech to first agent audio (grounded in production data goals).
- Reminder: ElevenLabs v3 alpha is not intended for real-time Agents; reserve for offline/high-fidelity content.

### 1) External APIs & Decision: SDK vs Direct Socket
- ElevenLabs TTS: use `stream-input` WebSocket for single-context streaming; graduate to multi-context WS when we need overlapping streams.
- ElevenLabs Agents WS: we do not call their agent brain; we replicate the schema so existing clients connect unchanged.
- Groq Whisper large v3 turbo: prefer streamed chunking with warm sessions; acknowledge 10 s billable minimum.
- Fallback STT: local whisper.cpp (preloaded) to avoid cold starts.
- Rationale: raw WebSocket control enables chunk scheduling, `flush`, reconnect/backoff, and per-packet timing; SDKs remain for management APIs only.

### 2) Runtime Architecture (Rust-first)
- Client ↔ Axum/Tokio gateway handling WS upgrade and schema mirroring.
- Ingress pipeline: decode/resample audio (16 kHz mono), run VAD/endpointing, dispatch to STT workers.
- Session actors: ingress/VAD, STT, agent/LLM, and TTS/egress tasks communicating over bounded `mpsc` channels with `spawn_blocking` for CPU-heavy work.
- STT/LTMs: Groq streaming primary, Cerebras fallback, local vLLM for resilience.
- TTS out: persistent ElevenLabs WS connections, streaming partial text and chunked audio back per schema.
- Barge-in: detect live speech, emit interruption events, cancel current TTS context.
- Observability: Prometheus metrics (`ttfa_ms`, `tail_cancel_ms`, `asr_confidence`, queue depths) and OpenTelemetry traces.

### 3) Protocol Compatibility (ElevenLabs Agents WS)
- Mirror headers/params during handshake; emit `conversation_initiation_metadata` on connect.
- Inbound events: `user_audio_chunk`, control messages, pings.
- Outbound events: `audio` (base64 PCM/Opus), `agent_response`, `agent_response_correction`, `ping`, errors, and interruption notifications.
- Ensure sequential `event_id` ordering and `is_final` markers so clients can reuse UI components.

### 4) Turn-Taking & Endpointing
- Default policy: VAD + heuristics (300–500 ms silence window) complemented by prosody cues (pitch fall, energy drop, long vowels).
- Candidate models: WebRTC VAD (fast baseline), pyannote VAD/diarization (high fidelity), pipecat-ai/smart-turn-v3, or a lightweight ONNX classifier.
- Early-speak rule: allow partial responses when LLM confidence ≥ 0.6; otherwise wait for final transcripts.

### 5) Model Selection & Fallbacks (TTS)
- Real-time primary: ElevenLabs Flash v2.5 for lowest TTFB, Turbo v2.5 when fidelity matters.
- Local fallback: VibeVoice (1.5B/7B, quantizable) or ResembleAI Chatterbox for multilingual coverage.
- Edge cache: pre-synthesize system prompts/responses to shave RTT on frequent phrases.

### 6) Fast-Path Details (WS over SDK)
- Maintain a single persistent `stream-input` socket per session with warm heartbeat.
- Send initial clause as soon as LLM yields tokens; stream subsequent text to keep TTS ahead of playback.
- Issue `{ "flush": true }` at turn end; on barge-in, close/flush and drop buffered audio before resuming.
- Use SDKs for CRUD/list operations only.

### 7) Whisper (Groq) Strategy
- Groq Whisper-large-v3-turbo: streaming mode preferred; keep session alive to amortize 10 s minimum.
- Batch fallback: short per-utterance HTTP requests if streaming unavailable; accept billing overhead.
- Local fallback: whisper-rs with quantized models; keep weights resident to avoid warmup lag.

### 8) LLM Strategy
- Primary LLM: Groq via OpenAI-compatible endpoint with streaming tokens.
- Secondary: Cerebras API; tertiary: local vLLM serving GPT-OSS-120B with trimmed context windows and KV-cache pinning.
- Prompting guidelines: concise system prompt, tool schemas, aggressive stop sequences, stream deltas early.

### 9) Latency Budget (Per Turn)
- VAD end detection: 40–80 ms
- STT processing: 90–140 ms
- LLM first token: 60–100 ms
- TTS first audio: 80–140 ms
- Aggregate TTFA: ~190–280 ms (P50 ~200 ms, P99 < 300 ms)

### 10) Project Layout (Rust)
```
/voice-agent
  /crates
    gateway     # Axum WS handlers, auth, schema mirroring
    audio       # Decode/resample, VAD, jitter buffers
    stt         # Groq client + whisper-rs fallback
    agent       # Orchestration, state, tools, memory
    llm         # Groq/Cerebras/local vLLM clients
    tts_eleven  # ElevenLabs TTS WS client (stream-input)
    schema      # Shared message types (serde)
    metrics     # Prometheus + OpenTelemetry
  /bin
    server.rs   # Compose services, config, tracing startup
```

### 11) Milestones
- P0 skeleton: WS echo server that connects to ElevenLabs TTS and streams dummy text; capture TTFA metric.
- Add VAD + STT path; log stage timings.
- Add LLM streaming and initiate TTS early.
- Implement barge-in (detect speech, interrupt TTS, resume correctly).
- Wire fallback STT/TTS stacks.
- Run QA/load tests (50–100 simulated sessions) to tune chunking and flush policies.

### 12) Open Questions / To Decide
- Confirm Groq’s preferred streaming interface vs per-utterance HTTP and implement accordingly.
- Evaluate turn-taking models (pyannote vs WebRTC vs ONNX classifier) and choose default thresholds.
- Select local TTS model (VibeVoice 1.5B vs 7B) based on VRAM budgets.
- Prioritize which ElevenLabs Agents control events to ship in MVP vs defer.
- Continue to append findings, metrics, and code snippets as experiments land.

### Appendix — Diagrams
- A1) End-to-End Architecture (update when new modules land).
- A2) Turn Sequence (Streaming & Overlap) illustrating partial flush and barge-in cancellation.

## LiveKit POC (Side-by-Side Benchmark)

Objective: Build a minimal LiveKit Agents proof-of-concept using the same providers (Groq Whisper-large-v3-turbo STT, ElevenLabs Flash/Turbo TTS, chosen LLM) and benchmark TTFA, cancel-tail latency, and stage timings to compare against our Rust stack.

### A) Environment
- Run LiveKit Server locally (Docker) or in the cloud; create API key/secret.
- Configure `GROQ_API_KEY`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` (or Groq OpenAI-compatible endpoint) and optional `CEREBRAS_API_KEY`.
- Python ≥ 3.10 with `livekit-agents`, `livekit-agents[groq]`, `livekit-agents[elevenlabs]`, and `openai` installed.

### B) Minimal Agent (Python)

```python
# file: poc_livekit_agent.py
import asyncio, time, os
from livekit.agents import WorkerOptions, JobContext, cli
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.agents.tts import elevenlabs as lk_eleven
from livekit.agents.stt import groq as lk_groq
from livekit.agents.llm import openai as lk_openai

VOICE_ID = os.getenv("ELEVEN_VOICE", "elevenlabs/aria")
TTS_MODEL = os.getenv("ELEVEN_TTS_MODEL", "eleven_flash_v2_5")
STT_MODEL = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
LLM_BASE_URL = os.getenv("LLM_BASE_URL")
LLM_API_KEY = os.getenv("LLM_API_KEY", os.getenv("OPENAI_API_KEY"))

async def entry(ctx: JobContext):
    stt = lk_groq.STT(api_key=os.environ["GROQ_API_KEY"], model=STT_MODEL)
    tts = lk_eleven.TTS(
        api_key=os.environ["ELEVENLABS_API_KEY"],
        voice=VOICE_ID,
        model=TTS_MODEL,
        output_format="mp3_22050_32",
        auto_mode=True,
    )
    llm = lk_openai.LLM(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

    agent = VoicePipelineAgent(
        stt=stt,
        tts=tts,
        llm=llm,
        allow_interruptions=True,
        min_interruption_duration=0.5,
        min_interruption_words=2,
        vad="webrtc",
        vad_silence_ms=350,
    )

    t_last_eos = 0.0
    t_first_audio = 0.0

    @agent.on("user_turn_ended")
    async def _on_eos(_):
        nonlocal t_last_eos
        t_last_eos = time.perf_counter()

    @agent.on("agent_audio_chunk")
    async def _on_audio(_chunk):
        nonlocal t_first_audio
        if t_first_audio == 0.0:
            t_first_audio = time.perf_counter()
            ttfa = (t_first_audio - t_last_eos) * 1000
            print(f"TTFA: {ttfa:.1f} ms")

    @agent.on("interruption")
    async def _on_interrupt(_):
        print("INTERRUPT: barge-in detected; agent paused")

    await agent.run(ctx.room)

if __name__ == "__main__":
    cli.run_app(entry, WorkerOptions())
```

Run with environment variables set for LiveKit, Groq, ElevenLabs, and optional Groq LLM endpoint. Join via LiveKit web client to observe TTFA and interruption logs.

### C) Benchmark Plan
- Scenarios: single Q&A, rapid back-and-forth, long monologue, barge-in during long agent response, EN↔PT-BR code-switch.
- Metrics: TTFA, STT duration (audio length vs processing), LLM first-token latency, TTS first-byte latency, barge-in stop time, false interruption rate.
- Targets: TTFA < 1.0 s (stretch < 0.6 s), barge-in stop < 100 ms.

### D) What “Good” Looks Like
- Natural turn-taking with 300–500 ms pauses and minimal double-talk.
- Interruptions halt agent audio within ~100 ms and resume gracefully.
- Content parity with Rust pipeline and comparable audio quality.

### E) Compare vs Rust
- Run identical scenarios against the Rust backend; capture metrics for side-by-side comparison.
- If LiveKit meets targets faster, adopt select patterns; otherwise proceed with Rust plan for tighter latency and operational simplicity.

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
