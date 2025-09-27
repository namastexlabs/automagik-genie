LiveKit Docs › LiveKit SDKs › Realtime media › Processing raw tracks

---

# Processing raw media tracks

> How to read, process, and publish raw media tracks and files.

## Overview

LiveKit's [server-side SDKs](https://docs.livekit.io/home/client.md#server-side-sdks) give you full control over how media is processed and published. You can work directly with participant tracks or media files to apply custom processing.

A typical media-processing workflow involves three steps:

1. Iterate over frames from a stream or file.
2. Apply processing logic to each frame.
3. Publish or save the processed output.

## Subscribing to participant tracks

When you subscribe to participant tracks, the SDK handles frame segmentation automatically. You can construct an `AudioStream` or `VideoStream` from any participant track. The media streams are asynchronous iterators that deliver individual audio or video frames. You can process these frames and either publish them back to the room or save them.

The diagram below shows the process of subscribing to a participant track. The same applies to video.

```mermaid
flowchart TD
AudioTrack --> AudioStream
subgraph Loop
AudioStream -->|async for| AudioFrame
AudioFrame -->|loop| AudioStream
end
AudioFrame --> Logic(Consume frames)
```

For example, iterate through an audio stream:

```python
stream = rtc.AudioStream(track, sample_rate=SAMPLE_RATE, num_channels=NUM_CHANNELS)
async for frame_event in stream:
   frame = frame_event.frame
   # ... do something with frame.data ...

```

The following example demonstrates how iterate through audio frames from a participant track and publish them back to the room. The same principles apply to video tracks.

- **[Local audio device example](https://github.com/livekit-examples/local-audio-python)**: Python app that demonstrates how to publish microphone audio, and receive and play back audio from other participants.

## Publishing local audio files

When reading a local audio file, you must manually handle chunking and resampling before processing or output. For audio files, determine the number of channels and sample rate; this information is required to produce correct output audio. Split the audio into fixed-size chunks (WebRTC commonly uses 20 ms chunks) and create an audio frame for each chunk.

The input and output sample rates must match to ensure correct playback speed and fidelity. When subscribing to a participant track, LiveKit automatically handles any required resampling. However, when reading from a local file, you are responsible for resampling if needed.

See the following for a detailed example.

- **[Read and write audio files](https://github.com/livekit-examples/noise-canceller)**: This tool allows you to read a local audio file, process it with noise filtering, and save the output to a local file.

## Publishing media

Publishing audio or video to a room requires creating a local track and an audio or video source. For audio, push audio frames to the `AudioSource`. The `LocalAudioTrack` object is used to publish the audio source as a track. All subscribed participants hear the published track

For example, publish audio from a microphone:

```python
self.source = rtc.AudioSource(SAMPLE_RATE, NUM_CHANNELS)
track = rtc.LocalAudioTrack.create_audio_track("mic", source)
options = rtc.TrackPublishOptions()
options.source = rtc.TrackSource.SOURCE_MICROPHONE
publication = await room.local_participant.publish_track(track, options)

```

The diagram below shows the process of publishing audio to a room. The same applies to video.

```mermaid
flowchart TD
Generate(generate frames) --> AudioFrame
subgraph Loop
AudioFrame -->|capture| AudioSource
AudioSource -->|loop| AudioFrame
end
AudioSource --> AudioTrack
```

### Saving media to a file

You can save audio or video to a file by pushing frames to an array and then writing the array to a file. For example, to create a `WAV` file from an audio stream, you can use the following code:

```python
import wave

output_file = "output.wav"

# Create a list to store processed audio frames
processed_frames = []

# Push audio frames to the list
async for audio_event in stream:
    processed_frames.append(audio_event.frame)

# Write the audio frames to the file
with wave.open(output_file, "wb") as wav_file:
    wav_file.setnchannels(CHANNELS)
    wav_file.setsampwidth(2)  # 16-bit
    wav_file.setframerate(SAMPLERATE)
    
    for frame_data in processed_frames:
        wav_file.writeframes(frame_data)

```

## Process media with the Agents Framework

You can build and dispatch a programmatic participant with the Agents Framework. You can use the framework to create the following:

- An AI agent that can be automatically or explicitly dispatched to rooms.
- A programmatic participant that's automatically dispatched to rooms.

Use the Agents Framework [`entrypoint`](https://docs.livekit.io/agents/worker/job.md#entrypoint) function for your audio processing logic.

To learn more, see the following links.

- **[Agents Framework](https://docs.livekit.io/agents.md)**: Build voice AI agents and programmatic participants to process and publish media from the backend.

- **[Echo Agent](https://github.com/livekit/agents/blob/main/examples/primitives/echo-agent.py)**: An example that uses the `entrypoint` function to echo back audio from a participant track.

---

This document was rendered at 2025-09-27T09:36:30.008Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/tracks/raw-tracks.md](https://docs.livekit.io/home/client/tracks/raw-tracks.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).