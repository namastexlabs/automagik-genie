LiveKit Docs › Features › DTMF

---

# Handling DTMF

> Sending and receiving DTMF tones.

LiveKit's Telephony stack fully supports DTMF tones, enabling integration with legacy IVR systems. It also enables agents to receive DTMF tones from telephone users.

## Sending DTMF

To send DTMF tones, use the `publishDtmf` API on the `localParticipant`.

This API transmits DTMF tones to the room; tones can be sent by any participant in the room.

SIP participants in the room receive the tones and relay them to the telephone user.

**Node.js**:

```typescript
// publishes 123# in DTMF
await localParticipant.publishDtmf(1, '1');
await localParticipant.publishDtmf(2, '2');
await localParticipant.publishDtmf(3, '3');
await localParticipant.publishDtmf(11, '#');

```

---

**Python**:

```python
# publishes 123# in DTMF
await local_participant.publish_dtmf(code=1, digit='1')
await local_participant.publish_dtmf(code=2, digit='2')
await local_participant.publish_dtmf(code=3, digit='3')
await local_participant.publish_dtmf(code=11, digit='#')

```

---

**Go**:

```go
import (
  "github.com/livekit/protocol/livekit"
)

// publishes 123# in DTMF
localParticipant.PublishDataPacket(&livekit.SipDTMF{
  Code: 1,
  Digit: "1",
})
localParticipant.PublishDataPacket(&livekit.SipDTMF{
  Code: 2,
  Digit: "2",
})
localParticipant.PublishDataPacket(&livekit.SipDTMF{
  Code: 3,
  Digit: "3",
})
localParticipant.PublishDataPacket(&livekit.SipDTMF{
  Code: 11,
  Digit: "#",
})

```

> ℹ️ **Info**
> 
> Sending DTMF tones requires both a numeric code and a string representation to ensure compatibility with various SIP implementations.
> 
> Special characters like `*` and `#` are mapped to their respective numeric codes. See [RFC 4733](https://datatracker.ietf.org/doc/html/rfc4733#section-3.2) for details.

## Receiving DTMF

When SIP receives DTMF tones, they are relayed to the room as events that participants can listen for.

**Node.js**:

```typescript
room.on(RoomEvent.DtmfReceived, (code, digit, participant) => {
  console.log('DTMF received from participant', participant.identity, code, digit);
});

```

---

**Python**:

```python
@room.on("sip_dtmf_received")
def dtmf_received(dtmf: rtc.SipDTMF):
    logging.info(f"DTMF received from {dtmf.participant.identity}: {dtmf.code} / {dtmf.digit}")

```

---

**Go**:

```go
import (
  "fmt"

  "github.com/livekit/protocol/livekit"
  lksdk "github.com/livekit/server-sdk-go/v2"
)

func DTMFCallbackExample() {
  // Create a new callback handler
	cb := lksdk.NewRoomCallback()

	// Handle data packets received from other participants
	cb.OnDataPacket = func(data lksdk.DataPacket, params lksdk.DataReceiveParams) {
		// handle DTMF
		switch val := data.(type) {
		case *livekit.SipDTMF:
			fmt.Printf("Received DTMF from %s: %s (%d)\n", params.SenderIdentity, val.Digit, val.Code)
		}
	}

  room := lksdk.NewRoom(cb)
  ...
}

```

---

This document was rendered at 2025-09-27T09:36:48.122Z.
For the latest version of this document, see [https://docs.livekit.io/sip/dtmf.md](https://docs.livekit.io/sip/dtmf.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).