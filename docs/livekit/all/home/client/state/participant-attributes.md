LiveKit Docs › LiveKit SDKs › State synchronization › Participant attributes

---

# Participant attributes and metadata

> A key-value store for per-participant state.

## Overview

Each LiveKit participant has two fields for application-specific state:

- **Participant.attributes**: A string key-value store
- **Participant.metadata**: A single string that can store any data.

These fields are stored and managed by the LiveKit server, and are automatically synchronized to new participants who join the room later.

Initial values can be set in the participant’s [access token](https://docs.livekit.io/concepts/authentication.md), ensuring the value is immediately available when the participant connects.

While the metadata field is a single string, the attributes field is a key-value store. This allows fine-grained updates to different parts of the state without affecting or transmitting the values of other keys.

## Deleting attributes

To delete an attribute key, set its value to an empty string (`''`).

## Update frequency

Attributes and metadata are not suitable for high-frequency updates (more than once every few seconds) due to synchronization overhead on the server. If you need to send updates more frequently, consider using [data packets](https://docs.livekit.io/home/client/data/packets.md) instead.

## Size limits

Metadata and attributes each have a 64 KiB limit. For attributes, this limit includes the combined size of all keys and values.

## Usage from LiveKit SDKs

The LiveKit SDKs receive events on attributes and metadata changes for both the local participant and any remote participants in the room. See [Handling events](https://docs.livekit.io/home/client/events.md#events) for more information.

Participants must have the `canUpdateOwnMetadata` permission in their access token to update their own attributes or metadata.

**JavaScript**:

```typescript
// receiving changes
room.on(
  RoomEvent.ParticipantAttributesChanged,
  (changed: Record<string, string>, participant: Participant) => {
    console.log(
      'participant attributes changed',
      changed,
      'all attributes',
      participant.attributes,
    );
  },
);

room.on(
  RoomEvent.ParticipantMetadataChanged,
  (oldMetadata: string | undefined, participant: Participant) => {
    console.log('metadata changed from', oldMetadata, participant.metadata);
  },
);

// updating local participant
room.localParticipant.setAttributes({
  myKey: 'myValue',
  myOtherKey: 'otherValue',
});
room.localParticipant.setMetadata(
  JSON.stringify({
    some: 'values',
  }),
);

```

---

**React**:

Our React component library provides a few convenience hooks to work with participant attributes.

```jsx
function MyComponent() {
  // getting all attributes of a participant
  const { attributes } = useParticipantAttributes({ participant: participant });

  // getting a single attribute of a participant
  const myKey = useParticipantAttribute('myKey', { participant: participant });

  // setting attributes and metadata would be the same as in JS
}

```

---

**Swift**:

```swift
extension MyClass: RoomDelegate {
    // receiving participant attributes changes
    func room(_ room: Room, participant: Participant, didUpdateAttributes changedAttributes: [String: String]) {

    }

    // receiving room metadata changes
    func room(_ room: Room, didUpdateMetadata newMetadata: String?) {

    }
}

// updating participant attributes (from async function)
try await room.localParticipant.set(attributes: ["mykey" : "myvalue"])

// updating participant metadata
try await room.localParticipant.set(metadata: "some metadata")

```

---

**Kotlin**:

```kotlin
room.events.collect { event ->
    when (event) {
        is RoomEvent.ParticipantAttributesChanged -> {
        }
        is RoomEvent.ParticipantMetadataChanged -> {
        }
    }
}

localParticipant.updateAttributes(mapOf("myKey" to "myvalue"))

localParticipant.updateMetadata("mymetadata")

```

---

**Flutter**:

```dart
final listener = room.createListener();

listener
  ..on<ParticipantAttributesChanged>((event) {})
  ..on<ParticipantMetadataUpdatedEvent>((event) {});

room.localParticipant?.setAttributes({
  'myKey': 'myValue',
});

room.localParticipant?.setMetadata('myMetadata');

```

---

**Python**:

```python
@room.on("participant_attributes_changed")
def on_attributes_changed(
    changed_attributes: dict[str, str], participant: rtc.Participant
):
    logging.info(
        "participant attributes changed: %s %s",
        participant.attributes,
        changed_attributes,
    )

@room.on("participant_metadata_changed")
def on_metadata_changed(
    participant: rtc.Participant, old_metadata: str, new_metadata: str
):
    logging.info(
        "metadata changed from %s to %s",
        old_metadata,
        participant.metadata,
    )

# setting attributes & metadata are async functions
async def myfunc():
    await room.local_participant.set_attributes({"foo": "bar"})
    await room.local_participant.set_metadata("some metadata")

asyncio.run(myfunc())

```

## Usage from server APIs

From the server side, you can update attributes or metadata of any participant in the room using the [RoomService.UpdateParticipant](https://docs.livekit.io/server/room-management.md#updateparticipant) API.

**Node.js**:

```typescript
import { RoomServiceClient } from 'livekit-server-sdk';

const roomServiceClient = new RoomServiceClient('myhost', 'api-key', 'my secret');
roomServiceClient.updateParticipant('room', 'identity', {
  attributes: {
    myKey: 'myValue',
  },
  metadata: 'updated metadata',
});

```

---

**Go**:

```go
import (
  "context"
  lksdk "github.com/livekit/server-sdk-go/v2"
)

func updateMetadata(values interface{}) {
  roomClient := lksdk.NewRoomServiceClient(host, apiKey, apiSecret)

	_, err := roomClient.UpdateParticipant(context.Background(), &livekit.UpdateParticipantRequest{
		Room:     "roomName",
		Identity: "participantIdentity",
		Metadata: "new metadata",
		Attributes: map[string]string{
			"myKey": "myvalue",
		},
	})
}

```

---

**Python**:

```python
import livekit.api

lkapi = livekit.api.LiveKitAPI()
lkapi.room.update_participant(
    UpdateParticipantRequest(
        room="roomName",
        identity="participantIdentity",
        metadata="new metadata",
        attributes={
            "myKey": "myValue",
        },
    ),
)

```

---

**Ruby**:

```ruby
require "livekit"

roomServiceClient = LiveKit::RoomServiceClient.new("https://my-livekit-url")
roomServiceClient.update_participant(
  room: "roomName",
  identity: "participantIdentity",
  attributes: {"myKey": "myvalue"})

```

---

**Java/Kotlin**:

The following example is in Kotlin, the Java API is similar.

```kotlin
// Update participant attributes and metadata
val call = roomServiceClient.updateParticipant(
    roomName = "room123",
    identity = "participant456",
    metadata = "New metadata",
    attributes = mapOf("myKey" to "myValue")
)
val response = call.execute()

```

---

This document was rendered at 2025-09-27T09:36:28.075Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/state/participant-attributes.md](https://docs.livekit.io/home/client/state/participant-attributes.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).