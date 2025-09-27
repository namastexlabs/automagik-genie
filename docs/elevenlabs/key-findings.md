# ElevenLabs Key Findings for Automagik Hello

## Critical Documentation Links

- Main documentation index: `/docs/elevenlabs/main-llms.txt`
- Base URL: `https://elevenlabs.io/docs/`

## WebSocket Endpoints

### 1. TTS Streaming (`stream-input`)
- **Endpoint**: `wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input`
- **Key Features**:
  - Partial text input support
  - Audio consistency across chunks
  - Word-to-audio alignment
  - Configurable chunk scheduling
  - `flush: true` for immediate generation at turn boundaries

### 2. Conversational Agents Platform
- **Endpoint**: `wss://api.elevenlabs.io/v1/convai/conversation`
- **Key Features**:
  - Full duplex communication
  - VAD scores in real-time
  - Interruption handling
  - Tool calls support
  - Dynamic voice/prompt configuration

## Latency Optimization

### Model Performance
- **Flash v2.5**: ~75ms inference (RECOMMENDED for real-time)
- **Turbo v2.5**: Slightly slower but higher quality
- **v3 Alpha**: NOT suitable for real-time (high latency, requires prompt engineering)

### Regional TTFB
- **US**: 150-200ms
- **EU**: 230ms
- **Asia**: 250-440ms

### Voice Impact on Latency
1. Default/Synthetic voices (fastest)
2. Instant Voice Clones (IVC)
3. Professional Voice Clones (PVC) (slowest)

## Critical Parameters

### Chunk Scheduling
```json
{
  "chunk_length_schedule": [50, 100, 150, 200],
  "flush": true,  // Use at turn boundaries
  "auto_mode": true  // Reduces latency
}
```

### Connection Optimization
- Reuse SSL/TLS sessions
- Connection pooling
- 20-second inactivity timeout
- Send space character to keep alive

## Architecture Recommendations

### For Automagik Hello

1. **Primary Stack**:
   - Flash v2.5 for TTS
   - Raw WebSocket (not SDK) for hot path
   - Groq Whisper-large-v3-turbo for STT

2. **Turn Management**:
   - Use `flush: true` at conversation turns
   - Monitor VAD scores from Agent Platform
   - Implement 80ms barge-in response

3. **Buffer Strategy**:
   - Adaptive chunk scheduling based on latency requirements
   - 120-200ms chunks for optimal quality/latency balance

4. **Connection Strategy**:
   - Warm connections before first interaction
   - Regional routing based on user location
   - Fallback to local TTS/STT when APIs slow

## Integration Notes

### WebSocket Message Flow
1. Initialize with API key and voice settings
2. Send text chunks with optional flush
3. Receive audio chunks with alignment data
4. Handle connection lifecycle (20s timeout)

### Error Handling
- Rate limiting considerations
- Graceful degradation paths
- Connection retry logic
- Buffer overflow management

## Performance Targets

Based on ElevenLabs capabilities:
- **TTFB Target**: < 900ms (achievable with Flash + US region)
- **P99 Latency**: < 1200ms
- **Barge-in Response**: < 80ms
- **Connection Warm-up**: Saves 50-100ms on first response

## Important Limitations

### v3 Alpha
- Not for real-time applications
- Requires significant prompt engineering
- Better for pre-generated content
- Multi-speaker dialogue capable but high latency

### General Constraints
- 20-second inactivity timeout
- File size limits for batch processing
- API key required for all operations
- Regional server availability varies