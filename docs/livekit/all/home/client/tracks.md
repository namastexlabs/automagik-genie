LiveKit Docs › LiveKit SDKs › Realtime media › Overview

---

# Realtime media

> Audio and video media exchange between participants.

## Overview

LiveKit provides realtime media exchange between participants using tracks. Each participant can [publish](https://docs.livekit.io/home/client/tracks/publish.md) and [subscribe](https://docs.livekit.io/home/client/tracks/subscribe.md) to as many tracks as makes sense for your application.

### Audio tracks

Audio tracks are typically published from your microphone and played back on the other participants' speakers. You can also produce custom audio tracks, for instance to add background music or other audio effects.

AI agents can consume an audio track to perform speech-to-text, and can publish their own audio track with synthesized speech or other audio effects.

### Video tracks

Video tracks are usually published from a webcam or other video source, and rendered on the other participants' screens within your application's UI. LiveKit also supports screen sharing, which commonly results in two video tracks from the same participant.

AI agents can subscribe to video tracks to perform vision-based tasks, and can publish their own video tracks with synthetic video or other visual effects.

## Example use cases

The following examples demonstrate how to model your application for different use cases.

### AI voice agent

Each room has two participants: an end-user and an AI agent. They can have a natural conversation with the following setup:

- **End-user**: publishes their microphone track and subscribes to the AI agent's audio track
- **AI agent**: subscribes to the user's microphone track and publishes its own audio track with synthesized speech

The UI may be a simple audio visualizer showing that the AI agent is speaking.

### Video conference

Each room has multiple users. Each user publishes audio and/or video tracks and subscribes to all tracks published by others. In the UI, the room is typically displayed as a grid of video tiles.

### Livestreaming

Each room has one broadcaster and a significant number of viewers. The broadcaster publishes audio and video tracks. The viewers subscribe to the broadcaster's tracks but do not publish their own. Interaction is typically performed with a chat component.

An AI agent may also join the room to publish live captions.

### AI camera monitoring

Each room has one camera participant that publishes its video track, and one agent that monitors the camera feed and calls out to an external API to take action based on contents of the video feed (e.g. send an alert).

Alternatively, one room can have multiple cameras and an agent that monitors all of them, or an end-user could also optionally join the room to monitor the feeds alongside the agent.

---

This document was rendered at 2025-09-27T09:36:28.617Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/tracks.md](https://docs.livekit.io/home/client/tracks.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).