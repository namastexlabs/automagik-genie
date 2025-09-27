LiveKit Docs › LiveKit SDKs › Realtime text & data › Data packets

---

# Data packets

> Low-level API for high frequency or advanced use cases.

## Overview

Use `LocalParticipant.publishData` or [RoomService.SendData](https://docs.livekit.io/reference/server/server-apis.md#senddata) to send individual packets of data to one or more participants in a room.

> ℹ️ **Note**
> 
> This is a low-level API meant for advanced control over individual packet behavior. For most use cases, consider using the higher-level [text streams](https://docs.livekit.io/home/client/data/text-streams.md), [byte streams](https://docs.livekit.io/home/client/data/byte-streams.md), or [RPC](https://docs.livekit.io/home/client/data/rpc.md) features.

### Delivery options

LiveKit offers two forms of packet delivery:

- **Reliable**: Packets are delivered in order, with automatic retransmission in the case of packet loss. This is preferable for scenarios where delivery is prioritized over latency, such as in-room chat.
- **Lossy**: Each packet is sent once, with no ordering guarantee. This is ideal for realtime updates where speed of delivery is a priority.

> ℹ️ **Note**
> 
> Reliable delivery indicates "best-effort" delivery. It cannot fully guarantee the packet will be delivered in all cases. For instance, a receiver that is temporarily disconnected at the moment the packet is sent will not receive it. Packets are not buffered on the server and only a limited number of retransmissions are attempted.

### Size limits

In the **reliable** delivery mode, each packet can be up to 15KiB in size. The protocol limit is 16KiB for the entire data packet, but LiveKit adds various headers to properly route the packets which reduces the space available for user data.

While some platforms might support larger packet sizes without returning an error, LiveKit recommends this 16KiB limit to maximize compatibility across platforms and address limitations of the Stream Control Transmission Protocol (SCTP).  To learn more, see [Understanding message size limits](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels#understanding_message_size_limits).

In the **lossy** delivery mode, LiveKit recommends even smaller data packets - just 1300 bytes maximum - to stay within the network Maximum Transmit Unit (MTU) of 1400 bytes. Larger packets are fragmented into multiple packets and if any single packet is lost, the whole packet is lost with it.

### Selective delivery

Packets can be sent either to the entire room or to a subset of participants with the `destinationIdentities` parameter on the `publishData` call. To send to the entire room, leave `destinationIdentities` blank.

### Topic

You may have different types and purposes of data packets. To easily differentiate, set the `topic` field to any string that makes sense for your application.

For example, in a realtime multiplayer game, you might use different topics for chat messages, character position updates, and environment updates.

## Usage

**JavaScript**:

```typescript
const strData = JSON.stringify({some: "data"})
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// publishData takes in a Uint8Array, so we need to convert it
const data = encoder.encode(strData);

// Publish lossy data to the entire room
room.localParticipant.publishData(data, {reliable: false})

// Publish reliable data to a set of participants
room.localParticipant.publishData(data, {reliable: true, destinationIdentities: ['my-participant-identity']})

// Receive data from other participants
room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant: Participant, kind: DataPacket_Kind) => {
  const strData = decoder.decode(payload)
  ...
})

```

---

**Swift**:

```swift
import LiveKit

public class DataExample {
  func publishData(localParticipant: LocalParticipant, destinationIdentities: [Participant.Identity]) async throws {
    let someVal = "your value"

    // Publish lossy data to the entire room
    let options1 = DataPublishOptions(reliable: false)
    try await localParticipant.publish(data: someVal.data(using: .utf8), options: options1)

    // Publish reliable data to a set of participants
    let options2 = DataPublishOptions(reliable: true, destinationIdentities: destinationIdentities)
    try await localParticipant.publish(data: someVal.data(using: .utf8), options: options2)
  }
}

extension DataExample: RoomDelegate {
  func room(_ room: Room, participant: RemoteParticipant?, didReceiveData data: Data, forTopic topic: String) {
    // Received data
  }
}

```

---

**Kotlin**:

```kotlin
// Publishing data
coroutineScope.launch {
  val data: ByteArray = //...

  // Publish lossy data to the entire room
  room.localParticipant.publishData(data, DataPublishReliability.LOSSY)

  // Publish reliable data to a set of participants
  val identities = listOf(
    Participant.Identity("alice"),
    Participant.Identity("bob"),
  )
  room.localParticipant.publishData(data, DataPublishReliability.RELIABLE, identities)
}

// Processing received data
coroutineScope.launch {
  room.events.collect { event ->
    if(event is RoomEvent.DataReceived) {
        // Process data
    }
  }
}

```

---

**Flutter**:

```dart
class DataExample {
  Room room;
  late final _listener = room.createListener();

  DataExample() {
    _listener.on<DataReceivedEvent>((e) {
      // Process received data: e.data
    })
  }

  void publishData() {
    // publish lossy data to the entire room
    room.localParticipant.publishData(data, reliable: false);

    // publish reliable data to a set of participants with a specific topic
    room.localParticipant.publishData(data,
            reliable: true,
            destinationIdentities: ["identity1", "identity2"],
            topic: "topic1");
  }

  void dispose() {
    _listener.dispose();
  }
}

```

---

**Python**:

```python
@room.on("data_received")
def on_data_received(data: rtc.DataPacket):
  logging.info("received data from %s: %s", data.participant.identity, data.data)

# string payload will be encoded to bytes with UTF-8
await room.local_participant \
  .publish_data("my payload",
                reliable=True,
                destination_identities=["identity1", "identity2"],
                topic="topic1")

```

---

**Go**:

```go
room := lksdk.ConnectToRoom(
	url,
	info,
	&lksdk.RoomCallback{
		OnDataReceived: func(data []byte, rp *lksdk.RemoteParticipant) {
			// Process received data
		},
	},
)

// Publish lossy data to the entire room
room.LocalParticipant.PublishDataPacket(lksdk.UserData(data))

// Publish reliable data to a set of participants
room.LocalParticipant.PublishDataPacket(
    lksdk.UserData(data),
    lksdk.WithDataPublishReliable(true),
    lksdk.WithDataPublishDestination([]string{"alice", "bob"}),
)

```

---

**Unity**:

```csharp
yield return room.LocalParticipant.PublishData(data, DataPacketKind.RELIABLE, participant1, participant2);

room.DataReceived += (data, participant, kind) =>
{
    // Process received data
};

```

---

This document was rendered at 2025-09-27T09:36:26.592Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/data/packets.md](https://docs.livekit.io/home/client/data/packets.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).