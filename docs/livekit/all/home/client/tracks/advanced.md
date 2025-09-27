LiveKit Docs › LiveKit SDKs › Realtime media › Codecs & more

---

# Codecs and more

> Advanced audio and video topics.

## Video codec support

LiveKit supports multiple video codecs to suit different application needs:

- H.264
- VP8
- VP9 (including SVC)
- AV1 (including SVC)

Scalable Video Coding (SVC) is a feature of newer codecs like VP9 and AV1 that provides the following benefits:

- Improves bitrate efficiency by letting higher quality layers leverage information from lower quality layers.
- Enables instant layer switching without waiting for keyframes.
- Incorporates multiple spatial (resolution) and temporal (frame rate) layers in a single stream.

When using VP9 or AV1, SVC is automatically activated with L3T3_KEY `scalabilityMode` (three spatial and temporal layers).

You can specify which codec to use when connecting to a room. To learn more, see the examples in the following sections.

## Video quality presets

LiveKit provides preset resolutions when creating video tracks. These presets include common resolutions and aspect ratios:

- h720 (1280x720)
- h540 (960x540)
- h360 (640x360)
- h180 (320x180)

The presets also include recommended bitrates and framerates for optimal quality. You can use these presets or define custom parameters based on your needs.

**React**:

```js
const localParticipant = useLocalParticipant();

const audioTrack = await createLocalAudioTrack();
const audioPublication = await localParticipant.publishTrack(audioTrack, {
  red: false,
});

```

---

**JavaScript**:

```js
const audioTrack = await createLocalAudioTrack();
const audioPublication = await room.localParticipant.publishTrack(audioTrack, {
  red: false,
});

```

## Video track configuration

LiveKit provides extensive control over video track settings through two categories:

- Capture settings: Device selection and capabilities (resolution, framerate, facing mode).
- Publish settings: Encoding parameters (bitrate, framerate, simulcast layers).

Here's how to configure these settings:

**JavaScript**:

```typescript
// Room defaults
const room = new Room({
  videoCaptureDefaults: {
    deviceId: '',
    facingMode: 'user',
    resolution: {
      width: 1280,
      height: 720,
      frameRate: 30,
    },
  },
  publishDefaults: {
    videoEncoding: {
      maxBitrate: 1_500_000,
      maxFramerate: 30,
    },
    videoSimulcastLayers: [
      {
        width: 640,
        height: 360,
        encoding: {
          maxBitrate: 500_000,
          maxFramerate: 20,
        },
      },
      {
        width: 320,
        height: 180,
        encoding: {
          maxBitrate: 150_000,
          maxFramerate: 15,
        },
      },
    ],
  },
});

// Individual track settings
const videoTrack = await createLocalVideoTrack({
  facingMode: 'user',
  resolution: VideoPresets.h720,
});
const publication = await room.localParticipant.publishTrack(videoTrack);

```

---

**Swift**:

```swift
// Room defaults
var room = Room(
  delegate: self,
  roomOptions: RoomOptions(
    defaultCameraCaptureOptions: CameraCaptureOptions(
      position: .front,
      dimensions: .h720_169,
      fps: 30,
    ),
    defaultVideoPublishOptions: VideoPublishOptions(
      encoding: VideoEncoding(
        maxBitrate: 1_500_000,
        maxFps: 30,
      ),
      simulcastLayers: [
        VideoParameters.presetH180_169,
        VideoParameters.presetH360_169,
      ]
    ),
  )
)

// Individual track
let videoTrack = try LocalVideoTrack.createCameraTrack(options: CameraCaptureOptions(
  position: .front,
  dimensions: .h720_169,
  fps: 30,
))
let publication = localParticipant.publishVideoTrack(track: videoTrack)

```

## Video simulcast

Simulcast enables publishing multiple versions of the same video track with different bitrate profiles. This allows LiveKit to dynamically forward the most suitable stream based on each recipient's bandwidth and preferred resolution.

LiveKit will automatically select appropriate layers when it detects bandwidth constraints, upgrading to higher resolutions as conditions improve.

Simulcast is enabled by default in all LiveKit SDKs and can be disabled in publish settings if needed.

## Dynacast

Dynamic broadcasting (Dynacast) automatically pauses video layer publication when they aren't being consumed by subscribers. For simulcasted video, if subscribers only use medium and low-resolution layers, the high-resolution publication is paused.

