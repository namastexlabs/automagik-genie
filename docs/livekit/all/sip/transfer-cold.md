LiveKit Docs › Features › Transfers › Call forwarding

---

# Call forwarding

> Transfer calls to another number or SIP endpoint using SIP REFER.

A _cold transfer_ refers to forwarding a caller to another phone number or SIP endpoint. Performing a cold transfer closes the caller’s LiveKit session.

For transfers that include an AI agent to provide context, see the [Agent-assisted transfer](https://docs.livekit.io/sip/transfer-warm.md) guide.

## How it works

To transfer a caller out of a LiveKit room to another phone number, use the following steps:

1. Call the `TransferSIPParticipant` API.
2. LiveKit sends a SIP REFER through your trunk, instructing the provider to connect the caller to the new number or SIP endpoint.
3. The caller leaves the LiveKit room, ending the session.

## Transferring a SIP participant using SIP REFER

REFER is a SIP method that allows you to move an active session to another endpoint (that is, transfer a call). For LiveKit telephony apps, you can use the [`TransferSIPParticipant`](https://docs.livekit.io/sip/api.md#transfersipparticipant) server API to transfer a caller to another phone number or SIP endpoint.

In order to successfully transfer calls, you must configure your provider trunks to allow call transfers.

### Enable call transfers for your Twilio SIP trunk

Enable call transfer and PSTN transfers for your Twilio SIP trunk. To learn more, see Twilio's [Call Transfer via SIP REFER](https://www.twilio.com/docs/sip-trunking/call-transfer) documentation.

When you transfer a call, you have the option to set the caller ID to display the phone number of the transferee (the caller) or the transferor (the phone number associated with your LiveKit trunk).

**CLI**:

The following command enables call transfers and sets the caller ID to display the number of the transferee:

> ℹ️ **Note**
> 
> - To list trunks, execute `twilio api trunking v1 trunks list`.
> - To set the caller ID to the transferor, set `transfer-caller-id` to `from-transferor`.

```shell
twilio api trunking v1 trunks update --sid <twilio-trunk-sid> \
--transfer-mode enable-all \
--transfer-caller-id from-transferee

```

---

**Console**:

1. Sign in to the [Twilio console](https://console.twilio.com).
2. Navigate to **Elastic SIP Trunking** » **Manage** » **Trunks**, and select a trunk.
3. In the **Features** » **Call Transfer (SIP REFER)** section, select **Enabled**.
4. In the **Caller ID for Transfer Target** field, select an option.
5. Select **Enable PSTN Transfer**.
6. Save your changes.

### Usage

Set up the following environment variables:

```shell
export LIVEKIT_URL=%{wsURL}%
export LIVEKIT_API_KEY=%{apiKey}%
export LIVEKIT_API_SECRET=%{apiSecret}%

```

**Node.js**:

This example uses the LiveKit URL, API key, and secret set as environment variables.

```typescript
import { SipClient } from 'livekit-server-sdk';

// ...

async function transferParticipant(participant) {
  console.log("transfer participant initiated");

  const sipTransferOptions = {
    playDialtone: false
  };

  const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                  process.env.LIVEKIT_API_KEY,
                                  process.env.LIVEKIT_API_SECRET);

  const transferTo = "tel:+15105550100";

  await sipClient.transferSipParticipant('open-room', participant.identity, transferTo, sipTransferOptions);
  console.log('transfer participant');
}

```

---

**Python**:

```python
import asyncio
import logging
import os

from livekit import api
from livekit.protocol.sip import TransferSIPParticipantRequest

logger = logging.getLogger("transfer-logger")
logger.setLevel(logging.INFO)

async def transfer_call(participant_identity: str, room_name: str) -> None:
  async with api.LiveKitAPI() as livekit_api:
    transfer_to = 'tel:+14155550100'
    
    # Create transfer request
    transfer_request = TransferSIPParticipantRequest(
        participant_identity=participant_identity,
        room_name=room_name,
        transfer_to=transfer_to,
        play_dialtone=False
    )
    logger.debug(f"Transfer request: {transfer_request}")

    # Transfer caller
    await livekit_api.sip.transfer_sip_participant(transfer_request)
    logger.info(f"Successfully transferred participant {participant_identity} to {transfer_to}")

```

For a full example using a voice agent, DTMF, and SIP REFER, see the [phone assistant example](https://github.com/ShayneP/phone-assistant).

---

**Ruby**:

```ruby
require 'livekit'

room_name = 'open-room'
participant_identity = 'participant_identity'

def transferParticipant(room_name, participant_identity)

  sip_service = LiveKit::SIPServiceClient.new(
    ENV['LIVEKIT_URL'],
    api_key: ENV['LIVEKIT_API_KEY'],
    api_secret: ENV['LIVEKIT_API_SECRET']
  )

  transfer_to = 'tel:+14155550100'

  sip_service.transfer_sip_participant(
      room_name,
      participant_identity,
      transfer_to,
      play_dialtone: false
  )

end

```

---

**Go**:

```go
import (
  "context"
  "fmt"
  "os"

  lksdk "github.com/livekit/server-sdk-go/v2"
  "github.com/livekit/protocol/livekit"
)

func transferParticipant(ctx context.Context, participantIdentity string) {

  roomName := "open-room"
  transferTo := "tel:+14155550100'

  // Create a transfer request
  transferRequest := &livekit.TransferSIPParticipantRequest{
    RoomName: roomName,
    ParticipantIdentity: participantIdentity,
    TransferTo: transferTo,
    PlayDialtone: false,
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))

  // Execute transfer request
  _, err := sipClient.TransferSIPParticipant(ctx, transferRequest)
  if err != nil {
    fmt.Println(err)
  }
}

```

---

**CLI**:

```shell
lk sip participant transfer --room <CURRENT_ROOM> \
   --identity <PARTICIPANT_ID> \
  --to "<SIP_ENDPOINT>

```

Where `<SIP_ENDPOINT>` is a valid SIP endpoint or telephone number. The following examples are valid formats:

- `tel:+15105550100`
- `sip:+15105550100@sip.telnyx.com`
- `sip:+15105550100@my-livekit-demo.pstn.twilio.com`

---

This document was rendered at 2025-09-27T09:36:51.206Z.
For the latest version of this document, see [https://docs.livekit.io/sip/transfer-cold.md](https://docs.livekit.io/sip/transfer-cold.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).