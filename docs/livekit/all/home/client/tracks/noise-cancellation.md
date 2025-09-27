LiveKit Docs › LiveKit SDKs › Realtime media › Noise & echo cancellation

---

# Noise & echo cancellation

> Achieve crystal-clear audio for video conferencing and voice AI.

## Overview

Your user's microphone is likely to pick up undesirable audio including background noise (like traffic, music, voices, etc) and might also pick up echoes from their own speakers. In both cases, this noise leads to a poor experience for other participants in a call. In voice AI apps, this can also interfere with turn detection or degrade the quality of transcriptions, both of which are critical to a good user experience.

LiveKit includes default outbound noise and echo cancellation based on the underlying open source WebRTC implementations of [`echoCancellation`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/echoCancellation) and [`noiseSuppression`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings/noiseSuppression). You can adjust these settings with the `AudioCaptureOptions` type in the LiveKit SDKs during connection.

LiveKit Cloud includes [enhanced noise cancellation](https://docs.livekit.io/home/cloud/noise-cancellation.md) for the best possible audio quality, including a background voice cancellation (BVC) model that is optimized for voice AI applications.

To hear the effects of the various noise removal options, play the samples below:

---

This document was rendered at 2025-09-27T09:36:29.473Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/tracks/noise-cancellation.md](https://docs.livekit.io/home/client/tracks/noise-cancellation.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).