To enable this bandwidth optimization:

**JavaScript**:

```typescript
const room = new Room({
  dynacast: true
});

```

---

**Swift**:

```swift
let room = Room(
  delegate: self,
  roomOptions: RoomOptions(
    dynacast: true
  )
)

```

---

**Android**:

```kotlin
val options = RoomOptions(
  dynacast = true
)
var room = LiveKit.create(
  options = options
)

```

---

**Flutter**:

```dart
var room = Room(
  roomOptions: RoomOptions(
    dynacast: true
  ),
)

```

With SVC codecs (VP9 and AV1), Dynacast can only pause entire streams, not individual layers, due to SVC encoding characteristics.

## Hi-fi audio

For high-quality audio streaming, LiveKit provides several configuration options to optimize audio quality.

#### Recommended hi-fi settings

For high-quality audio, we provide a preset with our recommended settings:

**React**:

```js
const localParticipant = useLocalParticipant();

const audioTrack = await createLocalAudioTrack({
  channelCount: 2,
  echoCancellation: false,
  noiseSuppression: false,
});
const audioPublication = await localParticipant.publishTrack(audioTrack, {
  audioPreset: AudioPresets.musicHighQualityStereo,
  dtx: false,
  red: false,
});

```

---

**JavaScript**:

```js
const audioTrack = await createLocalAudioTrack({
  channelCount: 2,
  echoCancellation: false,
  noiseSuppression: false,
});

const audioPublication = await room.localParticipant.publishTrack(audioTrack, {
  audioPreset: AudioPresets.musicHighQualityStereo,
  dtx: false,
  red: false,
});

```

#### Maximum quality settings

LiveKit supports audio tracks up to 510kbps stereo - the highest theoretical quality possible. Note that the listener's playback stack may resample the audio, so actual playback quality may be lower than published quality. For comparison, 256kbps AAC-encoded audio is considered high quality for music streaming services like Spotify.

**React**:

```js
const localParticipant = useLocalParticipant();

const audioTrack = await createLocalAudioTrack({
  channelCount: 2,
  echoCancellation: false,
  noiseSuppression: false,
});
const audioPublication = await localParticipant.publishTrack(audioTrack, {
  audioBitrate: 510000,
  dtx: false,
  red: false,
});

```

---

**JavaScript**:

```js
const audioTrack = await createLocalAudioTrack({
  channelCount: 2,
  echoCancellation: false,
  noiseSuppression: false,
});

const audioPublication = await room.localParticipant.publishTrack(audioTrack, {
  audioBitrate: 510000,
  dtx: false,
  red: false,
});

```

If you configure a high bitrate, we recommend testing under real-world conditions to find what settings work best for your use case.

## Audio RED

REDundant Encoding is a technique to improve audio quality by sending multiple copies of the same audio data in different packets. This is useful in lossy networks where packets may be dropped. The receiver can then use the redundant packets to reconstruct the original audio packet.

Redundant encoding increases bandwidth usage in order to achieve higher audio quality. LiveKit recommends enabling this feature because audio glitches are so distracting that the tradeoff is almost always worth it. If your use case prioritizes bandwidth and can tolerate audio glitches, you can disable RED.

#### Disabling Audio RED when publishing

You can disable Audio RED when publishing new audio tracks:

**React**:

```js
const localParticipant = useLocalParticipant();

const audioTrack = await createLocalAudioTrack();
const audioPublication = await localParticipant.publishTrack(audioTrack, {
  red: false,
});

```

---

**JavaScript**:

```js
const audioTrack = await createLocalAudioTrack();
const audioPublication = await room.localParticipant.publishTrack(audioTrack, {
  red: false,
});

```

---

**Swift**:

```swift
let audioTrack = LocalAudioTrack.createTrack()
let audioPublication = room.localParticipant.publish(audioTrack: audioTrack, options: AudioPublishOptions(red: false))

```

---

**Android**:

```kotlin
val audioTrack = localParticipant.createAudioTrack()
coroutineScope.launch {
  val publication = localParticipant.publishAudioTrack(
      track = localAudioTrack,
      red = false
  )
}

```

---

This document was rendered at 2025-09-27T09:36:28.929Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/tracks/advanced.md](https://docs.livekit.io/home/client/tracks/advanced.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).