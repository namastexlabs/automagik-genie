LiveKit Docs › Recording & export › Examples

---

# Egress examples

> Usage examples for Egress APIs to record or livestream a room or individual tracks.

## Recording room composite as HLS

This example records a [room composite](https://docs.livekit.io/home/egress/composite-recording.md#roomcomposite-egress) layout as HLS segments to an S3-compatible bucket.

**LiveKit CLI**:

> ℹ️ **Note**
> 
> When `live_playlist_name` is provided, a playlist is generated containing only the last few segments. This can be useful to livestream the recording via HLS.

```json
{
  "room_name": "my-room",
  "layout": "grid",
  "preset": "H264_720P_30",
  "custom_base_url": "https://my-custom-template.com",
  "audio_only": false,
  "segment_outputs": [
    {
      "filename_prefix": "path/to/my-output",
      "playlist_name": "my-output.m3u8",
      "live_playlist_name": "my-output-live.m3u8",
      "segment_duration": 2,
      "s3": {
        "access_key": "",
        "secret": "",
        "region": "",
        "bucket": "my-bucket",
        "force_path_style": true
      }
    }
  ]
}

```

```shell
lk egress start --type room-composite egress.json

```

---

**JavaScript**:

```typescript
const outputs = {
  segments: new SegmentedFileOutput({
    filenamePrefix: 'my-output',
    playlistName: 'my-output.m3u8',
    livePlaylistName: 'my-output-live.m3u8',
    segmentDuration: 2,
    output: {
      case: 's3',
      value: {
        accessKey: '',
        secret: '',
        bucket: '',
        region: '',
        forcePathStyle: true,
      },
    },
  }),
};
const egressClient = new EgressClient('https://myproject.livekit.cloud');
await egressClient.startRoomCompositeEgress('my-room', outputs, {
  layout: 'grid',
  customBaseUrl: 'https://my-custom-template.com',
  encodingOptions: EncodingOptionsPreset.H264_1080P_30,
  audioOnly: false,
});

```

---

**Go**:

```go
req := &livekit.RoomCompositeEgressRequest{
  RoomName: "my-room-to-record",
  Layout: "speaker",
  AudioOnly: false,
  CustomBaseUrl: "https://my-custom-template.com",
  Options: &livekit.RoomCompositeEgressRequest_Preset{
    Preset: livekit.EncodingOptionsPreset_PORTRAIT_H264_1080P_30,
  },
}
req.SegmentOutputs = []*livekit.SegmentedFileOutput{
  {
    FilenamePrefix: "my-output",
    PlaylistName: "my-output.m3u8",
    LivePlaylistName: "my-output-live.m3u8",
    SegmentDuration: 2,
    Output: &livekit.SegmentedFileOutput_S3{
      S3: &livekit.S3Upload{
        AccessKey: "",
        Secret: "",
        Endpoint: "",
        Bucket: "",
        ForcePathStyle: true,
      },
    },
  },
}
egressClient := lksdk.NewEgressClient(
  "https://project.livekit.cloud",
  os.Getenv("LIVEKIT_API_KEY"),
  os.Getenv("LIVEKIT_API_SECRET"),
)
res, err := egressClient.StartRoomCompositeEgress(context.Background(), req)

```

---

**Ruby**:

```ruby
outputs = [
  LiveKit::Proto::SegmentedFileOutput.new(
    filename_prefix: "my-output",
    playlist_name: "my-output.m3u8",
    live_playlist_name: "my-output-live.m3u8",
    segment_duration: 2,
    s3: LiveKit::Proto::S3Upload.new(
      access_key: "",
      secret: "",
      endpoint: "",
      region: "",
      bucket: "my-bucket",
      force_path_style: true,
    )
  )
]
egress_client = LiveKit::EgressClient.new("https://myproject.livekit.cloud")
egress_client.start_room_composite_egress(
  'my-room',
  outputs,
  layout: 'speaker',
  custom_base_url: 'https://my-custom-template.com',
  encoding_options: LiveKit::Proto::EncodingOptionsPreset::H264_1080P_30,
  audio_only: false
)

```

---

**Python**:

```python
from livekit import api

req = api.RoomCompositeEgressRequest(
    room_name="my-room",
    layout="speaker",
    custom_base_url="http://my-custom-template.com",
    preset=api.EncodingOptionsPreset.H264_720P_30,
    audio_only=False,
    segment_outputs=[api.SegmentedFileOutput(
        filename_prefix="my-output",
        playlist_name="my-playlist.m3u8",
        live_playlist_name="my-live-playlist.m3u8",
        segment_duration=2,
        s3=api.S3Upload(
            bucket="my-bucket",
            region="",
            access_key="",
            secret="",
            force_path_style=True,
        ),
    )],
)
lkapi = api.LiveKitAPI("http://localhost:7880")
res = await lkapi.egress.start_room_composite_egress(req)

```

---

**Java**:

```java
import io.livekit.server.EgressServiceClient;
import io.livekit.server.EncodedOutputs;
import retrofit2.Call;
import retrofit2.Response;
import livekit.LivekitEgress;

import java.io.IOException;

public class Main {
    public void startEgress() throws IOException {
        EgressServiceClient ec = EgressServiceClient.createClient(
            "https://myproject.livekit.cloud", "apiKey", "secret");

        LivekitEgress.SegmentedFileOutput segmentOutput = LivekitEgress.SegmentedFileOutput.newBuilder().
                setFilenamePrefix("my-segmented-file").
                setPlaylistName("my-playlist.m3u8").
                setLivePlaylistName("my-live-playlist.m3u8").
                setSegmentDuration(2).
                setS3(LivekitEgress.S3Upload.newBuilder()
                        .setBucket("")
                        .setAccessKey("")
                        .setSecret("")
                        .setForcePathStyle(true)).
                build();

        Call<LivekitEgress.EgressInfo> call = ec.startRoomCompositeEgress(
                "my-room",
                segmentOutput,
                // layout
                "speaker",
                LivekitEgress.EncodingOptionsPreset.H264_720P_30,
                // not using advanced encoding options, since preset is specified
                null,
                // not audio-only
                false,
                // not video-only
                false,
                // using custom template, leave empty to use defaults
                "https://my-templates.com");
        Response<LivekitEgress.EgressInfo> response = call.execute();
        LivekitEgress.EgressInfo egressInfo = response.body();
    }
}

```

## Recording web in portrait

This example records a [web page](https://docs.livekit.io/home/egress/composite-recording.md#web-egress) in portrait mode to Google Cloud Storage, streaming to RTMP.

Portrait orientation can be specified by either using a `preset` option or setting `advanced` options. Egress automatically resizes the Chrome compositor to your specified resolution. However, keep in mind the following requirements:

- Chrome has a minimum browser width of 500px.
- Your application must maintain a portrait layout, even when the browser reports a width larger than typical mobile phones. (for example, 720px width or larger).

**LiveKit CLI**:

```json
{
  "url": "https://my-page.com",
  "preset": "PORTRAIT_H264_720P_30",
  "audio_only": false,
  "file_outputs": [
    {
      "filepath": "my-test-file.mp4",
      "gcp": {
        "credentials": "{\"type\": \"service_account\", ...}",
        "bucket": "my-bucket"
      }
    }
  ],
  "stream_outputs": [
    {
      "protocol": "RTMP",
      "urls": ["rtmps://my-rtmp-server.com/live/stream-key"]
    }
  ]
}

```

```bash
lk egress start --type web egress.json

```

---

**JavaScript**:

```typescript
import * as fs from 'fs';

const content = fs.readFileSync('/path/to/credentials.json');
const outputs = {
  file: new EncodedFileOutput({
    filepath: 'my-recording.mp4',
    output: {
      case: 'gcp',
      value: new GCPUpload({
        // credentials need to be a JSON encoded string containing credentials
        credentials: content.toString(),
        bucket: 'my-bucket',
      }),
    },
  }),
  stream: new StreamOutput({
    protocol: StreamProtocol.RTMP,
    urls: ['rtmp://example.com/live/stream-key'],
  }),
};
await egressClient.startWebEgress('https://my-site.com', outputs, {
  encodingOptions: EncodingOptionsPreset.PORTRAIT_H264_1080P_30,
  audioOnly: false,
});

```

---

**Go**:

```go
credentialsJson, err := os.ReadFile("/path/to/credentials.json")
if err != nil {
  panic(err.Error())
}
req := &livekit.WebEgressRequest{
  Url: "https://my-website.com",
  AudioOnly: false,
  Options: &livekit.WebEgressRequest_Preset{
    Preset: livekit.EncodingOptionsPreset_PORTRAIT_H264_1080P_30,
  },
}
req.FileOutputs = []*livekit.EncodedFileOutput{
  {
    Filepath: "myfile.mp4",
    Output: &livekit.EncodedFileOutput_Gcp{
              Gcp: &livekit.GCPUpload{
                  Credentials: string(credentialsJson),
                  Bucket:      "my-bucket",
              },
          },
  },
}
req.StreamOutputs = []*livekit.StreamOutput{
  {
    Protocol: livekit.StreamProtocol_RTMP,
    Urls: []string{"rtmp://myserver.com/live/stream-key"},
  },
}
res, err := egressClient.StartWebEgress(context.Background(), req)

```

---

**Ruby**:

```ruby
content = File.read("/path/to/credentials.json")
outputs = [
  LiveKit::Proto::EncodedFileOutput.new(
    filepath: "myfile.mp4",
    s3: LiveKit::Proto::S3Upload.new(
      credentials: content,
      bucket: "my-bucket"
    )
  ),
  LiveKit::Proto::StreamOutput.new(
    protocol: LiveKit::Proto::StreamProtocol::RTMP,
    urls: ["rtmp://myserver.com/live/stream-key"]
  )
]

egress_client.start_web_egress(
  'https://my-website.com',
  outputs,
  encoding_options: LiveKit::Proto::EncodingOptionsPreset::PORTRAIT_H264_1080P_30,
  audio_only: false
)

```

---

**Python**:

```python
content = ""
with open("/path/to/credentials.json", "r") as f:
    content = f.read()

file_output = api.EncodedFileOutput(
    filepath="myfile.mp4",
    gcp=api.GCPUpload(
        credentials=content,
        bucket="my-bucket",
    ),
)
req = api.WebEgressRequest(
    url="https://my-site.com",
    preset=EncodingOptionsPreset.PORTRAIT_H264_1080P_30,
    audio_only=False,
    file_outputs=[file_output],
    stream_outputs=[api.StreamOutput(
        protocol=api.StreamProtocol.RTMP,
        urls=["rtmp://myserver.com/live/stream-key"],
    )],
)

res = await lkapi.egress.start_web_egress(req)

```

---

**Java**:

```java
public void startEgress() throws IOException {
    EgressServiceClient ec = EgressServiceClient.createClient(
        "https://myproject.livekit.cloud", "apiKey", "secret");

    // We recommend using Google's auth library (google-auth-library-oauth2-http) to load their credentials file.
    GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream("path/to/credentials.json"));

    LivekitEgress.SegmentedFileOutput segmentOutput = LivekitEgress.SegmentedFileOutput.newBuilder().
            setFilenamePrefix("my-segmented-file").
            setPlaylistName("my-playlist.m3u8").
            setLivePlaylistName("my-live-playlist.m3u8").
            setSegmentDuration(2).
            setGcp(LivekitEgress.GCPUpload.newBuilder()
                    .setBucket("")
                    .setCredentials(credentials.toString())
            ).
            build();
    LivekitEgress.StreamOutput streamOutput = LivekitEgress.StreamOutput.newBuilder().
            setProtocol(LivekitEgress.StreamProtocol.RTMP).
            addUrls("rtmps://myserver.com/live/stream-key").
            build();

    EncodedOutputs outputs = new EncodedOutputs(
            // no file output
            null,
            streamOutput,
            segmentOutput,
            // no image output
            null
    );

    Call<LivekitEgress.EgressInfo> call = ec.startWebEgress(
            "https://my-site.com",
            outputs,
            LivekitEgress.EncodingOptionsPreset.PORTRAIT_H264_720P_30,
            // not using advanced encoding options, since preset is specified
            null,
            // not audio-only
            false,
            // not video-only
            false,
            // wait for console.log("START_RECORDING") before recording
            true);
    Response<LivekitEgress.EgressInfo> response = call.execute();
    LivekitEgress.EgressInfo egressInfo = response.body();
}

```

## SRT streaming with thumbnails

This example streams an [individual participant](https://docs.livekit.io/home/egress/participant.md) to an SRT server, generating thumbnails every 5 seconds. Thumbnails are stored in Azure Blob Storage.

**LiveKit CLI**:

```json
{
  "room_name": "my-room",
  "identity": "participant-to-record",
  "screen_share": false,
  "advanced": {
    "width": 1280,
    "height": 720,
    "framerate": 30,
    "audioCodec": "AAC",
    "audioBitrate": 128,
    "videoCodec": "H264_HIGH",
    "videoBitrate": 5000,
    "keyFrameInterval": 2
  },
  "stream_outputs": [
    {
      "protocol": "SRT",
      "urls": ["srt://my-srt-server.com:9999"]
    }
  ],
  "image_outputs": [
    {
      "capture_interval": 5,
      "width": 1280,
      "height": 720,
      "filename_prefix": "{room_name}/{publisher_identity}",
      "filename_suffix": "IMAGE_SUFFIX_TIMESTAMP",
      "disable_manifest": true,
      "azure": {
        "account_name": "my-account",
        "account_key": "my-key",
        "container_name": "my-container"
      }
    }
  ]
}

```

```shell
lk egress start --type participant egress.json

```

---

**JavaScript**:

```typescript
const outputs: EncodedOutputs = {
  stream: new StreamOutput({
    protocol: StreamProtocol.SRT,
    url: 'srt://my-srt-server.com:9999',
  }),
  images: new ImageOutput({
    captureInterval: 5,
    width: 1280,
    height: 720,
    filenamePrefix: '{room_name}/{publisher_identity}',
    filenameSuffix: ImageFileSuffix.IMAGE_SUFFIX_TIMESTAMP,
    output: {
      case: 'azure',
      value: {
        accountName: 'azure-account-name',
        accountKey: 'azure-account-key',
        container_name: 'azure-container',
      },
    },
  }),
};

const info = await ec.startParticipantEgress('my-room', 'participant-to-record', outputs, {
  screenShare: false,
  encodingOptions: {
    width: 1280,
    height: 720,
    framerate: 30,
    audioCodec: AudioCodec.AAC,
    audioBitrate: 128,
    videoCodec: VideoCodec.H264_HIGH,
    videoBitrate: 5000,
    keyFrameInterval: 2,
  },
});

```

---

**Go**:

```go
req := &livekit.ParticipantEgressRequest{
		RoomName:    "my-room",
		Identity:    "participant-to-record",
		ScreenShare: false,
		Options: &livekit.ParticipantEgressRequest_Advanced{
        Advanced: &livekit.EncodingOptions{
            Width:            1280,
            Height:           720,
            Framerate:        30,
            AudioCodec:       livekit.AudioCodec_AAC,
            AudioBitrate:     128,
            VideoCodec:       livekit.VideoCodec_H264_HIGH,
            VideoBitrate:     5000,
            KeyFrameInterval: 2,
        },
		},
		StreamOutputs: []*livekit.StreamOutput{{
        Protocol: livekit.StreamProtocol_SRT,
        Urls:     []string{"srt://my-srt-host:9999"},
		}},
		ImageOutputs: []*livekit.ImageOutput{{
        CaptureInterval: 5,
        Width:           1280,
        Height:          720,
        FilenamePrefix:  "{room_name}/{publisher_identity}",
        FilenameSuffix:  livekit.ImageFileSuffix_IMAGE_SUFFIX_TIMESTAMP,
        DisableManifest: true,
        Output: &livekit.ImageOutput_Azure{
            Azure: &livekit.AzureBlobUpload{
                AccountName:   "my-account-name",
                AccountKey:    "my-account-key",
                ContainerName: "my-container",
            },
        },
		}},
}
info, err := client.StartParticipantEgress(context.Background(), req)

```

---

**Ruby**:

```ruby
outputs = [
  LiveKit::Proto::StreamOutput.new(
    protocol: LiveKit::Proto::StreamProtocol::SRT,
    urls: ["srt://my-srt-server:9999"],
  ),
  LiveKit::Proto::ImageOutput.new(
    capture_interval: 5,
    width: 1280,
    height: 720,
    filename_prefix: "{room_name}/{publisher_identity}",
    filename_suffix: LiveKit::Proto::ImageFileSuffix::IMAGE_SUFFIX_TIMESTAMP,
    azure: LiveKit::Proto::AzureBlobUpload.new(
      account_name: "account-name",
      account_key: "account-key",
      container_name: "container-name",
    )
  )
]
info = egressClient.start_participant_egress(
    'room-name',
    'publisher-identity',
    outputs,
    screen_share: false,
    advanced: LiveKit::Proto::EncodingOptions.new(
      width: 1280,
      height: 720,
      framerate: 30,
      audio_codec: LiveKit::Proto::AudioCodec::AAC,
      audio_bitrate: 128,
      video_codec: LiveKit::Proto::VideoCodec::H264_HIGH,
      video_bitrate: 5000,
      key_frame_interval: 2,
    )
)

```

---

**Python**:

```python
request = api.ParticipantEgressRequest(
    room_name="my-room",
    identity="publisher-to-record",
    screen_share=False,
        advanced=api.EncodingOptions(
            width=1280,
            height=720,
            framerate=30,
            audio_codec=api.AudioCodec.AAC,
            audio_bitrate=128,
            video_codec=api.VideoCodec.H264_HIGH,
            video_bitrate=5000,
            keyframe_interval=2,
        ),
    stream_outputs=[api.StreamOutput(
        protocol=api.StreamProtocol.SRT,
        urls=["srt://my-srt-server:9999"],
    )],
    image_outputs=[api.ImageOutput(
        capture_interval=5,
        width=1280,
        height=720,
        filename_prefix="{room_name}/{publisher_identity}",
        filename_suffix=api.IMAGE_SUFFIX_TIMESTAMP,
        azure=api.AzureBlobUpload(
            account_name="my-azure-account",
            account_key="my-azure-key",
            container_name="my-azure-container",
        ),
    )],
)
info = await lkapi.egress.start_participant_egress(request)

```

---

**Java**:

```java
public void startEgress() throws IOException {
    EgressServiceClient ec = EgressServiceClient.createClient(
        "https://myproject.livekit.cloud", "apiKey", "secret");

    LivekitEgress.StreamOutput streamOutput = LivekitEgress.StreamOutput.newBuilder().
            setProtocol(LivekitEgress.StreamProtocol.SRT).
            addUrls("srt://my-srt-server:9999").
            build();
    LivekitEgress.ImageOutput imageOutput = LivekitEgress.ImageOutput.newBuilder().
            setCaptureInterval(5).
            setWidth(1280).
            setHeight(720).
            setFilenamePrefix("{room_name}/{publisher_identity}").
            setFilenameSuffix(LivekitEgress.ImageFileSuffix.IMAGE_SUFFIX_TIMESTAMP).
            setAzure(LivekitEgress.AzureBlobUpload.newBuilder()
                    .setAccountName("")
                    .setAccountKey("")
                    .setContainerName("")).
            build();

    EncodedOutputs outputs = new EncodedOutputs(
            // no file output
            null,
            streamOutput,
            null,
            imageOutput
    );

    LivekitEgress.EncodingOptions encodingOptions = LivekitEgress.EncodingOptions.newBuilder()
            .setWidth(1280)
            .setHeight(720)
            .setFramerate(30)
            .setAudioCodec(LivekitModels.AudioCodec.AAC)
            .setAudioBitrate(128)
            .setVideoCodec(LivekitModels.VideoCodec.H264_HIGH)
            .setVideoBitrate(5000)
            .setKeyFrameInterval(2)
            .build();
    Call<LivekitEgress.EgressInfo> call = ec.startParticipantEgress(
            "my-room",
            "publisher-to-record",
            outputs,
            // capture camera/microphone, not screenshare
            false,
            // not using preset, using custom encoding options
            null,
            encodingOptions);
    Response<LivekitEgress.EgressInfo> response = call.execute();
    LivekitEgress.EgressInfo egressInfo = response.body();
}

```

## Adding RTMP to track composite egress

Create a TrackComposite Egress recorded as HLS segments, with RTMP output added later.

**LiveKit CLI**:

```json
{
  "room_name": "my-room",
  "audio_track_id": "TR_AUDIO_ID",
  "video_track_id": "TR_VIDEO_ID",
  "stream_outputs": [
    {
      "protocol": "RTMP",
      "urls": []
    }
  ],
  "segment_outputs": [
    {
      "filename_prefix": "path/to/my-output",
      "playlist_name": "my-output.m3u8",
      "segment_duration": 2,
      "s3": {
        "access_key": "",
        "secret": "",
        "region": "",
        "bucket": "my-bucket"
      }
    }
  ]
}

```

```shell
lk egress start --type track-composite egress.json

# later, to add a RTMP output
lk egress update-stream --id <egress-id> --add-urls rtmp://new-server.com/live/stream-key

# to remove RTMP output
lk egress update-stream --id <egress-id> --remove-urls rtmp://new-server.com/live/stream-key

```

---

**JavaScript**:

```typescript
const outputs: EncodedOutputs = {
  // a placeholder RTMP output is needed to ensure stream urls can be added to it later
  stream: new StreamOutput({
    protocol: StreamProtocol.RTMP,
    urls: [],
  }),
  segments: new SegmentedFileOutput({
    filenamePrefix: 'my-output',
    playlistName: 'my-output.m3u8',
    segmentDuration: 2,
    output: {
      case: 's3',
      value: {
        accessKey: '',
        secret: '',
        bucket: '',
        region: '',
        forcePathStyle: true,
      },
    },
  }),
};

const info = await ec.startTrackCompositeEgress('my-room', outputs, {
  videoTrackId: 'TR_VIDEO_TRACK_ID',
  audioTrackId: 'TR_AUDIO_TRACK_ID',
  encodingOptions: EncodingOptionsPreset.H264_720P_30,
});

// later, to add RTMP output
await ec.updateStream(info.egressId, ['rtmp://new-server.com/live/stream-key']);

// to remove RTMP output
await ec.updateStream(info.egressId, [], ['rtmp://new-server.com/live/stream-key']);

```

---

**Go**:

```go
req := &livekit.TrackCompositeEgressRequest{
		RoomName:     "my-room",
		VideoTrackId: "TR_VIDEO_TRACK_ID",
		AudioTrackId: "TR_AUDIO_TRACK_ID",
		Options: &livekit.TrackCompositeEgressRequest_Preset{
			  Preset: livekit.EncodingOptionsPreset_H264_720P_30,
		},
		SegmentOutputs: []*livekit.SegmentedFileOutput{{
				FilenamePrefix:   "my-output",
				PlaylistName:     "my-output.m3u8",
				SegmentDuration:  2,
				Output: &livekit.SegmentedFileOutput_S3{
            S3: &livekit.S3Upload{
                AccessKey:      "",
                Secret:         "",
                Endpoint:       "",
                Bucket:         "",
                ForcePathStyle: true,
            },
				},
    }},
		// a placeholder RTMP output is needed to ensure stream urls can be added to it later
		StreamOutputs: []*livekit.StreamOutput{{
        Protocol: livekit.StreamProtocol_RTMP,
        Urls:     []string{},
		}},
}
info, err := client.StartTrackCompositeEgress(context.Background(), req)

// add new output URL to the stream
client.UpdateStream(context.Background(), &livekit.UpdateStreamRequest{
		EgressId:      info.EgressId,
		AddOutputUrls: []string{"rtmp://new-server.com/live/stream-key"},
})

// remove an output URL from the stream
client.UpdateStream(context.Background(), &livekit.UpdateStreamRequest{
		EgressId:      info.EgressId,
		RemoveOutputUrls: []string{"rtmp://new-server.com/live/stream-key"},
})

```

---

**Ruby**:

```ruby
outputs = [
  # a placeholder RTMP output is needed to ensure stream urls can be added to it later
  LiveKit::Proto::StreamOutput.new(
    protocol: LiveKit::Proto::StreamProtocol::RTMP,
    urls: [],
  ),
  LiveKit::Proto::SegmentedFileOutput.new(
    filename_prefix: "my-output",
    playlist_name: "my-output.m3u8",
    segment_duration: 2,
    s3: LiveKit::Proto::S3Upload.new(
      access_key: "",
      secret: "",
      endpoint: "",
      region: "",
      bucket: "my-bucket",
      force_path_style: true,
    )
  )
]

info = egressClient.start_track_composite_egress(
  'room-name',
  outputs,
  audio_track_id: 'TR_AUDIO_TRACK_ID',
  video_track_id: 'TR_VIDEO_TRACK_ID',
  preset: LiveKit::Proto::EncodingOptionsPreset::H264_1080P_30,
)

# add new output URL to the stream
egressClient.update_stream(info.egress_id, ["rtmp://new-server.com/live/stream-key"])

# remove an output URL from the stream
egressClient.remove_stream(info.egress_id, [], ["rtmp://new-server.com/live/stream-key"])

```

---

**Python**:

```python
request = api.TrackCompositeEgressRequest(
    room_name="my-room",
    audio_track_id="TR_AUDIO_TRACK_ID",
    video_track_id="TR_VIDEO_TRACK_ID",
    preset=api.EncodingOptionsPreset.H264_720P_30,
    # a placeholder RTMP output is needed to ensure stream urls can be added to it later
    stream_outputs=[api.StreamOutput(
        protocol=api.StreamProtocol.RTMP,
        urls=[],
    )],
    segment_outputs=[api.SegmentedFileOutput(
        filename_prefix= "my-output",
        playlist_name= "my-playlist.m3u8",
        live_playlist_name= "my-live-playlist.m3u8",
        segment_duration= 2,
        s3 = api.S3Upload(
            bucket="my-bucket",
            region="",
            access_key="",
            secret="",
            force_path_style=True,
        ),
    )],
)
info = await lkapi.egress.start_track_composite_egress(request)

# add new output URL to the stream
lkapi.egress.update_stream(api.UpdateStreamRequest(
    egress_id=info.egress_id,
    add_output_urls=["rtmp://new-server.com/live/stream-key"],
))

# remove an output URL from the stream
lkapi.egress.update_stream(api.UpdateStreamRequest(
    egress_id=info.egress_id,
    remove_output_urls=["rtmp://new-server.com/live/stream-key"],
))

```

---

**Java**:

```java
public void startEgress() throws IOException {
    EgressServiceClient ec = EgressServiceClient.createClient(
        "https://myproject.livekit.cloud", "apiKey", "secret");

    // a placeholder RTMP output is needed to ensure stream urls can be added to it later
    LivekitEgress.StreamOutput streamOutput = LivekitEgress.StreamOutput.newBuilder().
            setProtocol(LivekitEgress.StreamProtocol.RTMP).
            build();
    LivekitEgress.SegmentedFileOutput segmentOutput = LivekitEgress.SegmentedFileOutput.newBuilder().
            setFilenamePrefix("my-hls-file").
            setPlaylistName("my-playlist.m3u8").
            setLivePlaylistName("my-live-playlist.m3u8").
            setSegmentDuration(2).
            setS3(LivekitEgress.S3Upload.newBuilder()
                    .setBucket("")
                    .setAccessKey("")
                    .setSecret("")
                    .setForcePathStyle(true)).
            build();

    EncodedOutputs outputs = new EncodedOutputs(
            // no file output
            null,
            streamOutput,
            segmentOutput,
            null
    );

    Call<LivekitEgress.EgressInfo> call = ec.startTrackCompositeEgress(
            "my-room",
            outputs,
            "TR_AUDIO_TRACK_ID",
            "TR_VIDEO_TRACK_ID",
            LivekitEgress.EncodingOptionsPreset.H264_1080P_30);
    Response<LivekitEgress.EgressInfo> response = call.execute();
    LivekitEgress.EgressInfo egressInfo = response.body();

    // add new output URL to the stream
    call = ec.updateStream(egressInfo.getEgressId(), List.of("rtmp://new-server.com/live/stream-key"), List.of());
    response = call.execute();
    egressInfo = response.body();

    // remove an output URL from the stream
    call = ec.updateStream(egressInfo.getEgressId(), List.of(), List.of("rtmp://new-server.com/live/stream-key"));
    response = call.execute();
    egressInfo = response.body();
}

```

## Exporting individual tracks without transcoding

Export video tracks to Azure Blob Storage without transcoding.

> ℹ️ **Separate video and audio tracks**
> 
> Video and audio tracks must be exported separately using Track Egress.

**LiveKit CLI**:

```json
{
  "room_name": "my-room",
  "track_id": "TR_TRACK_ID",
  "filepath": "{room_name}/{track_id}",
  "azure": {
    "account_name": "my-account",
    "account_key": "my-key",
    "container_name": "my-container"
  }
}

```

```shell
lk egress start --type track egress.json

```

---

**JavaScript**:

```typescript
const output = new DirectFileOutput({
  filepath: '{room_name}/{track_id}',
  output: {
    case: 'azure',
    value: {
      accountName: 'account-name',
      accountKey: 'account-key',
      containerName: 'container-name',
    },
  },
});

const info = await ec.startTrackEgress('my-room', output, 'TR_TRACK_ID');

```

---

**Go**:

```go
req := &livekit.TrackEgressRequest{
		RoomName: "my-room",
		TrackId:  "TR_TRACK_ID",
		Output: &livekit.TrackEgressRequest_File{
        File: &livekit.DirectFileOutput{
            Filepath: "{room_name}/{track_id}",
            Output: &livekit.DirectFileOutput_Azure{
                Azure: &livekit.AzureBlobUpload{
                    AccountName:   "",
                    AccountKey:    "",
                    ContainerName: "",
                },
            },
        },
		},
}
info, err := client.StartTrackEgress(context.Background(), req)

```

---

**Ruby**:

```ruby
output = LiveKit::Proto::DirectFileOutput.new(
  filepath: "{room_name}/{track_id}",
  azure: LiveKit::Proto::AzureBlobUpload.new(
    account_name: "account",
    account_key: "account-key",
    container_name: "container"
  )
)

egressClient.start_track_egress("my-room", output, "TR_TRACK_ID")

```

---

**Python**:

```python
request = api.TrackEgressRequest(
    room_name="my-room",
    track_id="TR_TRACK_ID",
    file=api.DirectFileOutput(
        filepath="{room_name}/{track_id}",
        azure=api.AzureBlobUpload(
            account_name="ACCOUNT_NAME",
            account_key="ACCOUNT_KEY",
            container_name="CONTAINER_NAME",
        ),
    ),
)
egress_info = await lkapi.egress.start_track_egress(request)

```

---

**Java**:

```java
public void startEgress() throws IOException {
    EgressServiceClient ec = EgressServiceClient.createClient(
        "https://myproject.livekit.cloud", "apiKey", "secret");

    LivekitEgress.DirectFileOutput fileOutput = LivekitEgress.DirectFileOutput.newBuilder().
            setFilepath("{room_name}/{track_id}").
            setAzure(LivekitEgress.AzureBlobUpload.newBuilder()
                    .setAccountName("")
                    .setAccountKey("")
                    .setContainerName("")).
            build();

    Call<LivekitEgress.EgressInfo> call = ec.startTrackEgress(
            "my-room",
            fileOutput,
            "TR_TRACK_ID");
    Response<LivekitEgress.EgressInfo> response = call.execute();
    LivekitEgress.EgressInfo egressInfo = response.body();
}

```

## Stop an active egress

To stop an active egress, see the API reference for [StopEgress](https://docs.livekit.io/home/egress/api.md#stopegress) for examples.

---

This document was rendered at 2025-09-27T09:36:34.524Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/examples.md](https://docs.livekit.io/home/egress/examples.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).