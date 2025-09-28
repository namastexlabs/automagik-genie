# Environment Configuration (Template)

This is the single source of truth for all environment variables. Define them before implementation decisions are locked. Provide values via a local `.env` (git‑ignored) and CI/CD secrets for staging/prod. Never commit real keys.

## Conventions
- Names: UPPER_SNAKE_CASE
- Types: string | int (ms) | bool (`0/1` or `true/false`)
- Scope: [required], [optional], [experimental]

## Core Application
- APP_NAME [optional]: default `automagik-hello`
- APP_ENV [optional]: `dev|staging|prod` (default `dev`)
- SERVER_HOST [optional]: default `0.0.0.0`
- SERVER_PORT [optional]: default `8080`
- WS_MAX_CONNECTIONS [optional]: default `1000`
- LOG_LEVEL [optional]: `trace|debug|info|warn|error` (default `info`)
- LOG_FORMAT [optional]: `json|pretty` (default `json`)

## LLM Configuration
- LLM_MODEL [required]: `gpt-oss-120b` — for all providers (Groq, Cerebras, local)
- LLM_PROVIDER_ORDER [optional]: `groq,cerebras,local` — fallback order
- LLM_CONTEXT_WINDOW [optional]: default TBD — to be determined based on model limits
- LLM_STREAMING_STRATEGY [optional]: `sentence|clause` (default `sentence`)

## Observability
- OTEL_EXPORTER_OTLP_ENDPOINT [optional]: OTLP endpoint for traces/metrics
- PROMETHEUS_BIND_ADDR [optional]: e.g., `0.0.0.0:9464`
- TRACE_SAMPLE_RATE [optional]: `0.0–1.0` (default `0.1`)

## ElevenLabs TTS
- ELEVENLABS_API_KEY [required]: API key
- TTS_MODEL_ID [optional]: default `eleven_flash_v2_5` (use `eleven_turbo_v2_5` for quality)
- TTS_VOICE_ID [optional]: provider voice ID
- TTS_VOICE_TYPE [optional]: `default|ivc|pvc` (default voices are fastest)
- TTS_OUTPUT_FORMAT [optional]: `mp3_22050_32|pcm_44100|pcm_24000` (default `pcm_44100`)
- TTS_AUTO_MODE [optional]: `0|1` (default `1`) — disable chunk schedule for lowest latency
- TTS_REGION [optional]: provider region (pin for latency, e.g., `us`)
- TTS_WS_URL [optional]: override WS endpoint
- TTS_PARTIAL_FLUSH_MS [optional]: default `120` (ms)
- TTS_CHUNK_MS [optional]: default `160` (recommend 120–200)
- TTS_SPEED [optional]: `0.7–1.2` (default `1.0`)
- TTS_STABILITY [optional]: `0–1` (default `0.5`)
- TTS_SIMILARITY [optional]: `0–1` (default `0.75`)
- TTS_STYLE [optional]: `0–1` (default `0.0`)
- TTS_SPEAKER_BOOST [optional]: `0|1` (default `0`)
- TTS_KEEPALIVE_INTERVAL_MS [optional]: default `15000` — send a single space " " to keep WS alive; empty string closes connection
- TTS_FLUSH_ON_TURN_END [optional]: `0|1` (default `1`) — send `flush: true` at turn end to bound tail latency
- TTS_CHUNK_LENGTH_SCHEDULE [optional]: CSV of ints, e.g., `50,120,160,290` — only used if auto_mode=0
- TTS_INACTIVITY_TIMEOUT [optional]: default `20` (seconds, max 180)
- EXPERIMENTAL_TTS_V3 [experimental]: `0|1` (default `0`) — enable v3 alpha (not for real-time)
- EXPERIMENTAL_MULTI_CONTEXT [experimental]: `0|1` (default `0`) — use multi‑context WS for overlap experiments

