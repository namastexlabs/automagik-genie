LiveKit Docs › Recording & export › Recording individual tracks

---

# Track egress

> Track egress allows you export a single track without transcoding.

## Overview

TrackEgress is the simplest way to export individual tracks to cloud storage or a server via WebSocket.

Tracks are exported as is, without transcoding. The following containers will be used depending on track codec:

- H.264: MP4
- VP8: WebM
- Opus: Ogg

Note: Track Egress only exports one track, either video or audio. If you want to export video and audio together, use [Track Composite Egress](https://docs.livekit.io/home/egress/track-composite.md).

### Example

See an example of exporting to Azure Blob Storage on the [example page](https://docs.livekit.io/home/egress/examples.md#exporting-individual-tracks-without-transcode).

## Stream audio to WebSocket

You can add custom stream processing by starting a TrackEgress to your WebSocket server. This will give you a realtime streaming export of your audio tracks. (WebSocket streaming is only available for audio tracks).

The tracks will be exported as raw PCM data. This format is compatible with most transcription services.

- Format: `pcm_s16le`
- Content-Type: `audio/x-raw`
- Sample rate: matches incoming, typically 48kHz

When a `TrackEgressRequest` is started with a WebSocket URL, we'll initiate a WebSocket session to the designated URL. We recommend using query parameters in the URL in order to help you identify the track. For example: `wss://your-server.com/egress?trackID=<trackID>&participant=<participantIdentity>`

We'll send a combination of binary and text frames. Binary frames would contain audio data. Text frames will contain end user events on the tracks. For example: if the track was muted, you will receive the following:

```json
{ "muted": true }

```

And when unmuted:

```json
{ "muted": false }

```

The WebSocket connection will terminate when the track is unpublished (or if the participant leaves the room).

**JavaScript**:

```typescript
const info = await egressClient.startTrackEgress(
  'my-room',
  'wss://my-websocket-server.com',
  trackID,
);
const egressID = info.egressId;

```

---

**Go**:

```go
trackRequest := &livekit.TrackEgressRequest{
  RoomName:  "my-room",
  TrackId:   "speaker",
  Output: &livekit.TrackEgressRequest_WebsocketUrl{
    WebsocketUrl: "wss://my-websocket-server.com",
  },
}

info, err := egressClient.StartTrackEgress(ctx, trackRequest)
egressID := info.EgressId

```

---

**Ruby**:

```ruby
info = egressClient.start_track_egress(
    'room-name',
    'wss://my-websocket-server.com',
    'TR_XXXXXXXXXXXX',
)
puts info

```

---

**LiveKit CLI**:

```json
{
  "room_name": "my-room",
  "track_id": "TR_XXXXXXXXXXXX",
  "websocket_url": "wss://my-websocket-server.com"
}

```

```shell
lk egress start --type track request.json

```

```shell
Egress started. Egress ID: EG_XXXXXXXXXXXX

```

---

This document was rendered at 2025-09-27T09:36:35.624Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/track.md](https://docs.livekit.io/home/egress/track.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).