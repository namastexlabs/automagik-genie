# Naming Conventions

## Overview

Consistent naming across the Automagik Hello project to avoid confusion.

## Project Names

### Repository
- **GitHub**: `pags-11labs-voiceagent`
- **Local**: `pags-11labs-voiceagent/`

### Product
- **Marketing Name**: Automagik Hello
- **Documentation**: "Automagik Hello"
- **Never use**: "AutoMagik", "automagik hello", "Automagic"

### Binary/Package
- **Rust binary**: `automagik-hello`
- **Docker image**: `automagik-hello`
- **Process name**: `automagik-hello`

## Environment Variables

### Prefix
- **Application**: `AH_` (Automagik Hello)
- **Never use**: `AUTOMAGIK_`, `HELLO_`

### Format
- **Style**: UPPER_SNAKE_CASE
- **Examples**:
  - `AH_SERVER_PORT`
  - `AH_LOG_LEVEL`
  - `ELEVENLABS_API_KEY` (provider-specific keep original)
  - `GROQ_API_KEY` (provider-specific keep original)

## File & Directory Names

### Directories
- **Style**: kebab-case
- **Examples**:
  - `docs/`
  - `.agent-os/`
  - `experiments/`
  - `voice-agents/` (if needed)

### Markdown Files
- **Style**: kebab-case.md
- **Examples**:
  - `production-insights.md`
  - `websocket-protocol.md`
  - `getting-started.md`

### Rust Files
- **Style**: snake_case.rs
- **Examples**:
  - `main.rs`
  - `websocket_handler.rs`
  - `tts_pipeline.rs`

## Code Naming

### Rust
```rust
// Modules: snake_case
mod websocket_handler;

// Structs: PascalCase
struct VoicePipeline;

// Functions: snake_case
fn process_audio_chunk() {}

// Constants: UPPER_SNAKE_CASE
const MAX_CONNECTIONS: usize = 1000;

// Variables: snake_case
let audio_buffer = Vec::new();
```

### Configuration
```toml
# TOML keys: snake_case
server_port = 8080
log_level = "info"
```

### JSON (API/WebSocket)
```json
{
  // Keys: snake_case (matching ElevenLabs)
  "conversation_id": "conv_xxx",
  "agent_response": "Hello",
  "audio_base_64": "..."
}
```

## Experiments

### Naming Pattern
- **Format**: `AH-XXX` where XXX is a number
- **Examples**:
  - `AH-001` (baseline)
  - `AH-002` (rapid duplex)
  - `AH-003` (diarization)

### Directory Structure
```
experiments/
├── AH-001/
│   └── qa/
│       ├── conversation.json
│       ├── metrics.json
│       └── report.md
```

## Documentation Headers

### Product Docs
```markdown
# Product Mission
```

### Technical Docs
```markdown
# WebSocket Protocol Reference
```

### Experiment Reports
```markdown
# Experiment AH-001: Baseline Analysis
```

## Version Tags

### Format
- **Style**: `vX.Y.Z`
- **Examples**:
  - `v0.1.0` (initial release)
  - `v1.0.0` (production ready)
  - `v1.2.3-alpha` (pre-release)

## Branch Names

### Format
- **Feature**: `feature/description`
- **Fix**: `fix/description`
- **Experiment**: `experiment/ah-xxx`
- **Examples**:
  - `feature/ultravad-integration`
  - `fix/none-response-cascade`
  - `experiment/ah-002`

## Logging

### Log Levels
- **Format**: lowercase
- **Values**: `trace`, `debug`, `info`, `warn`, `error`

### Log Fields
```json
{
  "timestamp": "2025-09-27T10:30:00Z",
  "level": "info",
  "conversation_id": "conv_xxx",
  "message": "TTS request",
  "ttfb_ms": 250
}
```

## Metrics

### Metric Names
- **Format**: snake_case with units
- **Examples**:
  - `ttfb_ms`
  - `asr_confidence`
  - `none_response_count`
  - `success_rate_percent`

## Quick Reference

| Context | Convention | Example |
|---------|------------|---------|
| Product Name | Title Case | Automagik Hello |
| Binary | kebab-case | automagik-hello |
| Env Prefix | UPPER_SNAKE | AH_SERVER_PORT |
| Rust Module | snake_case | tts_pipeline |
| Rust Struct | PascalCase | VoicePipeline |
| JSON Key | snake_case | conversation_id |
| Experiment | AH-XXX | AH-001 |
| Directory | kebab-case | voice-agents/ |
| Markdown | kebab-case.md | getting-started.md |

## Common Mistakes to Avoid

❌ **Wrong**:
- AutoMagik Hello
- automagik_hello (binary)
- AUTOMAGIK_SERVER_PORT
- TTSPipeline (should be TtsPipeline)
- conversationId (JSON should be snake_case)

✅ **Correct**:
- Automagik Hello
- automagik-hello
- AH_SERVER_PORT
- TtsPipeline
- conversation_id