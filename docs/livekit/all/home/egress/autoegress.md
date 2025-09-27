LiveKit Docs › Recording & export › Auto Egress

---

# Auto egress

> Automatically start recording with a room.

## Start recordings automatically

Sometimes it's desirable to record every track published to the room, or to start recording the room as soon as it's created.

Autoegress is designed to simplify these workflows. When a room is created with `CreateRoom`, you can set the `egress` field to have it automatically record the room as a composite as well as each published track separately.

## Examples

### Automatically record all tracks to S3

```shell
curl -X POST <your-host>/twirp/livekit.RoomService/CreateRoom \
	-H "Authorization: Bearer <token-with-roomCreate>" \
	-H 'Content-Type: application/json' \
	--data-binary @- << EOF
{
  "name": "my-room",
  "egress": {
    "tracks": {
      "filepath": "bucket-path/{room_name}-{publisher_identity}-{time}"
      "s3": {
        "access_key": "",
        "secret": "",
        "bucket": "mybucket",
        "region": "",
      }
    }
  }
}
EOF

```

### Record each room to HLS on GCP

```shell
curl -X POST <your-host>/twirp/livekit.RoomService/CreateRoom \
	-H "Authorization: Bearer <token-with-roomCreate>" \
	-H 'Content-Type: application/json' \
	--data-binary @- << EOF
{
  "name": "my-room",
  "egress": {
    "room": {
      "customBaseUrl": "https://your-template-url"
      "segments": {
        "filename_prefix": "path-in-bucket/myfile",
        "segment_duration": 3,
        "gcp": {
          "credentials": "<json-encoded-credentials>",
          "bucket": "mybucket"
        }
      }
    }
  }
}
EOF

```

---

This document was rendered at 2025-09-27T09:36:33.709Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/autoegress.md](https://docs.livekit.io/home/egress/autoegress.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).