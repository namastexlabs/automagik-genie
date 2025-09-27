LiveKit Docs › Recording & export › Output and streaming options

---

# Egress output types

> Export content anywhere, in any format.

## Supported Outputs

| Egress Type | Transcoded | Pass-through (mp4, webm, ogg) | HLS Segments | RTMP stream | SRT stream | WebSocket stream |
| Room Composite | ✅ |  | ✅ | ✅ | ✅ |  |
| Web | ✅ |  | ✅ | ✅ | ✅ |  |
| Participant | ✅ |  | ✅ | ✅ | ✅ |  |
| Track Composite | ✅ |  | ✅ | ✅ | ✅ |  |
| Track |  | ✅ |  |  |  | ✅ (audio-only) |

> ℹ️ **Note**
> 
> A very long-running Egress may hit our [Egress time limits](https://docs.livekit.io/home/cloud/quotas-and-limits.md#egress-time-limits).

## Composite and Participant Egress Outputs

Since Composite and Participant Egress are transcoded, they can be output to a wide range of formats and destinations.

Egress is optimized to transcode once while sending output to multiple destinations. For example, from the same Egress you may simultaneously:

- Stream to one or more RTMP endpoints.
- Record as HLS.
- Record as MP4.
- Generate thumbnails.

When creating a new Egress, set one or more of the following configuration fields:

| Field | Description |
| `file_outputs` | Record to a MP4 file. |
| `stream_outputs` | Stream to RTMP or SRT server. |
| `segment_outputs` | Record as HLS segments. |
| `image_outputs` | Generate thumbnails. |

> ℹ️ **Note**
> 
> While each output type is a list (`*_outputs`), Egress supports only a single item per type. i.e. It's not possible to output to two different files, but it is possible to output to both a `file` and a HLS `segment`.

**LiveKit CLI**:

```json
{
  ... // source details
  "file_outputs": [
    {
      "filepath": "my-test-file.mp4",
      "s3": { ... },
      "gcp": { ... },
      "azure": { ... },
      "aliOSS": { ... }
    }
  ],
  "stream_outputs": [
    {
      "protocol": "rtmp",
      "urls": ["rtmp://my-rtmp-endpoint/path/stream-key"]
    }
  ],
  "segment_outputs": [
    {
      "filename_prefix": "my-output",
      "playlist_name": "my-output.m3u8",
      // when provided, we'll generate a playlist containing only the last few segments
      "live_playlist_name": "my-output-live.m3u8",
      "segment_duration": 2,
      "s3": { ... },
      "gcp": { ... },
      "azure": { ... },
      "aliOSS": { ... }
    }
  ],
  "image_outputs": [
    {
      "capture_interval": 5,
      "filename_prefix": "my-image",
      "filename_suffix": "IMAGE_SUFFIX_INDEX",
      "s3": { ... },
      "gcp": { ... },
      "azure": { ... },
      "aliOSS": { ... }
    }
  ]
}

```

---

**JavaScript**:

```typescript
const outputs = {
  file: new EncodedFileOutput({
    filepath: 'my-test-file.mp4',
    output: {
      case: 's3',
      value: { ... },
    },
  }),
  stream: new StreamOutput({
    protocol: StreamProtocol.SRT,
    urls: ['rtmps://my-server.com/live/stream-key'],
  }),
  segments: new SegmentedFileOutput({
    filenamePrefix: 'my-output',
    playlistName: 'my-output.m3u8',
    livePlaylistName: "my-output-live.m3u8",
    segmentDuration: 2,
    output: {
      case: "gcp",
      value: { ... },
    }
  }),
  images: new ImageOutput({
    captureInterval: 5,
    // width: 1920,
    // height: 1080,
    filenamePrefix: 'my-image',
    filenameSuffix: ImageFileSuffix.IMAGE_SUFFIX_TIMESTAMP,
    output: {
      case: "azure",
      value: { ... },
    }
  }),
};

```

---

**Go**:

```go
req := &livekit.RoomCompositeEgressRequest{}
//req := &livekit.WebEgressRequest{}
//req := &livekit.ParticipantEgressRequest{}
//req := &livekit.TrackCompositeEgressRequest{}
req.FileOutputs = []*livekit.EncodedFileOutput{
  {
    Filepath: "myfile.mp4",
    Output: &livekit.EncodedFileOutput_S3{
      S3: &livekit.S3Upload{
        ...
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
req.SegmentOutputs = []*livekit.SegmentedFileOutput{
  {
    FilenamePrefix: "my-output",
    PlaylistName: "my-output.m3u8",
    LivePlaylistName: "my-output-live.m3u8",
    SegmentDuration: 2,
    Output: &livekit.SegmentedFileOutput_Azure{
      Azure: &livekit.AzureBlobUpload{ ... },
    },
  },
}
req.ImageOutputs = []*livekit.ImageOutput{
  {
    CaptureInterval: 10,
    FilenamePrefix: "my-image",
    FilenameSuffix: livekit.ImageFileSuffix_IMAGE_SUFFIX_INDEX,
    Output: &livekit.ImageOutput_Gcp{
      Gcp: &livekit.GCPUpload{ ... },
    },
  },
}

```

---

**Ruby**:

```ruby
outputs = [
  LiveKit::Proto::EncodedFileOutput.new(
    filepath: "myfile.mp4",
    s3: LiveKit::Proto::S3Upload.new(
      ...
    )
  ),
  LiveKit::Proto::StreamOutput.new(
    protocol: LiveKit::Proto::StreamProtocol::RTMP,
    urls: ["rtmp://myserver.com/live/stream-key"]
  ),
  LiveKit::Proto::SegmentedFileOutput.new(
    filename_prefix: "my-output",
    playlist_name: "my-output.m3u8",
    live_playlist_name: "my-output-live.m3u8",
    segment_duration: 2,
    azure: LiveKit::Proto::AzureBlobUpload.new(
      ...
    )
  ),
  LiveKit::Proto::ImageOutput.new(
    capture_interval: 10,
    filename_prefix: "my-image",
    filename_suffix: LiveKit::Proto::ImageFileSuffix::IMAGE_SUFFIX_INDEX,
    azure: LiveKit::Proto::GCPUpload.new(
      ...
    )
  )
]


```

---

**Python**:

```python
# recording to a mp4 file
file_output = EncodedFileOutput(
    filepath="myfile.mp4",
    s3=S3Upload(...),
)

# outputing to a stream
stream_output =StreamOutput(
    protocol=StreamProtocol.RTMP,
    urls=["rtmps://myserver.com/live/stream-key"],
)

# outputing to HLS
segment_output = SegmentedFileOutput(
    filename_prefix="my-output",
    playlist_name="my-playlist.m3u8",
    live_playlist_name="my-live-playlist.m3u8",
    segment_duration=2,
    azure=AzureBlobUpload(...),
)

# saving image thumbnails
image_output = ImageOutput(
    capture_interval=10,
    filename_prefix="my-image",
    filename_suffix=ImageFileSuffix.IMAGE_SUFFIX_INDEX,
)

req = RoomCompositeEgressRequest(
  file_outputs=[file_output],
  # if stream output is needed later on, you can initialize it with empty array `[]`
  stream_outputs=[stream_output],
  segment_outputs=[segment_output],
  image_outputs=[image_output],
)
# req = WebEgressRequest()
# req = ParticipantEgressRequest()
# req = TrackCompositeEgressRequest()

```

---

**Java**:

```java
import io.livekit.server.EncodedOutputs;
import livekit.LivekitEgress;

LivekitEgress.EncodedFileOutput fileOutput = LivekitEgress.EncodedFileOutput.newBuilder().
        setFilepath("my-test-file.mp4").
        setS3(LivekitEgress.S3Upload.newBuilder()
                .setBucket("")
                .setAccessKey("")
                .setSecret("")
                .setForcePathStyle(true)).
        build();
LivekitEgress.StreamOutput streamOutput = LivekitEgress.StreamOutput.newBuilder().
        setProtocol(LivekitEgress.StreamProtocol.RTMP).
        addUrls("rtmp://my-rtmp-server").
        build();
LivekitEgress.SegmentedFileOutput segmentOutput = LivekitEgress.SegmentedFileOutput.newBuilder().
        setFilenamePrefix("my-segmented-file").
        setPlaylistName("my-playlist.m3u8").
        setLivePlaylistName("my-live-playlist.m3u8").
        setSegmentDuration(2).
        setGcp(LivekitEgress.GCPUpload.newBuilder()
                .setBucket("")
                .setCredentials("{...}")).
        build();
LivekitEgress.ImageOutput imageOutput = LivekitEgress.ImageOutput.newBuilder().
        setFilenamePrefix("my-file").
        setFilenameSuffix(LivekitEgress.ImageFileSuffix.IMAGE_SUFFIX_TIMESTAMP).
        setAzure(LivekitEgress.AzureBlobUpload.newBuilder()
                .setAccountName("")
                .setAccountKey("")
                .setContainerName("")).
        build();

EncodedOutputs outputs = new EncodedOutputs(
        fileOutput,
        streamOutput,
        segmentOutput,
        imageOutput
);

```

### RTMP/SRT Streaming

#### Choosing RTMP ingest endpoints

RTMP streams do not perform well over long distances. Some stream providers include a region or location as part of your stream url, while others might use region-based routing.

- When self-hosting, choose stream endpoints that are close to where your Egress servers are deployed.
- With LiveKit Cloud Egress, we will route your Egress request to a server closest to your RTMP endpoints.

#### Adding streams to non-streaming egress

Streams can be added and removed on the fly using the [UpdateStream API](https://docs.livekit.io/home/egress/api.md#updatestream).

To use the UpdateStream API, your initial request must include a `StreamOutput`. If the stream will start later, include a `StreamOutput` in the initial request with the correct `protocol` and an empty `urls` array.

#### Integration with Mux

Mux is LiveKit's preferred partner for HLS streaming. To start a [Mux](https://www.mux.com) stream, all you need is your stream key. You can then use `mux://<stream_key>` as a url in your `StreamOutput`.

### File/Segment outputs

#### Filename templating

When outputing to files, the `filepath` and `filename_prefix` fields support templated variables. The below templates can be used in request filename/filepath parameters:

| Egress Type | {room_id} | {room_name} | {time} | {publisher_identity} | {track_id} | {track_type} | {track_source} |
| Room Composite | ✔️ | ✔️ | ✔️ |  |  |  |  |
| Web |  |  | ✔️ |  |  |  |  |
| Participant | ✔️ | ✔️ | ✔️ | ✔️ |  |  |  |
| Track Composite | ✔️ | ✔️ | ✔️ | ✔️ |  |  |  |
| Track | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

- If no filename is provided with a request, one will be generated in the form of `"{room_name}-{time}"`.
- If your filename ends with a `/`, a file will be generated in that directory.
- If your filename is missing an extension or includes the wrong extension, the correct one will be added.

Examples:

| Request filename | Output filename |
| "" | testroom-2022-10-04T011306.mp4 |
| "livekit-recordings/" | livekit-recordings/testroom-2022-10-04T011306.mp4 |
| "{room_name}/{time}" | testroom/2022-10-04T011306.mp4 |
| "{room_id}-{publisher_identity}.mp4" | 10719607-f7b0-4d82-afe1-06b77e91fe12-david.mp4 |
| "{track_type}-{track_source}-{track_id}" | audio-microphone-TR_SKasdXCVgHsei.ogg |

### Image output

Image output allows you to create periodic snapshots from a recording or stream, useful for generating thumbnails or running moderation workflows in your application.

The configuration options are:

| Field | Description |
| `capture_interval` | The interval in seconds between each snapshot. |
| `filename_prefix` | The prefix for each image file. |
| `filename_suffix` | The suffix for each image file. This can be a timestamp or an index. |
| `width` and `height` | The dimensions of the image. If not provided, the image is the same size as the video frame. |

## Cloud storage configurations

### S3

Egress supports any S3-compatible storage provider, including the following:

- MinIO
- Oracle Cloud
- CloudFlare R2
- Digital Ocean
- Akamai Linode
- Backblaze

When using non-AWS storage, set `force_path_style` to `true`. This ensures the bucket name is used in the path, rather than as a subdomain.

Configuration fields:

| Field | Description |
| `access_key` | The access key for your S3 account. |
| `secret` | The secret key for your S3 account. |
| `region` | The region where your S3 bucket is located (required when `endpoint` is not set). |
| `bucket` | The name of the bucket where the file will be stored. |
| `endpoint` | The endpoint for your S3-compatible storage provider (optional). Must start with `https://`. |
| `metadata` | Key/value pair to set as S3 metadata. |
| `content_disposition` | Content-Disposition header when the file is downloaded. |
| `proxy` | HTTP proxy to use when uploading files. {url: "", username: "", password: ""}. |

> ℹ️ **Note**
> 
> If the `endpoint` field is left empty, it uses AWS's regional endpoints. The `region` field is required when `endpoint` is not set.

### Google Cloud Storage

For Egress to upload to Google Cloud Storage, you'll need to provide credentials in JSON.

This can be obtained by first creating a [service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts#iam-service-accounts-create-gcloud) that has permissions to create storage objects (i.e. `Storage Object Creator`). Then [create a key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating) for that account and export as a JSON file. We'll refer to this file as `credentials.json`.

Configuration fields:

| Field | Description |
| `credentials` | Service account credentials serialized in a JSON file named `credentials.json`. |
| `bucket` | The name of the bucket where the file will be stored. |
| `proxy` | HTTP proxy to use when uploading files. {url: "", username: "", password: ""}. |

### Azure

In order to upload to Azure Blob Storage, you'll need the account's shared access key.

Configuration fields:

| Field | Description |
| `account_name` | The name of the Azure account. |
| `account_key` | The shared access key for the Azure account. |
| `container_name` | The name of the container where the file will be stored. |

---

This document was rendered at 2025-09-27T09:36:34.808Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/outputs.md](https://docs.livekit.io/home/egress/outputs.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).