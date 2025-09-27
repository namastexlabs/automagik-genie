LiveKit Docs › Recording & export › Overview

---

# Recording and export

> Use LiveKit's egress service to record or livestream a room.

## Introduction

LiveKit Egress gives you a powerful and consistent set of APIs to export any room or individual tracks from a LiveKit session.

It supports recording to a MP4 file or HLS segments, as well as exporting to livestreaming services like YouTube Live, Twitch, and Facebook via RTMP(s).

For LiveKit Cloud customers, Egress is ready to use with your project without additional configuration. When self-hosting LiveKit, Egress is a separate component that needs to be [deployed](https://docs.livekit.io/home/self-hosting/egress.md).

## Egress types

### Room composite egress

Export an entire room's video and/or audio using a web layout rendered by Chrome. Room composites are tied to a room's lifecycle, and will stop automatically when the room ends. Composition templates are customizable web pages that can be hosted anywhere.

Example use case: recording a meeting for team members to watch later.

### Web egress

Similar to Room Composite, but allows you to record and export any web page. Web Egress are not tied to LiveKit rooms, and can be used to record non-LiveKit content.

Example use case: restreaming content from a third-party source to YouTube and Twitch.

### Participant egress

Export a participant's video and audio together. This is a newer API and is designed to be easier to use than Track Composite Egress.

Example use case: record the teacher's video in an online class.

### Track composite egress

Sync and export up to one audio and one video track. Will transcode and mux.

Example use case: exporting audio+video from many cameras at once during a production, for use in additional post-production.

### Track egress

Export individual tracks directly. Video tracks are not transcoded.

Example use case: streaming an audio track to a captioning service via websocket.

## Service architecture

Depending on your request type, the egress service will either launch a web template in Chrome and connect to the room (room composite requests), or it will use the sdk directly (track and track composite requests). It uses GStreamer to encode, and can output to a file or to one or more streams.

![Egress instance](/images/diagrams/egress-instance.svg)

---

This document was rendered at 2025-09-27T09:36:35.097Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/overview.md](https://docs.livekit.io/home/egress/overview.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).