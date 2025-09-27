LiveKit Docs › Recording & export › Egress API

---

# Egress API

> Use LiveKit's egress service to record or livestream a Room.

## API

The Egress API is available within our server SDKs and CLI:

- [Go Egress Client](https://pkg.go.dev/github.com/livekit/server-sdk-go/v2#EgressClient)
- [JS Egress Client](https://docs.livekit.io/reference/server-sdk-js/classes/EgressClient.html.md)
- [Ruby Egress Client](https://github.com/livekit/server-sdk-ruby/blob/main/lib/livekit/egress_service_client.rb)
- [Python Egress Client](https://docs.livekit.io/reference/python/v1/livekit/api/egress_service.html.md)
- [Java Egress Client](https://github.com/livekit/server-sdk-kotlin/blob/main/src/main/kotlin/io/livekit/server/EgressServiceClient.kt)
- [CLI](https://github.com/livekit/livekit-cli/blob/main/cmd/lk/egress.go)

> ❗ **Important**
> 
> Requests to the Egress API need the `roomRecord` permission on the [access token](https://docs.livekit.io/concepts/authentication.md).

You can also use `curl` to interact with the Egress APIs. To do so, `POST` the arguments in JSON format to:

`https://<your-livekit-host>/twirp/livekit.Egress/<MethodName>`

For example:

```shell
% curl -X POST https://<your-livekit-host>/twirp/livekit.Egress/StartRoomCompositeEgress \
        -H 'Authorization: Bearer <livekit-access-token>' \
        -H 'Content-Type: application/json' \
        -d '{"room_name": "your-room", "segments": {"filename_prefix": "your-hls-playlist.m3u8", "s3": {"access_key": "<key>", "secret": "<secret>", "bucket": "<bucket>", "region": "<bucket-region>"}}}'

```

```shell
{"egress_id":"EG_MU4QwhXUhWf9","room_id":"<room-id>","room_name":"your-room","status":"EGRESS_STARTING"...}

```

> 💡 **Tip**
> 
> All RPC definitions and options can be found [here](https://github.com/livekit/protocol/blob/main/protobufs/livekit_egress.proto).

### StartRoomCompositeEgress

Starts a new [Composite Recording](https://docs.livekit.io/home/egress/room-composite.md) using a web browser as the rendering engine.

| Parameter | Type | Required | Description |
| room_name | string | yes | name of room to record |
| layout | string |  | layout parameter that is passed to the template |
| audio_only | bool |  | true if resulting output should only contain audio |
| video_only | bool |  | true if resulting output should only contain video |
| custom_base_url | string |  | URL to the page that would composite tracks, uses embedded templates if left blank |
| file_outputs | [EncodedFileOutput](#EncodedFileOutput)[] |  | output to MP4 file. currently only supports a single entry |
| segment_outputs | [SegmentedFileOutput](#SegmentedFileOutput)[] |  | output to HLS segments. currently only supports a single entry |
| stream_outputs | [StreamOutput](#StreamOutput)[] |  | output to a stream. currently only supports a single entry, though it could includ multiple destination URLs |
| image_outputs | [ImageOutput](#ImageOutput)[] |  | output to a succession of snapshot images taken at a given interval (thumbnails). Currently only supports a single entry. |
| preset | [EncodingOptionsPreset](#EncodingOptionsPreset) |  | encoding preset to use. only one of preset or advanced could be set |
| advanced | [EncodingOptions](#EncodingOptions) |  | advanced encoding options. only one of preset or advanced could be set |
| webhooks | [WebhookConfig](#WebhookConfig)[] |  | extra webhooks to send on egress events for this request |

### StartTrackCompositeEgress

Starts a new [Track Composite](https://docs.livekit.io/home/egress/track-composite.md)

| Parameter | Type | Required | Description |
| room_name | string | yes | name of room to record |
| audio_track_id | string |  | ID of audio track to composite |
| video_track_id | string |  | ID of video track to composite |
| file_outputs | [EncodedFileOutput](#EncodedFileOutput)[] |  | output to MP4 file. currently only supports a single entry |
| segment_outputs | [SegmentedFileOutput](#SegmentedFileOutput)[] |  | output to HLS segments. currently only supports a single entry |
| stream_outputs | [StreamOutput](#StreamOutput)[] |  | output to a stream. currently only supports a single entry, though it could includ multiple destination URLs |
| image_outputs | [ImageOutput](#ImageOutput)[] |  | output to a succession of snapshot images taken at a given interval (thumbnails). Currently only supports a single entry. |
| preset | [EncodingOptionsPreset](#EncodingOptionsPreset) |  | encoding preset to use. only one of preset or advanced could be set |
| advanced | [EncodingOptions](#EncodingOptions) |  | advanced encoding options. only one of preset or advanced could be set |
| webhooks | [WebhookConfig](#WebhookConfig)[] |  | extra webhooks to send on egress events for this request |

### StartTrackEgress

Starts a new [Track Egress](https://docs.livekit.io/home/egress/track.md)

| Parameter | Type | Required | Description |
| room_name | string | yes | name of room to record |
| track_id | string |  | layout parameter that is passed to the template |
| file | [DirectFileOutput](#DirectFileOutput) |  | only one of file or websocket_url can be set |
| websocket_url | string |  | url to websocket to receive audio output. only one of file or websocket_url can be set |
| webhooks | [WebhookConfig](#WebhookConfig)[] |  | extra webhooks to send on egress events for this request |

### StartWebEgress

Starts a new [Web Egress](https://docs.livekit.io/home/egress/web.md)

| Parameter | Type | Required | Description |
| url | string | yes | URL of the web page to record |
| audio_only | bool |  | true if resulting output should only contain audio |
| video_only | bool |  | true if resulting output should only contain video |
| file_outputs | [EncodedFileOutput](#EncodedFileOutput)[] |  | output to MP4 file. currently only supports a single entry |
| segment_outputs | [SegmentedFileOutput](#SegmentedFileOutput)[] |  | output to HLS segments. currently only supports a single entry |
| stream_outputs | [StreamOutput](#StreamOutput)[] |  | output to a stream. currently only supports a single entry, though it could includ multiple destination URLs |
| image_outputs | [ImageOutput](#ImageOutput)[] |  | output to a succession of snapshot images taken at a given interval (thumbnails). Currently only supports a single entry. |
| preset | [EncodingOptionsPreset](#EncodingOptionsPreset) |  | encoding preset to use. only one of preset or advanced could be set |
| advanced | [EncodingOptions](#EncodingOptions) |  | advanced encoding options. only one of preset or advanced could be set |
| webhooks | [WebhookConfig](#WebhookConfig)[] |  | extra webhooks to send on egress events for this request |

### UpdateLayout

Used to change the web layout on an active RoomCompositeEgress.

| Parameter | Type | Required | Description |
| egress_id | string | yes | Egress ID to update |
| layout | string | yes | layout to update to |

**JavaScript**:

```typescript
const info = await egressClient.updateLayout(egressID, 'grid-light');

```

---

**Go**:

```go
info, err := egressClient.UpdateLayout(ctx, &livekit.UpdateLayoutRequest{
    EgressId: egressID,
    Layout:   "grid-light",
})

```

---

**Ruby**:

```ruby
egressClient.update_layout('egress-id', 'grid-dark')

```

---

**Java**:

```java
try {
    egressClient.updateLayout("egressId", "grid-light").execute();
} catch (IOException e) {
    // handle exception
}

```

---

**LiveKit CLI**:

```bash
lk egress update-layout --id <EGRESS_ID> --layout speaker

```

### UpdateStream

Used to add or remove stream urls from an active stream

Note: you can only add outputs to an Egress that was started with `stream_outputs` set.

| Parameter | Type | Required | Description |
| egress_id | string | yes | Egress ID to update |
| add_output_urls | string[] |  | URLs to add to the egress as output destinations |
| remove_output_urls | string[] |  | URLs to remove from the egress |

**JavaScript**:

```typescript
const streamOutput = new StreamOutput({
  protocol: StreamProtocol.RTMP,
  urls: ['rtmp://live.twitch.tv/app/<stream-key>'],
});
var info = await egressClient.startRoomCompositeEgress('my-room', { stream: streamOutput });
const streamEgressID = info.egressId;

info = await egressClient.updateStream(streamEgressID, [
  'rtmp://a.rtmp.youtube.com/live2/stream-key',
]);

```

---

**Go**:

```go
streamRequest := &livekit.RoomCompositeEgressRequest{
    RoomName:  "my-room",
    Layout:    "speaker",
    Output: &livekit.RoomCompositeEgressRequest_Stream{
        Stream: &livekit.StreamOutput{
            Protocol: livekit.StreamProtocol_RTMP,
            Urls:     []string{"rtmp://live.twitch.tv/app/<stream-key>"},
        },
    },
}

info, err := egressClient.StartRoomCompositeEgress(ctx, streamRequest)
streamEgressID := info.EgressId

info, err = egressClient.UpdateStream(ctx, &livekit.UpdateStreamRequest{
    EgressId:      streamEgressID,
    AddOutputUrls: []string{"rtmp://a.rtmp.youtube.com/live2/<stream-key>"}
})

```

---

**Ruby**:

```ruby
# to add streams
egressClient.update_stream(
    'egress-id',
    add_output_urls: ['rtmp://new-url'],
    remove_output_urls: ['rtmp://old-url']
)

```

---

**Java**:

```java
try {
    egressClient.updateStream(
            "egressId",
            Collections.singletonList("rtmp://new-url"),
            Collections.singletonList("rtmp://old-url")
    ).execute();
} catch (IOException e) {
    // handle exception
}

```

---

**LiveKit CLI**:

```shell
lk update-stream \
  --id <EGRESS_ID> \
  --add-urls "rtmp://a.rtmp.youtube.com/live2/stream-key"

```

### ListEgress

Used to list active egress. Does not include completed egress.

**JavaScript**:

```typescript
const res = await egressClient.listEgress();

```

---

**Go**:

```go
res, err := egressClient.ListEgress(ctx, &livekit.ListEgressRequest{})

```

---

**Ruby**:

```ruby
# to list egress on myroom
egressClient.list_egress(room_name: 'myroom')

# to list all egresses
egressClient.list_egress()

```

---

**Java**:

```java
try {
    List<LivekitEgress.EgressInfo> egressInfos = egressClient.listEgress().execute().body();
} catch (IOException e) {
    // handle exception
}

```

---

**LiveKit CLI**:

```shell
lk egress list

```

### StopEgress

Stops an active egress.

**JavaScript**:

```typescript
const info = await egressClient.stopEgress(egressID);

```

---

**Go**:

```go
info, err := egressClient.StopEgress(ctx, &livekit.StopEgressRequest{
    EgressId: egressID,
})

```

---

**Ruby**:

```ruby
egressClient.stop_egress('egress-id')

```

---

**Java**:

```java
try {
    egressClient.stopEgress("egressId").execute();
} catch (IOException e) {
    // handle exception
}

```

---

**LiveKit CLI**:

```shell
lk egress stop --id <EGRESS_ID>

```

## Types

### EncodedFileOutput

| Field | Type | Description |
| filepath | string | default {room_name}-{time} |
| disable_manifest | bool | by default, Egress outputs a {filepath}.json with metadata of the file |
| s3 | [S3Upload](#S3Upload) | set if uploading to S3 compatible storage. only one storage output can be set |
| gcp | [GCPUpload](#GCPUpload) | set if uploading to GCP |
| azure | [AzureBlobUpload](#AzureBlobUpload) | set if uploading to Azure |
| aliOSS | [AliOSSUpload](#AliOSSUpload) | set if uploading to AliOSS |

### DirectFileOutput

| Field | Type | Description |
| filepath | string | default {track_id}-{time} |
| disable_manifest | bool | by default, Egress outputs a {filepath}.json with metadata of the file |
| s3 | [S3Upload](#S3Upload) | set if uploading to S3 compatible storage. only one storage output can be set |
| gcp | [GCPUpload](#GCPUpload) | set if uploading to GCP |
| azure | [AzureBlobUpload](#AzureBlobUpload) | set if uploading to Azure |
| aliOSS | [AliOSSUpload](#AliOSSUpload) | set if uploading to AliOSS |

### SegmentedFileOutput

| Field | Type | Description |
| filename_prefix | string | prefix used in each segment (include any paths here) |
| playlist_name | string | name of the m3u8 playlist. when empty, matches filename_prefix |
| segment_duration | uint32 | length of each segment (defaults to 4s) |
| filename_suffix | SegmentedFileSuffix | INDEX (1, 2, 3) or TIMESTAMP (in UTC) |
| disable_manifest | bool |  |
| s3 | [S3Upload](#S3Upload) | set if uploading to S3 compatible storage. only one storage output can be set |
| gcp | [GCPUpload](#GCPUpload) | set if uploading to GCP |
| azure | [AzureBlobUpload](#AzureBlobUpload) | set if uploading to Azure |
| aliOSS | [AliOSSUpload](#AliOSSUpload) | set if uploading to AliOSS |

### StreamOutput

| Field | Type | Description |
| protocol | SreamProtocol | (optional) only RTMP is supported |
| urls | string[] | list of URLs to send stream to |

### ImageOutput

| Field | Type | Description |
| capture_interval | uint32 | time in seconds between each snapshot |
| width | int32 | width of the snapshot images (optional, the original width will be used if not provided) |
| height | int32 | height of the snapshot images (optional, the original width will be used if not provided) |
| filename_prefix | string | prefix used in each image filename (include any paths here) |
| filename_suffix | ImageFileSuffix | INDEX (1, 2, 3) or TIMESTAMP (in UTC) |
| image_codec | ImageCodec | IC_DEFAULT or IC_JPEG (optional, both options will cause JPEGs to be generated currently) |
| disable_manifest | bool | by default, Egress outputs a {filepath}.json with a list of exported snapshots |
| s3 | [S3Upload](#S3Upload) | set if uploading to S3 compatible storage. only one storage output can be set |
| gcp | [GCPUpload](#GCPUpload) | set if uploading to GCP |
| azure | [AzureBlobUpload](#AzureBlobUpload) | set if uploading to Azure |
| aliOSS | [AliOSSUpload](#AliOSSUpload) | set if uploading to AliOSS |

### S3Upload

| Field | Type | Description |
| access_key | string |  |
| secret | string | S3 secret key |
| bucket | string | destination bucket |
| region | string | region of the S3 bucket (optional) |
| endpoint | string | URL to use for S3 (optional) |
| force_path_style | bool | leave bucket in the path and never to sub-domain (optional) |
| metadata | map<string, string> | metadata key/value pairs to store (optional) |
| tagging | string | (optional) |
| proxy | [ProxyConfig](#ProxyConfig) | Proxy server to use when uploading(optional) |

### GCPUpload

| Field | Type | Description |
| credentials | string | Contents of credentials.json |
| bucket | string | destination bucket |
| proxy | [ProxyConfig](#ProxyConfig) | Proxy server to use when uploading(optional) |

### AzureBlobUpload

| Field | Type | Description |
| account_name | string |  |
| account_key | string |  |
| container_name | string | destination container |

### AliOSSUpload

| Field | Type | Description |
| access_key | string |  |
| secret | string |  |
| bucket | string |  |
| region | string |  |
| endpoint | string |  |

### EncodingOptions

| Field | Type | Description |
| width | int32 |  |
| height | int32 |  |
| depth | int32 | default 24 |
| framerate | int32 | default 30 |
| audio_codec | AudioCodec | default AAC |
| audio_bitrate | int32 | 128 |
| audio_frequency | int32 | 44100 |
| video_codec | VideoCodec | default H264_MAIN |
| video_bitrate | int32 | default 4500 |
| key_frame_interval | int32 | default 4s |

### EncodingOptionsPreset

Enum, valid values:

- H264_720P_30: 0
- H264_720P_60: 1
- H264_1080P_30: 2
- H264_1080P_60: 3
- PORTRAIT_H264_720P_30: 4
- PORTRAIT_H264_720P_60: 5
- PORTRAIT_H264_1080P_30: 6
- PORTRAIT_H264_1080P_60: 7

### ProxyConfig

For S3 and GCP, you can specify a proxy server for Egress to use when uploading files.

This can be helpful to avoid network restrictions on the destination buckets.

| Field | Type | Description |
| url | string | URL of the proxy |
| username | string | username for basic auth (optional) |
| password | string | password for basic auth (optional) |

### WebhookConfig

Extra webhooks can be configured for a specific Egress request. These webhooks are called for Egress lifecycle events in addition to the project wide webhooks. To learn more, see [Webhooks](https://docs.livekit.io/home/server/webhooks.md).

| Field | Type | Description |
| url | string | URL of the webhook |
| signing_key | string | API key to use to sign the request, must be defined for the project |

---

This document was rendered at 2025-09-27T09:36:33.425Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/api.md](https://docs.livekit.io/home/egress/api.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).