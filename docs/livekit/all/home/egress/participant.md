LiveKit Docs › Recording & export › Recording participants

---

# Recording participants

> Record participants individually with the Egress API.

Some use cases require participants to be recorded individually instead of compositing them. LiveKit offers two options for recording participants individually. Both options support a wide range of [output options](https://docs.livekit.io/home/egress/outputs.md).

See the [Egress examples](https://docs.livekit.io/home/egress/examples.md) page for example usage.

## Participant Egress

Participant Egress allows you to record a participant's audio and video tracks by providing the participant's identity. Participant Egress is designed to simplify the workflow of recording participants in a realtime session, and handles the changes in track state, such as when a track is muted.

When a Participant Egress is requested, the Egress service joins the room and waits for the participant to join and publish tracks. Recording begins as soon as either audio or video tracks are published. The service automatically handles muted or unpublished tracks and stops recording when the participant leaves the room.

You can also record a participant’s screen share along with the screen share's audio. To enable this, pass `screen_share=true` when starting the Egress. The Egress service will identify tracks based on their `source` setting.

## TrackComposite Egress

TrackComposite combines an audio and video track for output, as the name suggests.

It’s a more advanced version of Participant Egress, allowing you to specify which tracks to record — useful when precise control over track IDs is needed.

One key difference with TrackComposite is that tracks must be published before starting the Egress. As a result, there may be a slight delay between when the track is published and when recording begins.

## Examples

For examples on using Participant or Track Composite Egress, please reference [Egress examples](https://docs.livekit.io/home/egress/examples.md).

---

This document was rendered at 2025-09-27T09:36:35.361Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/participant.md](https://docs.livekit.io/home/egress/participant.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).