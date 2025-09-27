LiveKit Docs › Making calls › Make outbound calls

---

# Make outbound calls

> Create a LiveKit SIP participant to make outbound calls.

The following sections include examples for making an outbound call by creating a LiveKit SIP participant and configuring call settings for dialing out. To create an AI agent to make outbound calls on your behalf, see the [Voice AI telephony guide](https://docs.livekit.io/agents/start/telephony.md).

## Creating a SIP participant

To make outbound calls with SIP Service, create a SIP participant with the [`CreateSIPParticipant`](https://docs.livekit.io/sip/api.md#createsipparticipant) API. It returns an `SIPParticipantInfo` object that describes the participant.

Outbound calling requires at least one [Outbound Trunk](https://docs.livekit.io/sip/trunk-outbound.md).

**LiveKit CLI**:

1. Create a `sip-participant.json` file with the following participant details:

```json
{
  "sip_trunk_id": "<your-trunk-id>",
  "sip_call_to": "<phone-number-to-dial>",
  "room_name": "my-sip-room",
  "participant_identity": "sip-test",
  "participant_name": "Test Caller",
  "krisp_enabled": true,
  "wait_until_answered": true
}

```
2. Create the SIP Participant using the CLI. After you run this command, the participant makes a call to the `sip_call_to` number configured in your outbound trunk. When you set `wait_until_answered` to `true`, the command waits until the callee picks up the call before returning. You can also monitor the call status using the [SIP participant attributes](https://docs.livekit.io/sip/sip-participant.md#sip-attributes). When the callee picks up the call, the `sip.callStatus` attribute is `active`.

```shell
lk sip participant create sip-participant.json

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

// Outbound trunk to use for the call
const trunkId = '<your-trunk-id>';

// Phone number to dial
const phoneNumber = '<phone-number-to-dial>';

// Name of the room to attach the call to
const roomName = 'my-sip-room';

const sipParticipantOptions = {
  participantIdentity: 'sip-test',
  participantName: 'Test Caller',
  krispEnabled: true,
  waitUntilAnswered: true
};

async function main() {
  try {
    const participant = await sipClient.createSipParticipant(
      trunkId,
      phoneNumber,
      roomName,
      sipParticipantOptions
    );

    console.log('Participant created:', participant);
  } catch (error) {
    console.error('Error creating SIP participant:', error);
  }
}

main();

```

---

**Python**:

```python
import asyncio

from livekit import api 
from livekit.protocol.sip import CreateSIPParticipantRequest, SIPParticipantInfo

async def main():
    livekit_api = api.LiveKitAPI()

    request = CreateSIPParticipantRequest(
        sip_trunk_id = "<trunk_id>",
        sip_call_to = "<phone_number>",
        room_name = "my-sip-room",
        participant_identity = "sip-test",
        participant_name = "Test Caller",
        krisp_enabled = True,
        wait_until_answered = True
    )
    
    try:
        participant = await livekit_api.sip.create_sip_participant(request)
        print(f"Successfully created {participant}")
    except Exception as e:
        print(f"Error creating SIP participant: {e}")
    finally:
        await livekit_api.aclose()

asyncio.run(main())

```

---

**Ruby**:

```ruby
require 'livekit'

trunk_id = "<trunk_id>";
number = "<phone_number>";
room_name = "my-sip-room";
participant_identity = "sip-test";
participant_name = "Test Caller";

sip_service = LiveKit::SIPServiceClient.new(
  ENV['LIVEKIT_URL'],
  api_key: ENV['LIVEKIT_API_KEY'],
  api_secret: ENV['LIVEKIT_API_SECRET']
)

resp = sip_service.create_sip_participant(
    trunk_id,
    number,
    room_name,
    participant_identity: participant_identity,
    participant_name: participant_name
)

puts resp.data

```

---

**Go**:

```go
package main

import (
  "context"
  "fmt"
  "os"

  lksdk "github.com/livekit/server-sdk-go/v2"
  "github.com/livekit/protocol/livekit"
)

func main() {
  trunkId := "<trunk_id>";
  phoneNumber := "<phone_number>";
  roomName := "my-sip-room";
  participantIdentity := "sip-test";
  participantName := "Test Caller";

  request := &livekit.CreateSIPParticipantRequest {
    SipTrunkId: trunkId,
    SipCallTo: phoneNumber,
    RoomName: roomName,
    ParticipantIdentity: participantIdentity,
    ParticipantName: participantName,
    KrispEnabled: true,
    WaitUntilAnswered: true,
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))

  // Create trunk
  participant, err := sipClient.CreateSIPParticipant(context.Background(), request)

  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(participant)
  }
}

```

Once the user picks up, they will be connected to `my-sip-room`.

## Making a call with extension codes (DTMF)

To make outbound calls with fixed extension codes (DTMF tones), set `dtmf` field in `CreateSIPParticipant` request:

**LiveKit CLI**:

```json
{
  "sip_trunk_id": "<your-trunk-id>",
  "sip_call_to": "<phone-number-to-dial>",
  "dtmf": "*123#ww456",
  "room_name": "my-sip-room",
  "participant_identity": "sip-test",
  "participant_name": "Test Caller"
}

```

---

**Node.js**:

```typescript
const sipParticipantOptions = {
  participantIdentity: 'sip-test',
  participantName: 'Test Caller',
  dtmf: '*123#ww456'
};

```

---

**Python**:

```python
  request = CreateSIPParticipantRequest(
    sip_trunk_id = "<trunk_id>",
    sip_call_to = "<phone_number>",
    room_name = "my-sip-room",
    participant_identity = "sip-test",
    participant_name = "Test Caller",
    dtmf = "*123#ww456"
  )

```

---

**Ruby**:

```ruby
resp = sip_service.create_sip_participant(
    trunk_id,
    number,
    room_name,
    participant_identity: participant_identity,
    participant_name: participant_name,
    dtmf: "*123#ww456"
)

```

---

**Go**:

```go
  request := &livekit.CreateSIPParticipantRequest{
    SipTrunkId: trunkId,
    SipCallTo: phoneNumber,
    RoomName: roomName,
    ParticipantIdentity: participantIdentity,
    ParticipantName: participantName,
    Dtmf: "*123#ww456",
  }

```

> 💡 **Tip**
> 
> Character `w` can be used to delay DTMF by 0.5 sec.

This example will dial a specified number and will send the following DTMF tones:

- `*123#`
- Wait 1 sec
- `456`

## Playing dial tone while the call is dialing

SIP participants emit no audio by default while the call connects. This can be changed by setting `play_dialtone` field in `CreateSIPParticipant` request:

**LiveKit CLI**:

```json
{
  "sip_trunk_id": "<your-trunk-id>",
  "sip_call_to": "<phone-number-to-dial>",
  "room_name": "my-sip-room",
  "participant_identity": "sip-test",
  "participant_name": "Test Caller",
  "play_dialtone": true
}

```

---

**Node.js**:

```typescript
const sipParticipantOptions = {
  participantIdentity: 'sip-test',
  participantName: 'Test Caller',
  playDialtone: true
};

```

---

**Python**:

```python
  request = CreateSIPParticipantRequest(
    sip_trunk_id = "<trunk_id>",
    sip_call_to = "<phone_number>",
    room_name = "my-sip-room",
    participant_identity = "sip-test",
    participant_name = "Test Caller",
    play_dialtone = True
  )

```

---

**Ruby**:

```ruby
resp = sip_service.create_sip_participant(
    trunk_id,
    number,
    room_name,
    participant_identity: participant_identity,
    participant_name: participant_name,
    play_dialtone: true
)

```

---

**Go**:

```go
  request := &livekit.CreateSIPParticipantRequest{
    SipTrunkId: trunkId,
    SipCallTo: phoneNumber,
    RoomName: roomName,
    ParticipantIdentity: participantIdentity,
    ParticipantName: participantName,
    PlayDialtone: true,
  }

```

If `play_dialtone` is enabled, the SIP Participant plays a dial tone to the room until the phone is picked up.

---

This document was rendered at 2025-09-27T09:36:48.914Z.
For the latest version of this document, see [https://docs.livekit.io/sip/outbound-calls.md](https://docs.livekit.io/sip/outbound-calls.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).