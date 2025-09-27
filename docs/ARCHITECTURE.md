# System Architecture

## Overview

Automagik Hello is a Rust-based real-time voice conversation system designed for ultra-low latency and human-like interactions.

## High-Level Architecture

```
┌──────────────┐     WebSocket      ┌─────────────────┐
│   Client     │◄──────────────────►│   Gateway       │
│   (Browser)  │   ElevenLabs       │   (Rust/Axum)   │
└──────────────┘   Protocol         └────────┬────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
         ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
         │   TTS Pipeline   │     │   STT Pipeline   │     │  Turn Manager    │
         │  (ElevenLabs)    │     │   (Groq/Local)   │     │   (VAD/ASD)      │
         └──────────────────┘     └──────────────────┘     └──────────────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │   Metrics Store  │
                                   │   (PostgreSQL)   │
                                   └──────────────────┘
```

## Core Components

### 1. WebSocket Gateway
- **Technology**: Rust with Tokio async runtime and Axum web framework
- **Protocol**: ElevenLabs Agents WebSocket (exact compatibility)
- **Responsibilities**:
  - Connection management with keepalive
  - Event routing and serialization
  - Circuit breaker for backend failures
  - Metrics collection per conversation

### 2. TTS Pipeline (Text-to-Speech)
- **Primary**: ElevenLabs Flash v2.5 via WebSocket stream-input
- **Fallback**: Local TTS for offline/edge cases
- **Key Features**:
  - Pre-warmed connections for < 300ms TTFB
  - Partial flush for natural speech flow
  - Chunk scheduling (120-200ms windows)
  - Fallback responses to prevent "None" cascades

### 3. STT Pipeline (Speech-to-Text)
- **Primary**: Groq Whisper-large-v3-turbo (216x realtime)
- **Fallback**: Local WhisperX or faster-whisper
- **Processing**:
  - 16kHz PCM input format
  - Streaming recognition with partial results
  - Confidence scoring (threshold: 0.6)
  - Language auto-detection

### 4. Turn Management
- **VAD (Voice Activity Detection)**:
  - WebRTC VAD (baseline, 10-20ms latency)
  - UltraVAD planned (natural turn-end detection)
- **Turn-Taking Logic**:
  - 250-350ms silence buffer
  - Barge-in support with tail cancellation
  - Backchannel injection ("mm-hmm", "certo")
- **Overlap Strategies**:
  - `overlap_aware` mode (default)
  - Soft cancel with 60ms fade

## Data Flow

### User Speech → Agent Response

```
1. Client captures audio (16kHz PCM)
   ↓
2. WebSocket frames to Gateway
   ↓
3. VAD detects speech boundaries
   ↓
4. STT processes audio → transcript
   ↓
5. LLM generates response (not shown - external)
   ↓
6. TTS converts text → audio (44.1kHz PCM)
   ↓
7. WebSocket frames to Client
   ↓
8. Client plays audio via AudioWorklet
```

### Timing Requirements

| Stage | Target | Critical Threshold |
|-------|--------|-------------------|
| VAD Detection | < 20ms | 30ms |
| STT Processing | < 150ms | 300ms |
| TTS First Byte | < 200ms | 300ms |
| Interruption Response | < 80ms | 120ms |
| Turn Transition | < 300ms | 450ms |

## Connection Lifecycle

```
Client Connect
     ↓
WSS Handshake
     ↓
conversation_initiation_client_data
     ↓
conversation_initiation_metadata
     ↓
Ping/Pong Loop (15s interval)
     ↓
Audio Streaming ←→ Event Exchange
     ↓
Connection Close
```

## Metrics Collection

All metrics follow ElevenLabs conversation API schema:

```json
{
  "conversation_id": "uuid",
  "duration": 120.5,
  "message_count": 24,
  "metrics": {
    "ttfb_ms": [250, 280, 310],
    "asr_confidence": [0.85, 0.92, 0.78],
    "none_responses": 0,
    "interruptions": 3,
    "turn_transitions": 12
  }
}
```

## Failure Handling

### Circuit Breaker Pattern
```rust
if consecutive_failures > 2 {
    return fallback_response("Desculpe, vou transferir você");
}
```

### Connection Resilience
- Automatic reconnection with exponential backoff
- State recovery from last event_id
- Warm connection pool maintenance

### Quality Degradation
- Switch to faster/lower quality models on poor connections
- Reduce audio quality for bandwidth constraints
- Disable non-essential features (backchannels)

## Deployment Architecture

```
┌──────────────┐
│ Load Balancer│ (AWS ALB / Fly.io proxy)
└──────┬───────┘
       │
┌──────▼───────┐     ┌──────────────┐
│   Instance   │────►│  PostgreSQL  │
│  (sa-east-1) │     │    (Neon)    │
└──────────────┘     └──────────────┘
       │
       ├── ElevenLabs API (us-east)
       ├── Groq API (global)
       └── Local Whisper (fallback)
```

### Region Strategy
- **Primary**: sa-east-1 (São Paulo) for Brazilian users
- **Provider Latency**:
  - User → Server: 10-30ms
  - Server → ElevenLabs: 150-200ms
  - Server → Groq: 100-150ms
- **Total Budget**: 335-455ms infrastructure + processing

## Security Considerations

- No PII in logs (redaction hooks)
- API keys in environment variables only
- Rate limiting per connection
- Prompt injection detection
- WebSocket frame validation

## Observability

### Tracing
- OpenTelemetry with correlation IDs
- Per-turn trace spans
- Distributed tracing to providers

### Metrics
- Prometheus exposition format
- Grafana dashboards for visualization
- Key metrics: TTFB, ASR confidence, failure rate

### Logging
- Structured JSON logs
- Log levels: trace, debug, info, warn, error
- Correlation across conversation turns

## Evolution Path

### Phase 0 (Current)
Basic pipeline with production-informed patterns

### Phase 1
Full ElevenLabs compatibility with metrics

### Phase 2
UltraVAD integration for natural turn-taking

### Phase 3
Multi-tenant support and management APIs

### Phase 4
Global edge deployment

## Key Design Decisions

1. **Rust over Python/Node**: Predictable latency, memory safety
2. **WebSocket over HTTP**: Real-time streaming, lower overhead
3. **Raw WebSocket over SDK**: Fine control over timing
4. **Flash v2.5 over v3**: WebSocket support, proven latency
5. **Groq over OpenAI**: Cost-effective, fast inference
6. **Brazil-first**: Optimize for target market