## ASR (Speech‑to‑Text)
- ASR_PROVIDER [optional]: `groq|local` (default `groq`)
- GROQ_API_KEY [required if ASR_PROVIDER=groq]: API key
- ASR_MODEL_ID [optional]: default `whisper-large-v3-turbo` (216x speed, $0.04/hr)
- ASR_MODEL_FALLBACK [optional]: `whisper-large-v3` ($0.111/hr, higher accuracy)
- ASR_LANGUAGE [optional]: `auto|pt|en|...` (default `auto`)
- ASR_MIN_CONFIDENCE [optional]: default `0.6`
- ASR_ENDPOINT [optional]: override provider endpoint
- ASR_PARTIAL_TRIGGER_CONF [optional]: default `0.6` — begin TTS on partial hypothesis at or above this confidence
- LOCAL_WHISPER_MODEL [optional]: default `base` — for whisper.cpp fallback

## Turn‑Taking & Overlap
- VAD_STRATEGY [optional]: `webrtc|pyannote|silero|heuristics` (default `webrtc`) — `heuristics` keeps simple energy/threshold gating without external models
- VAD_AGGRESSIVENESS [optional]: `0|1|2|3` (default `2`) — WebRTC VAD aggressiveness
- VAD_FRAME_SIZE_MS [optional]: `10|20|30` (default `20`) — WebRTC constraint
- VAD_SILENCE_MS_MIN [optional]: default `300`
- VAD_SILENCE_MS_MAX [optional]: default `500`
- BARGE_IN_ENABLED [optional]: `0|1` (default `1`)
- CANCEL_TAIL_TIMEOUT_MS [optional]: default `80`
- OVERLAP_POLICY [optional]: `half_duplex|rapid_duplex|overlap_aware` (default `overlap_aware`)
- OVERLAP_STRATEGY [optional]: `repair_first|continuity_first` — both available for selection
- CANCEL_TAIL_MODE [optional]: `soft|hard` (default `soft`) — fade out vs abrupt stop on barge‑in
- CANCEL_TAIL_FADE_MS [optional]: default `60` — fade duration when `CANCEL_TAIL_MODE=soft`
- BACKCHANNEL_MIN_INTERVAL_MS [optional]: default `2000` — minimum ms between micro‑acknowledgements
- BACKCHANNEL_MAX_INTERVAL_MS [optional]: default `4000` — maximum ms between micro‑acknowledgements

## Region & Networking
- REGION [optional]: deployment region hint (e.g., `sa-east-1` for Brazil focus, or `us-east` for global)
- PIN_TTS_REGION [optional]: explicit TTS region pin (e.g., `us|eu`) — use when provider exposes regional endpoints
- PIN_ASR_REGION [optional]: explicit ASR region pin — use if ASR provider supports it
- WS_HEARTBEAT_MS [optional]: default `15000`
- WS_RECONNECT_BACKOFF_MS [optional]: default `500`

## Wishes & Artifacts
- WISH_ID [optional]: e.g., `baseline-voice`
- STRATEGY_NAME [optional]: e.g., `overlap_aware`
- A_B_BUCKET [optional]: `A|B` (default unset)
- ARTIFACTS_DIR [optional]: default `.genie/wishes/${WISH_ID}/qa`
- RECORD_AUDIO [optional]: `0|1` (default `0`) — consider storage/PII

## Limits & Safety
- MAX_TURNS [optional]: default `100`
- MAX_SESSION_SECONDS [optional]: default `900`
- RATE_LIMIT_TTS_TPS [optional]: default `20`
- RATE_LIMIT_ASR_TPS [optional]: default `20`
- REDACT_PII [optional]: `0|1` (default `1`)

## Audio Pipeline
- AUDIO_INPUT_FORMAT [required]: `pcm_16000` — user audio format (16kHz PCM)
- AUDIO_OUTPUT_FORMAT [optional]: `pcm_44100|pcm_24000` (default `pcm_44100`) — TTS output format
- AUDIO_FRAME_SIZE_MS [optional]: default `20` — audio frame size in ms
- AUDIO_BUFFER_CHUNKS [optional]: default `5` — number of chunks to buffer

