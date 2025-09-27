# AG-UI Documentation for Automagik Hello

This directory contains critical AG-UI documentation focused on streaming protocols, mid-run events, and session logging - all relevant for building Automagik Hello's real-time voice agent framework.

## Documentation Files

### [activity-events.md](./activity-events.md)
**Mid-run Agent Progress Tracking**
- Real-time activity snapshots and delta events
- Progress tracking for long-running agent tasks
- **Voice Agent Applications**: Track STT/TTS pipeline status, latency metrics, turn-taking decisions

### [serialization.md](./serialization.md)
**Stream Serialization Protocol**
- Event stream serialization and state recovery
- Append-only, immutable event logs with DAG structure
- **Voice Agent Applications**: Session replay, conversation branching, timing analysis

### [interrupts.md](./interrupts.md)
**Interrupt Handling**
- Standardized interrupt/resume lifecycle for agent execution
- Human-in-the-loop workflows and error recovery
- **Voice Agent Applications**: Barge-in handling, ASR clarification, policy enforcement

### [events.md](./events.md)
**Core Event System**
- Streaming event architecture with Start-Content-End and Snapshot-Delta patterns
- Real-time structured communication between agents and frontends
- **Voice Agent Applications**: Audio streaming, speech events, real-time metrics

### [fastapi-integration.md](./fastapi-integration.md)
**FastAPI WebSocket Integration**
- WebSocket integration patterns (note: original docs not found, concepts inferred)
- Real-time communication and state management
- **Voice Agent Applications**: Low-latency audio streaming, live metrics broadcasting

## Key Insights for Automagik Hello

### 1. Event-Driven Architecture
AG-UI's event system provides patterns that can be adapted for voice agents:
- **AudioStreamEvents**: For real-time audio processing
- **SpeechEvents**: For turn-taking and speech detection
- **LatencyEvents**: For TTFB and performance monitoring
- **QualityEvents**: For ASR confidence and TTS artifacts

### 2. Real-Time Progress Tracking
The activity events system can track voice pipeline progress:
- STT processing status and confidence scores
- TTS generation progress and TTFB metrics
- Turn-taking decision points and barge-in detection
- Strategy switching and overlap handling

### 3. Session Serialization
The serialization approach enables:
- Complete conversation replay for evaluation
- Branching conversations with different strategies
- Timing preservation for latency analysis
- State recovery after network interruptions

### 4. Interrupt Handling for Voice
The interrupt system maps well to voice-specific scenarios:
- **Barge-in**: Interrupt TTS when user starts speaking
- **Clarification**: Pause when ASR confidence drops
- **Escalation**: Transfer to human agent when needed
- **Error Recovery**: Handle STT/TTS failures gracefully

### 5. Low-Latency Considerations
For sub-second voice interactions:
- Process events in order with minimal buffering
- Handle out-of-order audio packets gracefully
- Maintain event processing under 100ms
- Optimize JSON serialization for speed

## Implementation Recommendations

1. **Adopt Event Patterns**: Use Start-Content-End for audio streams and Snapshot-Delta for state updates
2. **Real-Time Metrics**: Implement activity events for live TTFB and quality monitoring
3. **Session Recovery**: Use serialization patterns for conversation persistence and replay
4. **Interrupt Integration**: Adapt interrupt handling for voice-specific barge-in and error scenarios
5. **WebSocket Architecture**: Follow AG-UI patterns for low-latency real-time communication

These patterns provide a solid foundation for building Automagik Hello's real-time voice agent architecture with proper event handling, state management, and performance monitoring.