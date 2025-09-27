# FastAPI WebSocket Integration

Note: The original FastAPI documentation page was not found (404 error). This document provides integration concepts based on the AG-UI event system architecture.

## WebSocket Integration Concepts

Based on the AG-UI event system, a FastAPI WebSocket integration would likely include:

### Connection Management
```python
from fastapi import FastAPI, WebSocket
from ag_ui import EventStream

app = FastAPI()

@app.websocket("/agent")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    event_stream = EventStream(websocket)

    try:
        async for event in event_stream:
            # Process incoming events
            await handle_event(event)
    except WebSocketDisconnect:
        # Handle disconnection
        pass
```

### Event Broadcasting
```python
class EventBroadcaster:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket

    async def send_lifecycle_event(self, event_type: str, data: dict):
        await self.websocket.send_json({
            "type": event_type,
            "timestamp": time.time(),
            "data": data
        })

    async def send_activity_snapshot(self, activity_type: str, content: dict):
        await self.websocket.send_json({
            "type": "ACTIVITY_SNAPSHOT",
            "activityType": activity_type,
            "content": content
        })
```

### State Management
```python
class AgentSession:
    def __init__(self, session_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.websocket = websocket
        self.state = {}
        self.event_log = []

    async def update_state(self, delta: dict):
        # Apply state delta
        self.state.update(delta)

        # Send state update event
        await self.websocket.send_json({
            "type": "STATE_DELTA",
            "sessionId": self.session_id,
            "delta": delta
        })
```

## Relevance to Automagik Hello

### Voice Agent WebSocket Implementation
```python
@app.websocket("/voice-agent")
async def voice_agent_endpoint(websocket: WebSocket):
    await websocket.accept()

    # Initialize voice pipeline
    voice_agent = VoiceAgent(websocket)

    try:
        async for audio_chunk in websocket.iter_bytes():
            # Process audio input
            await voice_agent.process_audio(audio_chunk)
    except WebSocketDisconnect:
        await voice_agent.cleanup()
```

### Real-time Metrics Streaming
```python
class VoiceMetricsStream:
    async def send_ttfb_metric(self, ttfb_ms: float):
        await self.websocket.send_json({
            "type": "VOICE_METRIC",
            "metric": "ttfb",
            "value": ttfb_ms,
            "timestamp": time.time()
        })

    async def send_asr_confidence(self, confidence: float, transcript: str):
        await self.websocket.send_json({
            "type": "ASR_EVENT",
            "confidence": confidence,
            "transcript": transcript,
            "timestamp": time.time()
        })
```

### Integration Notes
- FastAPI provides excellent WebSocket support for real-time communication
- AG-UI event patterns can be mapped to WebSocket message formats
- State management and event serialization are key for session persistence
- Error handling and reconnection logic are critical for voice applications
- Low-latency requirements demand efficient JSON serialization and minimal overhead