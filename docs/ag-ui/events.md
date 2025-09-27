# Event System

Based on AG-UI documentation for the core event system architecture.

## Event System Architecture Overview
- Streaming, event-based communication protocol between agents and frontends
- Enables real-time, structured interactions through discrete event types

## Key Event Categories
1. **Lifecycle Events**
2. **Text Message Events**
3. **Tool Call Events**
4. **State Management Events**
5. **Special Events**
6. **Draft Events**

## Core Design Principles
- Events follow predictable patterns (Start-Content-End, Snapshot-Delta)
- Each event type has a specific purpose and structured properties
- Supports incremental data transmission and real-time updates

## Primary Event Patterns

### Start-Content-End
Used for streaming content:
- Start: Initialize a new content stream
- Content: Incremental content updates
- End: Finalize the content stream

### Snapshot-Delta
Used for state synchronization:
- Snapshot: Complete state at a point in time
- Delta: Incremental changes to state

### Lifecycle
Tracks agent run progression:
- Run started
- Run in progress
- Run finished/interrupted

## Key Technical Characteristics
- Unique identifiers link related events
- Supports granular progress tracking
- Enables transparent agent actions
- Provides flexible extension mechanisms

## Event Processing Guidelines
- Process events in received order
- Handle events with matching IDs as logical streams
- Design for potential out-of-order delivery
- Implement resilient error handling

## Protocol Benefits
The protocol provides a comprehensive framework for dynamic, real-time agent-frontend communication, emphasizing flexibility, transparency, and efficient data transmission.

## Relevance to Automagik Hello
For real-time voice agent communication:

### Voice-Specific Event Types
- **AudioStreamEvents**: STT input/TTS output streams
- **SpeechEvents**: Start/end of user/agent speech
- **LatencyEvents**: TTFB, processing time metrics
- **QualityEvents**: ASR confidence, TTS artifacts
- **TurnEvents**: Turn-taking decisions, barge-in detection

### Voice Event Patterns
- **Audio-Start-Content-End**: For streaming audio chunks
- **Speech-Snapshot-Delta**: For transcript updates
- **Metrics-Lifecycle**: For performance tracking

### Processing Considerations
- Handle out-of-order audio packets gracefully
- Maintain low-latency event processing (< 100ms)
- Support real-time metrics collection
- Enable live conversation monitoring and debugging