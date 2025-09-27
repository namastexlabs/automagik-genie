LiveKit Docs › Recording & export › Composite & web recordings

---

# Composite and web recordings

> LiveKit web-based recorder gives you flexible compositing options.

## Composite recording

Composite recordings use a web-based recorder to capture a composited view of a room, including all participants, interactions, and any customized UI elements from the application.

We provide two options for composite recording:

- **RoomComposite**: A composite recording that is tied to a room's lifecycle. When all of the participants leave the room, the recording would stop automatically.
- **Web**: A standalone composite recording can be started and stopped independently of a room’s lifecycle. Web Egress can be used to record any web-based content, even if it’s not part of a LiveKit room.

## RoomComposite Egress

One common requirement when recording a room is to capture all of the participants and interactions that take place. This can be challenging in a multi-user application, where different users may be joining, leaving, or turning their cameras on and off. It may also be desirable for the recording to look as close to the actual application experience as possible, capturing the richness and interactivity of your application.

A `RoomComposite` Egress uses a web app to create the composited view, rendering the output with an instance of headless Chromium. In most cases, your existing LiveKit application can be used as a compositing template with few modifications.

### Default layouts

We provide a few default compositing layouts that works out of the box. They'll be used by default if a custom template URL is not passed in. These templates are deployed alongside and served by the Egress service ([source](https://github.com/livekit/egress/tree/main/template-default)).

While it's a great starting point, you can easily [create your own layout](https://docs.livekit.io/home/egress/custom-template.md) using standard web technologies that you are already familiar with.

| Layout | Preview |
| **grid** | ![undefined]() |
| **speaker** | ![undefined]() |
| **single-speaker** | ![undefined]() |

Additionally, you can use a `-light` suffix to change background color to white. i.e. `grid-light`.

### Output options

Composite recordings can output to a wide variety of formats and destinations. The options are described in detail in [Output options](https://docs.livekit.io/home/egress/outputs.md).

### Audio-only composite

If your application is audio-only, you can export a mixed audio file containing audio from all participants in the room. To start an audio-only composite, pass `audio_only=true` when starting an Egress.

## Web Egress

Web egress allows you to record or stream any website. Similar to room composite egress, it uses headless Chromium to render output. Unlike room composite egress, you can supply any url, and the lifecycle of web egress is not attached to a LiveKit room.

## Examples

For examples on using composite recordings, see [Egress examples](https://docs.livekit.io/home/egress/examples.md).

---

This document was rendered at 2025-09-27T09:36:33.975Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/composite-recording.md](https://docs.livekit.io/home/egress/composite-recording.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).