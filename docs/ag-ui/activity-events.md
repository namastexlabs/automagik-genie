# Activity Events - Mid-run Agent Progress Tracking

Based on AG-UI documentation for activity events and mid-run agent progress tracking.

## Key Technical Components

### 1. Event Types
- **ActivitySnapshotEvent**: Provides complete activity state at a moment
- **ActivityDeltaEvent**: Offers incremental updates via JSON Patch operations

### 2. Event Structure
```typescript
type ActivitySnapshotEvent = {
  type: EventType.ACTIVITY_SNAPSHOT
  messageId: string
  activityType: string
  content: Record<string, any>
}

type ActivityDeltaEvent = {
  type: EventType.ACTIVITY_DELTA
  messageId: string
  activityType: string
  patch: JSONPatchOperation[]
}
```

### 3. Message Type
```typescript
type ActivityMessage = {
  id: string
  role: "activity"
  activityType: string
  content: Record<string, any>
}
```

## Core Objectives
- Enable real-time visibility into agent progress
- Support flexible, extensible activity tracking
- Allow chronological interleaving with chat messages

## Rendering Strategies
- **Generic renderer**: Displays raw snapshot/patch data
- **Custom renderer**: Framework-specific visualization per activity type

## Example Use Case
A web search agent can emit activity events showing:
- Initial search sources and their status
- Progressive updates as sources are processed
- Final search results or completion status

## Key Implementation Considerations
- Supports serialization and session recovery
- Allows custom activity type definitions
- Provides cross-framework compatibility

## Relevance to Automagik Hello
This system could be adapted for real-time voice agent progress tracking:
- Track STT processing status
- Monitor TTS generation progress
- Show turn-taking decision points
- Log TTFB and latency metrics in real-time
- Expose barge-in and overlap detection events