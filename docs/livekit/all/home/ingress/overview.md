LiveKit Docs › Stream import › Overview

---

# Stream import

> Use LiveKit's ingress service to bring live streams from non-WebRTC sources into LiveKit rooms.

## Introduction

LiveKit Ingress lets you import video from another source into a LiveKit room. While WebRTC is a versatile and scalable transport protocol for both media ingestion and delivery, some applications require integrating with existing workflows or equipment that do not support WebRTC. Perhaps your users want to publish video from OBS Studio or a dedicated hardware device, or maybe they want to stream the content of media file hosted on a HTTP server to a room. LiveKit Ingress makes these integrations easy.

LiveKit Ingress can automatically transcode the source media to ensure compatibility with LiveKit clients. It can publish multiple layers with [Simulcast](https://blog.livekit.io/an-introduction-to-webrtc-simulcast-6c5f1f6402eb/). The parameters of the different video layers can be defined at ingress creation time. Presets are provided to make encoding settings configuration easy. The optional ability to provide custom encoding parameters enables more specialized use cases.

For LiveKit Cloud customers, Ingress is ready to use with your project without additional configuration. When self-hosting LiveKit, Ingress is deployed as a separate service.

## Supported Sources

- RTMP/RTMPS
- WHIP
- Media files fetched from any HTTP server. The following media formats are supported:- HTTP Live Streaming (HLS)
- ISO MPEG-4 (MP4)
- Apple Quicktime (MOV)
- Matroska (MKV/WEBM)
- OGG audio
- MP3 audio
- M4A audio
- Media served by a SRT server

## Workflow

### WHIP / RTMP

A typical push Ingress goes like this:

1. Your app creates an Ingress with `CreateIngress` API, which returns a URL and stream key of the Ingress
2. Your user copies and pastes the URL and key into your streaming workflow
3. Your user starts their stream
4. The Ingress Service starts transcoding their stream, or forwards media unchanged if transcoding is disabled.
5. The Ingress Service joins the LiveKit room and publishes the media for other Participants
6. When the stream source disconnects from the Ingress service, the Ingress Service participant leaves the room.
7. The Ingress remains valid, in a disconnected state, allowing it to be reused with the same stream key

### URL Input

When pulling media from a HTTP or SRT server, Ingress has a slightly different lifecycle: it will start immediately after calling CreateIngress.

1. Your app creates an Ingress with `CreateIngress` API
2. The Ingress Service starts fetching the file or media and transcoding it
3. The Ingress Service joins the LiveKit room and publishes the transcoded media for other Participants
4. When the media is completely consumed, or if `DeleteIngress` is called, the Ingress Service participant leaves the room.

## API

### CreateIngress

#### WHIP / RTMP example

To provision an Ingress with the Ingress Service, use the CreateIngress API. It returns an `IngressInfo` object that describes the created Ingress, along with connection settings. These parameters can also be queried at any time using the `ListIngress` API

**LiveKit CLI**:

Create a file at `ingress.json` with the following content:

```json
{
    "input_type": 0 for RTMP, 1 for WHIP
    "name": "Name of the Ingress goes here",
    "room_name": "Name of the room to connect to",
    "participant_identity": "Unique identity for the room participant the Ingress service will connect as",
    "participant_name": "Name displayed in the room for the participant",
    "enable_transcoding": true // Transcode the input stream. Can only be false for WHIP,
}

```

Then create the Ingress using `lk`:

```shell
export LIVEKIT_URL=https://my-livekit-host
export LIVEKIT_API_KEY=livekit-api-key
export LIVEKIT_API_SECRET=livekit-api-secret

lk ingress create ingress.json

```

---

**JavaScript**:

```typescript
import { IngressClient, IngressInfo, IngressInput } from 'livekit-server-sdk';

const livekitHost = 'https://my-livekit-host';
const ingressClient = new IngressClient(livekitHost, 'api-key', 'secret-key');

const ingress = {
  name: 'my-ingress',
  roomName: 'my-room',
  participantIdentity: 'my-participant',
  participantName: 'My Participant',
  // Transcode the input stream. Can only be false for WHIP.
  enableTranscoding: false,
};

// Use IngressInput.WHIP_INPUT to create a WHIP endpoint
await ingressClient.createIngress(IngressInput.RTMP_INPUT, ingress);

```

---

**Go**:

```go
ctx := context.Background()
ingressClient := lksdk.NewIngressClient(
    "https://my-livekit-host",
    "livekit-api-key",
    "livekit-api-secret",
)

t := true

ingressRequest := &livekit.CreateIngressRequest{
    InputType:           livekit.IngressInput_RTMP_INPUT, // Or livekit.IngressInput_WHIP_INPUT
    Name:                "my-ingress",
    RoomName:            "my-room",
    ParticipantIdentity: "my-participant",
    ParticipantName:     "My Participant",
    // Transcode the input stream. Can only be false for WHIP.
    EnableTranscoding:   &t,
}

info, err := ingressClient.CreateIngress(ctx, ingressRequest)
ingressID := info.IngressId

```

---

**Ruby**:

```ruby
ingressClient = LiveKit::IngressServiceClient.new(url, api_key: "yourkey", api_secret: "yoursecret")
info = ingressClient.create_ingress(
  :RTMP_INPUT, # Or WHIP_INPUT
  name: "my-ingress",
  room_name: "my-room",
  participant_identity: "my-participant",
  participant_name: "My Participant",

)
puts info.ingress_id

```

#### URL Input example

With URL Input, Ingress will begin immediately after `CreateIngress` is called. URL_INPUT Ingress cannot be re-used.

**LiveKit CLI**:

Create a file at `ingress.json` with the following content:

```json
{
  "input_type": "URL_INPUT", // or 2
  "name": "Name of the Ingress goes here",
  "room_name": "Name of the room to connect to",
  "participant_identity": "Unique identity for the room participant the Ingress service will connect as",
  "participant_name": "Name displayed in the room for the participant",
  "url": "HTTP(S) or SRT url to the file or stream"
}

```

Then create the Ingress using `lk`:

```shell
export LIVEKIT_URL=https://my-livekit-host
export LIVEKIT_API_KEY=livekit-api-key
export LIVEKIT_API_SECRET=livekit-api-secret

lk ingress create ingress.json

```

---

**JavaScript**:

```typescript
import { IngressClient, IngressInfo, IngressInput } from 'livekit-server-sdk';

const livekitHost = 'https://my-livekit-host';
const ingressClient = new IngressClient(livekitHost, 'api-key', 'secret-key');

const ingress = {
  name: 'my-ingress',
  roomName: 'my-room',
  participantIdentity: 'my-participant',
  participantName: 'My Participant',
  url: 'https://domain.com/video.m3u8', // or 'srt://domain.com:7001'
};

await ingressClient.createIngress(IngressInput.URL_INPUT, ingress);

```

---

**Go**:

```go
ctx := context.Background()
ingressClient := lksdk.NewIngressClient(
    "https://my-livekit-host",
    "livekit-api-key",
    "livekit-api-secret",
)

ingressRequest := &livekit.CreateIngressRequest{
    InputType:           livekit.IngressInput_URL_INPUT,
    Name:                "my-ingress",
    RoomName:            "my-room",
    ParticipantIdentity: "my-participant",
    ParticipantName:     "My Participant",
    Url:                 "https://domain.com/video.m3u8", // or 'srt://domain.com:7001'
}

info, err := ingressClient.CreateIngress(ctx, ingressRequest)
ingressID := info.IngressId

```

---

**Ruby**:

```ruby
ingressClient = LiveKit::IngressServiceClient.new(url, api_key: "yourkey", api_secret: "yoursecret")
info = ingressClient.create_ingress(
  :URL_INPUT,
  name: "my-ingress",
  room_name: "my-room",
  participant_identity: "my-participant",
  participant_name: "My Participant",
  url: "https://domain.com/video.m3u8", # or 'srt://domain.com:7001'
)
puts info.ingress_id

```

### ListIngress

**LiveKit CLI**:

```shell
lk ingress list

```

The optional `--room` option allows to restrict the output to the Ingress associated to a given room. The `--id` option can check if a specific ingress is active.

---

**JavaScript**:

```js
await ingressClient.listIngress('my-room');

```

The `roomName` parameter can be left empty to list all Ingress.

---

**Go**:

```go
listRequest := &livekit.ListIngressRequest{
    RoomName:            "my-room",   // Optional parameter to restrict the list to only one room. Leave empty to list all Ingress.
}

infoArray, err := ingressClient.ListIngress(ctx, listRequest)

```

---

**Ruby**:

```ruby
puts ingressClient.list_ingress(
  # optional
  room_name: "my-room"
)

```

### UpdateIngress

The Ingress configuration can be updated using the `UpdateIngress` API. This enables the ability to re-use the same Ingress URL to publish to different rooms. Only reusable Ingresses, such as RTMP or WHIP, can be updated.

**LiveKit CLI**:

Create a file at `ingress.json` with the fields to be updated.

```json
{
  "ingress_id": "Ingress ID of the Ingress to update",
  "name": "Name of the Ingress goes here",
  "room_name": "Name of the room to connect to",
  "participant_identity": "Unique identity for the room participant the Ingress service will connect as",
  "participant_name": "Name displayed in the room for the participant"
}

```

The only required field is `ingress_id`. Non provided fields are left unchanged.

```shell
lk ingress update ingress.json

```

---

**JavaScript**:

```js
const update = {
  name: 'my-other-ingress',
  roomName: 'my-other-room',
  participantIdentity: 'my-other-participant',
  participantName: 'My Other Participant',
};

await ingressClient.updateIngress(ingressID, update);

```

Parameters left empty in the update object are left unchanged.

---

**Go**:

```go
updateRequest := &livekit.UpdateIngressRequest{
    IngressId:           "ingressID",        // required parameter indicating what Ingress to update
    Name:                "my-other-ingress",
    RoomName:            "my-other-room",
    ParticipantIdentity: "my-other-participant",
    ParticipantName:     "My Other Participant",
}

info, err := ingressClient.UpdateIngress(ctx, updateRequest)

```

Non specified fields are left unchanged.

---

**Ruby**:

```ruby
# only specified fields are updated, all fields are optional
puts ingressClient.update_ingress(
  "ingress-id",
  name: "ingress-name",
  room_name: "my-room",
  participant_identity: "my-participant",
  participant_name: "My Participant",
  audio: LiveKit::Proto::IngressAudioOptions.new(...),
  video: LiveKit::Proto::IngressVideoOptions.new(...),
)

```

### DeleteIngress

An Ingress can be reused multiple times. When not needed anymore, it can be deleted using the `DeleteIngress` API:

**LiveKit CLI**:

```shell
lk ingress delete <INGRESS_ID>

```

---

**JavaScript**:

```js
await ingressClient.deleteIngress('ingress_id');

```

---

**Go**:

```go
deleteRequest := &livekit.DeleteIngressRequest{
    IngressId:  "ingress_id",
}

info, err := ingressClient.DeleteIngress(ctx, deleteRequest)

```

---

**Ruby**:

```ruby
puts ingressClient.delete_ingress("ingress-id")

```

## Using video presets

The Ingress service can transcode the media being received. This is the only supported behavior for RTMP and URL inputs. WHIP ingresses are not transcoded by default, but transcoding can be enabled by setting the `enable_transcoding` parameter. When transcoding is enabled, The default settings enable [video simulcast](https://blog.livekit.io/an-introduction-to-webrtc-simulcast-6c5f1f6402eb/) to ensure media can be consumed by all viewers, and should be suitable for most use cases. In some situations however, adjusting these settings may be desirable to match source content or the viewer conditions better. For this purpose, LiveKit Ingress defines several presets, both for audio and video. Presets define both the characteristics of the media (codec, dimesions, framerate, channel count, sample rate) and the bitrate. For video, a single preset defines the full set of simulcast layers.

A preset can be chosen at Ingress creation time from the [constants in the Ingress protocol definition](https://github.com/livekit/protocol/blob/main/protobufs/livekit_ingress.proto):

**LiveKit CLI**:

Create a file at `ingress.json` with the following content:

```json
{
    "name": "Name of the egress goes here",
    "room_name": "Name of the room to connect to",
    "participant_identity": "Unique identity for the room participant the Ingress service will connect as",
    "participant_name": "Name displayed in the room for the participant"
    "video": {
        "name": "track name",
        "source": "SCREEN_SHARE",
        "preset": "Video preset enum value"
    },
    "audio": {
        "name": "track name",
        "source": "SCREEN_SHARE_AUDIO",
        "preset": "Audio preset enum value"
    }
}

```

Then create the Ingress using `lk`:

```shell
lk ingress create ingress.json

```

---

**JavaScript**:

```ts
const ingress: CreateIngressOptions = {
  name: 'my-ingress',
  roomName: 'my-room',
  participantIdentity: 'my-participant',
  participantName: 'My Participant',
  video: new IngressVideoOptions({
    source: TrackSource.SCREEN_SHARE,
    encodingOptions: {
      case: 'preset',
      value: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS,
    },
  }),
  audio: new IngressAudioOptions({
    source: TrackSource.SCREEN_SHARE_AUDIO,
    encodingOptions: {
      case: 'preset',
      value: IngressAudioEncodingPreset.OPUS_MONO_64KBS,
    },
  }),
};

await ingressClient.createIngress(IngressInput.RTMP_INPUT, ingress);

```

---

**Go**:

```go
ingressRequest := &livekit.CreateIngressRequest{
    Name:                "my-ingress",
    RoomName:            "my-room",
    ParticipantIdentity: "my-participant",
    ParticipantName:     "My Participant",
    Video: &livekit.IngressVideoOptions{
        EncodingOptions: &livekit.IngressVideoOptions_Preset{
            Preset: livekit.IngressVideoEncodingPreset_H264_1080P_30FPS_3_LAYERS,
        },
    },
    Audio: &livekit.IngressAudioOptions{
        EncodingOptions: &livekit.IngressAudioOptions_Preset{
            Preset: livekit.IngressAudioEncodingPreset_OPUS_MONO_64KBS,
        },
    },
}

info, err := ingressClient.CreateIngress(ctx, ingressRequest)
ingressID := info.IngressId

```

---

**Ruby**:

```ruby
video_options = LiveKit::Proto::IngressVideoOptions.new(
  name: "track name",
  source: :SCREEN_SHARE,
  preset: :H264_1080P_30FPS_3_LAYERS
)
audio_options = LiveKit::Proto::IngressAudioOptions.new(
  name: "track name",
  source: :SCREEN_SHARE_AUDIO,
  preset: :OPUS_STEREO_96KBPS
)
info = ingressClient.create_ingress(:RTMP_INPUT,
  name: 'dz-test',
  room_name: 'davids-room',
  participant_identity: 'ingress',
  video: video_options,
  audio: audio_options,
)
puts info.ingress_id

```

## Custom settings

For specialized use cases, it is also possible to specify fully custom encoding parameters. In this case, all video layers need to be defined if simulcast is desired.

**LiveKit CLI**:

Create a file at `ingress.json` with the following content:

```json
{
  "name": "Name of the egress goes here",
  "room_name": "Name of the room to connect to",
  "participant_identity": "Unique identity for the room participant the Ingress service will connect as",
  "participant_name": "Name displayed in the room for the participant",
  "video": {
    "options": {
"video_codec": "video codec ID from the [VideoCodec enum](https://github.com/livekit/protocol/blob/main/protobufs/livekit_models.proto)",
      "frame_rate": "desired framerate in frame per second",
      "layers": [
        {
          "quality": "ID for one of the LOW, MEDIUM or HIGH VideoQualitu definitions",
          "witdh": "width of the layer in pixels",
          "height": "height of the layer in pixels",
          "bitrate": "video bitrate for the layer in bit per second"
        }
      ]
    }
  },
  "audio": {
    "options": {
"audio_codec": "audio codec ID from the [AudioCodec enum](https://github.com/livekit/protocol/blob/main/protobufs/livekit_models.proto)",
      "bitrate": "audio bitrate for the layer in bit per second",
      "channels": "audio channel count, 1 for mono, 2 for stereo",
      "disable_dtx": "wether to disable the [DTX feature](https://www.rfc-editor.org/rfc/rfc6716#section-2.1.9) for the OPUS codec"
    }
  }
}

```

Then create the Ingress using `lk`:

```shell
lk ingress create ingress.json

```

---

**JavaScript**:

```ts
const ingress: CreateIngressOptions = {
  name: 'my-ingress',
  roomName: 'my-room',
  participantIdentity: 'my-participant',
  participantName: 'My Participant',
  enableTranscoding: true,
  video: new IngressVideoOptions({
    name: 'my-video',
    source: TrackSource.CAMERA,
    encodingOptions: {
      case: 'options',
      value: new IngressVideoEncodingOptions({
        videoCodec: VideoCodec.H264_BASELINE,
        frameRate: 30,
        layers: [
          {
            quality: VideoQuality.HIGH,
            width: 1920,
            height: 1080,
            bitrate: 4500000,
          },
        ],
      }),
    },
  }),
  audio: new IngressAudioOptions({
    name: 'my-audio',
    source: TrackSource.MICROPHONE,
    encodingOptions: {
      case: 'options',
      value: new IngressAudioEncodingOptions({
        audioCodec: AudioCodec.OPUS,
        bitrate: 64000,
        channels: 1,
      }),
    },
  }),
};

await ingressClient.createIngress(IngressInput.RTMP_INPUT, ingress);

```

---

**Go**:

```go
ingressRequest := &livekit.CreateIngressRequest{
    Name:                "my-ingress",
    RoomName:            "my-room:",
    ParticipantIdentity: "my-participant",
    ParticipantName:     "My Participant",
    Video: &livekit.IngressVideoOptions{
        EncodingOptions: &livekit.IngressVideoOptions_Options{
            Options: &livekit.IngressVideoEncodingOptions{
                VideoCodec: livekit.VideoCodec_H264_BASELINE,
                FrameRate:  30,
                Layers: []*livekit.VideoLayer{
                    &livekit.VideoLayer{
                        Quality: livekit.VideoQuality_HIGH,
                        Width:   1920,
                        Height:  1080,
                        Bitrate: 4_500_000,
                    },
                },
            },
        },
    },
    Audio: &livekit.IngressAudioOptions{
        EncodingOptions: &livekit.IngressAudioOptions_Options{
            Options: &livekit.IngressAudioEncodingOptions{
                AudioCodec: livekit.AudioCodec_OPUS,
                Bitrate:    64_000,
                Channels:   1,
            },
        },
    },
}

info, err := ingressClient.CreateIngress(ctx, ingressRequest)
ingressID := info.IngressId


```

---

**Ruby**:

```ruby
video_encoding_opts = LiveKit::Proto::IngressVideoEncodingOptions.new(
  frame_rate: 30,
)
# add layers as array
video_encoding_opts.layers += [
  LiveKit::Proto::VideoLayer.new(
    quality: :HIGH,
    width: 1920,
    height: 1080,
    bitrate: 4_500_000,
  )
]
video_options = LiveKit::Proto::IngressVideoOptions.new(
  name: "track name",
  source: :SCREEN_SHARE,
  options: video_encoding_opts,
)
audio_options = LiveKit::Proto::IngressAudioOptions.new(
  name: "track name",
  source: :SCREEN_SHARE_AUDIO,
  options: LiveKit::Proto::IngressAudioEncodingOptions.new(
    bitrate: 64000,
    disable_dtx: true,
    channels: 1,
  )
)
info = ingressClient.create_ingress(:RTMP_INPUT,
  name: 'dz-test',
  room_name: 'davids-room',
  participant_identity: 'ingress',
  video: video_options,
  audio: audio_options,
)
puts info.ingress_id

```

## Enabling transcoding for WHIP sessions

By default, WHIP ingress sessions forward incoming audio and video media unmodified from the source to LiveKit clients. This behavior allows the lowest possible end to end latency between the media source and the viewers. This however requires the source encoder to be configured with settings that are compatible with all the subscribers, and ensure the right trade offs between quality and reach for clients with variable connection quality. This is best achieved when the source encoder is configured with simulcast enabled.

If the source encoder cannot be setup easily to achieve such tradeoffs, or if the available uplink bandwidth is insufficient to send all required simulcast layers, WHIP ingresses can be configured to transcode the source media similarly to other source types. This is done by setting the `enable_transcoding` option on the ingress. The encoder settings can then be configured in the `audio` and `video` settings in the same manner as for other inputs types.

**LiveKit CLI**:

Create a file at `ingress.json` with the following content:

```json
{
    "input_type": 1 (WHIP only)
    "name": "Name of the egress goes here",
    "room_name": "Name of the room to connect to",
    "participant_identity": "Unique identity for the room participant the Ingress service will connect as",
    "participant_name": "Name displayed in the room for the participant",
    "enable_transcoding": true
    "video": {
        "name": "track name",
        "source": "SCREEN_SHARE",
        "preset": "Video preset enum value"
    },
    "audio": {
        "name": "track name",
        "source": "SCREEN_SHARE_AUDIO",
        "preset": "Audio preset enum value"
    }
}

```

Then create the Ingress using `lk`:

```shell
lk ingress create ingress.json

```

---

**JavaScript**:

```ts
const ingress: CreateIngressOptions = {
  name: 'my-ingress',
  roomName: 'my-room',
  participantIdentity: 'my-participant',
  participantName: 'My Participant',
  enableTranscoding: true,
  video: new IngressVideoOptions({
    source: TrackSource.SCREEN_SHARE,
    encodingOptions: {
      case: 'options',
      value: new IngressVideoEncodingOptions({
        videoCodec: VideoCodec.H264_BASELINE,
        frameRate: 30,
        layers: [
          {
            quality: VideoQuality.HIGH,
            width: 1920,
            height: 1080,
            bitrate: 4500000,
          },
        ],
      }),
    },
  }),
  audio: new IngressAudioOptions({
    source: TrackSource.MICROPHONE,
    encodingOptions: {
      case: 'options',
      value: new IngressAudioEncodingOptions({
        audioCodec: AudioCodec.OPUS,
        bitrate: 64000,
        channels: 1,
      }),
    },
  }),
};

await ingressClient.createIngress(IngressInput.WHIP_INPUT, ingress);

```

---

**Go**:

```go
t := true

ingressRequest := &livekit.CreateIngressRequest{
    InputType:           livekit.IngressInput_WHIP_INPUT
    Name:                "my-ingress",
    RoomName:            "my-room:",
    ParticipantIdentity: "my-participant",
    ParticipantName:     "My Participant",
    EnableTranscoding:   &t,
    Video: &livekit.IngressVideoOptions{
        EncodingOptions: &livekit.IngressVideoOptions_Options{
            Options: &livekit.IngressVideoEncodingOptions{
                VideoCodec: livekit.VideoCodec_H264_BASELINE,
                FrameRate:  30,
                Layers: []*livekit.VideoLayer{
                    &livekit.VideoLayer{
                        Quality: livekit.VideoQuality_HIGH,
                        Width:   1920,
                        Height:  1080,
                        Bitrate: 4_500_000,
                    },
                },
            },
        },
    },
    Audio: &livekit.IngressAudioOptions{
        EncodingOptions: &livekit.IngressAudioOptions_Options{
            Options: &livekit.IngressAudioEncodingOptions{
                AudioCodec: livekit.AudioCodec_OPUS,
                Bitrate:    64_000,
                Channels:   1,
            },
        },
    },
}

info, err := ingressClient.CreateIngress(ctx, ingressRequest)
ingressID := info.IngressId


```

---

**Ruby**:

```ruby
video_encoding_opts = LiveKit::Proto::IngressVideoEncodingOptions.new(
  frame_rate: 30,
)
# add layers as array
video_encoding_opts.layers += [
  LiveKit::Proto::VideoLayer.new(
    quality: :HIGH,
    width: 1920,
    height: 1080,
    bitrate: 4_500_000,
  )
]
video_options = LiveKit::Proto::IngressVideoOptions.new(
  name: "track name",
  source: :SCREEN_SHARE,
  options: video_encoding_opts,
)
audio_options = LiveKit::Proto::IngressAudioOptions.new(
  name: "track name",
  source: :SCREEN_SHARE_AUDIO,
  options: LiveKit::Proto::IngressAudioEncodingOptions.new(
    bitrate: 64000,
    disable_dtx: true,
    channels: 1,
  )
)

info = ingressClient.create_ingress(:WHIP_INPUT,
  name: 'dz-test',
  room_name: 'davids-room',
  participant_identity: 'ingress',
  enable_transcoding: true,
  video: video_options,
  audio: audio_options,
)
puts info.ingress_id

```

## Service architecture

LiveKit Ingress exposes public RTMP and WHIP endpoints streamers can connect to. On initial handshake, the Ingress service validates the incoming request and retrieves the corresponding Ingress metadata, including what LiveKit room the stream belongs to. The Ingress server then sets up a GStreamer based media processing pipeline to transcode the incoming media to a format compatible with LiveKit WebRTC clients, publishes the resulting media to the LiveKit room.

![Ingress instance](/images/diagrams/ingress-instance.svg)

---

This document was rendered at 2025-09-27T09:36:36.978Z.
For the latest version of this document, see [https://docs.livekit.io/home/ingress/overview.md](https://docs.livekit.io/home/ingress/overview.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).