## Tool Integration
- TOOL_CALL_TIMEOUT_MS [optional]: default `5000` — max time for client tool execution
- TOOL_RETRY_MAX [optional]: default `2` — max retries for failed tool calls
- TOOL_CONCURRENT_MAX [optional]: default `3` — max concurrent tool executions

## Demo UI (optional)
- DEMO_UI_PORT [optional]: default `3000`
- DEMO_AUDIO_SAMPLE_RATE [optional]: `24000|44100` (default `24000`)

## Example .env (development)
```env
APP_ENV=dev
SERVER_PORT=8080
LOG_LEVEL=debug

ELEVENLABS_API_KEY=your_xi_key
TTS_MODEL_ID=eleven_flash_v2_5
TTS_VOICE_ID=voice_XXXXXXXX
TTS_PARTIAL_FLUSH_MS=120
TTS_CHUNK_MS=160
TTS_KEEPALIVE_INTERVAL_MS=15000
TTS_FLUSH_ON_TURN_END=1
# Leave unset to use provider defaults; set to tighten TTFB at slight quality cost
# TTS_CHUNK_LENGTH_SCHEDULE=50,120,160,290
EXPERIMENTAL_TTS_V3=0
# EXPERIMENTAL_MULTI_CONTEXT=0

ASR_PROVIDER=groq
GROQ_API_KEY=your_groq_key
ASR_MODEL_ID=whisper-large-v3-turbo
ASR_MIN_CONFIDENCE=0.6
ASR_PARTIAL_TRIGGER_CONF=0.6

VAD_STRATEGY=heuristics
VAD_SILENCE_MS_MIN=300
VAD_SILENCE_MS_MAX=500
BARGE_IN_ENABLED=1
CANCEL_TAIL_TIMEOUT_MS=80
OVERLAP_POLICY=overlap_aware
CANCEL_TAIL_MODE=soft
CANCEL_TAIL_FADE_MS=60
BACKCHANNEL_MIN_INTERVAL_MS=2000
BACKCHANNEL_MAX_INTERVAL_MS=4000

WISH_ID=baseline-voice
ARTIFACTS_DIR=.genie/wishes/baseline-voice/qa

# Region
REGION=sa-east-1
# PIN_TTS_REGION=us
# PIN_ASR_REGION=us

# Audio Pipeline
AUDIO_INPUT_FORMAT=pcm_16000
AUDIO_OUTPUT_FORMAT=pcm_44100
AUDIO_FRAME_SIZE_MS=20
AUDIO_BUFFER_CHUNKS=5

# Tool Integration
TOOL_CALL_TIMEOUT_MS=5000
TOOL_RETRY_MAX=2
TOOL_CONCURRENT_MAX=3
```

## Notes
- Keep defaults conservative; prefer opt‑in for experimental features.
- Pin regions for latency; colocate infra with speech providers.
- Revisit values per wish and document deviations in `.genie/wishes/<wish-slug>/README.md`.

### Evidence (provider docs excerpts)
- WebSockets not available for `eleven_v3`; prefer `eleven_flash_v2_5` for latency; keepalive “ ”, flush to force buffered text:
  - @.cache/external/elevenlabs/elevenlabs.io_docs_websockets_llms.txt:12, :59–63, :296–300, :280–293
- Agents WS event families (mirror for compatibility):
  - @.cache/external/elevenlabs/elevenlabs.io_docs_agents-platform_customization_events_llms.txt:12–21
  - @.cache/external/elevenlabs/elevenlabs.io_docs_agents-platform_customization_events_client-events_llms.txt:41–88, :116–164
  - @.cache/external/elevenlabs/elevenlabs.io_docs_agents-platform_customization_events_client-to-server-events_llms.txt:23–38, :58–122
