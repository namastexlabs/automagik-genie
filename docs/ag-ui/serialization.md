# Stream Serialization

Based on AG-UI documentation for stream serialization protocols.

## Key Serialization Principles
- Create a standardized method for serializing and restoring event streams
- Enable chat history reload and agent state attachment
- Implement an append-only, immutable event log

## Core Technical Components

### 1. Event Stream Structure
- Uses a directed acyclic graph (DAG) model
- Each event can reference a `parentRunId`
- Supports branching conversation paths
- Preserves complete conversation history

### 2. Serialization Mechanism
```typescript
// Basic serialization pattern
const serialized = JSON.stringify(events);
const restored = JSON.parse(await storage.load(threadId));
const compacted = compactEvents(restored);
```

### 3. Event Compaction Rules
- Consolidate consecutive events
- Normalize message sequences
- Reduce redundant state updates
- Preserve semantic meaning of original events

### 4. Key Event Types
- `RunStartedEvent`: Tracks conversation branches
- `TEXT_MESSAGE_CONTENT`: Represents message fragments
- `STATE_DELTA`: Captures incremental state changes
- `STATE_SNAPSHOT`: Represents final state after compaction

### 5. Normalization Features
- Compact multiple events into minimal representations
- Remove redundant messages already in history
- Maintain a clean, efficient event stream

## Architecture Principles
The proposal emphasizes an immutable, append-only architecture that enables efficient storage, time travel, and complex conversation branching.

## Relevance to Automagik Hello
For voice agent session logging:
- Serialize conversation transcripts and audio streams
- Track voice agent state changes (STT/TTS pipeline status)
- Enable session replay for evaluation
- Compact voice events for efficient storage
- Support branching conversations with different strategies
- Preserve timing information for latency analysis