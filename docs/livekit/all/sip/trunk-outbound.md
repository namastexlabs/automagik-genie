LiveKit Docs › Making calls › Outbound trunk

---

# SIP outbound trunk

> How to create and configure a outbound trunk to make outgoing calls.

To provision an outbound trunk with the SIP Service, use the [`CreateSIPOutboundTrunk`](https://docs.livekit.io/sip/api.md#createsipoutboundtrunk) API. It returns an `SIPOutboundTrunkInfo` object that describes the created SIP trunk. You can query these parameters any time using the `ListSIPOutboundTrunk` API.

## Restricting calls to a region

To originate calls from the same region as the destination phone number, set the `destination_country` parameter for an outbound trunk. This applies region pinning to all calls made through the trunk. When `destination_country` is enabled, outbound calls are routed based on location:

- For countries that LiveKit operates data centers in, calls originate from a server within the country.
- For other countries, calls originate from a server that is closest to that country.

In the unlikely event that the preferred region is non-operational or offline, calls originate from another region nearby. For a full list of supported regions, see [Available regions](https://docs.livekit.io/sip/cloud.md#available-regions).

The `destination_country` parameter accepts a two-letter country code. To learn more, see [CreateSIPOutboundTrunk](https://docs.livekit.io/sip/api.md#createsipoutboundtrunk).

## Create an outbound trunk

The following creates a SIP outbound trunk with username and password authentication. It makes outbound calls from number `+15105550100`.

**LiveKit CLI**:

1. Create a file named `outbound-trunk.json` using your phone number, trunk domain name, and `username` and `password`:

**Twilio**:

```json
{
  "trunk": {
    "name": "My outbound trunk",
    "address": "<my-trunk>.pstn.twilio.com",
    "numbers": ["+15105550100"],
    "authUsername": "<username>",
    "authPassword": "<password>"
  }
}

```

---

**Telnyx**:

```json
{
  "trunk": {
    "name": "My outbound trunk",
    "address": "sip.telnyx.com",
    "numbers": ["+15105550100"],
    "authUsername": "<username>",
    "authPassword": "<password>"
  }
}

```

> ℹ️ **Note**
> 
> Use a regional SIP Signaling Address from [Telnyx SIP Signaling Addresses](https://sip.telnyx.com/#signaling-addresses) for the `address` field. This example config uses the US SIP proxy, `sip.telnyx.com`.
2. Create the outbound trunk using the CLI:

```shell
lk sip outbound create outbound-trunk.json

```

The output of the command returns the trunk ID. Copy it for the next step:

```text
SIPTrunkID: <your-trunk-id>

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

// SIP address is the hostname or IP the SIP INVITE is sent to.
// Address format for Twilio: <trunk-name>.pstn.twilio.com
// Address format for Telnyx: sip.telnyx.com
const address = 'sip.telnyx.com';

// An array of one or more provider phone numbers associated with the trunk.
const numbers = ['+12135550100'];

// Trunk options
const trunkOptions = {
  auth_username: '<username>',
  auth_password: '<password>'
};

const trunk = sipClient.createSipOutboundTrunk(
  'My trunk',
  address,
  numbers,
  trunkOptions
);

```

---

**Python**:

```python
import asyncio

from livekit import api
from livekit.protocol.sip import CreateSIPOutboundTrunkRequest, SIPOutboundTrunkInfo

async def main():
  lkapi = api.LiveKitAPI()

  trunk = SIPOutboundTrunkInfo(
    name = "My trunk",
    address = "sip.telnyx.com",
    numbers = ['+12135550100'],
    auth_username = "<username>",
    auth_password = "<password>"
  )

  request = CreateSIPOutboundTrunkRequest(
    trunk = trunk
  )

  trunk = await lkapi.sip.create_sip_outbound_trunk(request)

  print(f"Successfully created {trunk}")

  await lkapi.aclose()

asyncio.run(main())

```

---

**Ruby**:

```ruby
require 'livekit'

name = "My trunk"
address = "sip.telnyx.com"
numbers = ["+12135550100"]
auth_username = "<username>"
auth_password = "<password>"

sip_service = LiveKit::SIPServiceClient.new(
  ENV['LIVEKIT_URL'],
  api_key: ENV['LIVEKIT_API_KEY'],
  api_secret: ENV['LIVEKIT_API_SECRET']
)

resp = sip_service.create_sip_outbound_trunk(
    name,
    address,
    numbers,
    auth_username: auth_username,
    auth_password: auth_password
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
  trunkName := "My trunk"
  address := "sip.telnyx.com"
  numbers := []string{"+16265550100"}

  trunkInfo := &livekit.SIPOutboundTrunkInfo{
    Name: trunkName,
    Address: address,
    Numbers: numbers,
  }

  // Create a request
  request := &livekit.CreateSIPOutboundTrunkRequest{
    Trunk: trunkInfo,
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))
  
  // Create trunk
  trunk, err := sipClient.CreateSIPOutboundTrunk(context.Background(), request)

  if (err != nil) {
    fmt.Println(err)
  } else {
    fmt.Println(trunk)
  }
}

```

---

**Kotlin**:

```kotlin
import io.livekit.server.SipServiceClient
import io.livekit.server.CreateSipOutboundTrunkOptions


val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.createSipOutboundTrunk(
    name = "My outbound trunk",
    address = "sip.telnyx.com",
    numbers = listOf("+16265550100"),
    options = CreateSipOutboundTrunkOptions(
        authUsername = "username",
        authPassword = "password"
    )
).execute()

if (!response.isSuccessful) {
    println(response.errorBody())
} else {
    val trunk = response.body()

    if (trunk != null) {
        println("Created outbound trunk: ${trunk.sipTrunkId}")
    }
}

```

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select **Create new** → **Trunk**.
4. Select the **JSON editor** tab.

> ℹ️ **Note**
> 
> You can also use the **Trunk details** tab to create a trunk. However, the JSON editor allows you to configure all available [parameters](https://docs.livekit.io/sip/api.md#createsipoutboundtrunk).
5. Select **Outbound** for **Trunk direction**.
6. Copy and paste the following text into the editor:

```json
{
  "name": "My outbound trunk",
  "address": "sip.telnyx.com",
  "numbers": [
    "+12135550100"
  ],
  "authUsername": "test_username",
  "authPassword": "test_password"
}

```
7. Select **Create**.

### Configuring an outbound trunk for any phone number

The `numbers` parameter for outbound trunks is a required field. However, you can set the parameter to any string (for example, `*`) to use the outbound trunk for calls from any number. This is useful if you want to use the same outbound trunk for all calls or if you want to use a different phone number for each call.

Instead of setting the number on the trunk, you can set the phone number to call from using the `sip_number` parameter for the [CreateSIPParticipant](https://docs.livekit.io/sip/api.md#createsipparticipant) API.

The following example creates an outbound trunk that allows calling from any number, then initiates a call using the outbound trunk.

1. Create an outbound trunk using the CLI.

Create a file named `outbound-trunk.json` and copy and paste the following content:

```json
  {
    "trunk": {
      "name": "My outbound trunk",
      "address": "<my-trunk>.pstn.twilio.com",
      "numbers": ["*"],
      "auth_username": "<username>",
      "auth_password": "<password>"
    }
  }

```

Create the outbound trunk using the CLI:

```shell
lk sip outbound create outbound-trunk.json

```
2. Initiate a call from the number `+15105550100` using the CLI. This number is the phone number configured with your SIP trunk provider. Use the <trunk-id> from the output of the previous step.

Create a file named `participant.json` and copy and paste the following content:

```json
{
  "sip_number": "+15105550100",
  "sip_trunk_id": "<trunk-id>",
  "sip_call_to": "+12135550100",
  "room_name": "open-room",
  "participant_identity": "sip-test",
  "participant_name": "Test call participant",
  "wait_until_answered": true
}

```

> ❗ **Important**
> 
> If you're using Telnyx, the leading `+` in the phone number assumes the `Destination Number Format` is set to `+E.164` for your number.

Initiate the call using the CLI:

```shell
lk sip participant create participant.json

```

After you run the command, a call from the number `+15105550100` to `+12135550100` is initiated. Output from the command returns when the call is answered.

## List outbound trunks

Use the [`ListSIPOutboundTrunk`](https://docs.livekit.io/sip/api.md#listsipoutboundtrunk) API to list all outbound trunks and trunk parameters.

**LiveKit CLI**:

```bash
lk sip outbound list

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

const rules = await sipClient.listSipOutboundTrunk();

console.log(rules);

```

---

**Python**:

```python
import asyncio

from livekit import api
from livekit.protocol.sip import ListSIPOutboundTrunkRequest

async def main():
  livekit_api = api.LiveKitAPI()

  rules = await livekit_api.sip.list_sip_outbound_trunk(
    ListSIPOutboundTrunkRequest()
  )
  print(f"{rules}")

  await livekit_api.aclose()

asyncio.run(main())

```

---

**Ruby**:

```ruby
require 'livekit'

sip_service = LiveKit::SIPServiceClient.new(
  ENV['LIVEKIT_URL'],
  api_key: ENV['LIVEKIT_API_KEY'],
  api_secret: ENV['LIVEKIT_API_SECRET']
)

resp = sip_service.list_sip_outbound_trunk()

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

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))

  // List dispatch rules
  trunks, err := sipClient.ListSIPOutboundTrunk(
    context.Background(), &livekit.ListSIPOutboundTrunkRequest{})

  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(trunks)
  }
}

```

---

**Kotlin**:

```kotlin
import io.livekit.server.SipServiceClient

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.listSipOutboundTrunk().execute()

if (!response.isSuccessful) {
  println(response.errorBody())
} else {
  val trunks = response.body()

  if (trunks != null) {
    println("Outbound trunks: ${trunks}")
  }
}

```

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. The **Outbound** section lists all outbound trunks.

## Update an outbound trunk

The [`UpdateSIPOutboundTrunk`](https://docs.livekit.io/sip/api.md#updatesipoutboundtrunk) API allows you to update specific fields of an outbound trunk or [replace](#replace-sip-outbound-trunk) an outbound trunk with a new one.

### Update specific fields of an outbound trunk

The `UpdateSIPOutboundTrunkFields` API allows you to update specific fields of an outbound trunk without affecting other fields.

**LiveKit CLI**:

1. Create a file named `outbound-trunk.json` with the fields you want to update. The following example updates the name and phone numbers for the trunk:

**Twilio**:

```json
{
   "name": "My updated outbound trunk",
   "address": "<my-trunk>.pstn.twilio.com",
   "numbers": ["+15105550100"]
}

```

---

**Telnyx**:

```json
{
   "name": "My updated outbound trunk",
   "address": "sip.telnyx.com",
   "numbers": ["+15105550100"]
}

```

> ℹ️ **Note**
> 
> Use a regional SIP Signaling Address from [Telnyx SIP Signaling Addresses](https://sip.telnyx.com/#signaling-addresses) for the `address` field. This example config uses the US SIP proxy, `sip.telnyx.com`.
2. Update the outbound trunk using the CLI:

```shell
lk sip outbound update --id <sip-trunk-id> outbound-trunk.json

```

The output of the command returns the trunk ID:

```text
SIPTrunkID: <your-trunk-id>

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

/**
 * Update fields of an outbound trunk.
 * @param {string} trunkId The ID of the trunk to update.
 * @returns {Object} The result of the update operation.
 */
async function updateTrunk(trunkId) {

  const updatedTrunkFields = {
    name: 'My updated trunk',
    address: 'my-trunk.pstn.twilio.com',
  }
  
  const trunk = await sipClient.updateSipOutboundTrunkFields (
    trunkId,
    updatedTrunkFields,
  );

  return trunk;
}

updateTrunk('<outbound-trunk-id>');

```

---

**Python**:

```python
import asyncio

from livekit import api


async def main():
  lkapi = api.LiveKitAPI()

  trunk = await lkapi.sip.update_sip_outbound_trunk_fields(
    trunk_id = "<sip-trunk-id>",
    name = "My updated outbound trunk",
    address = "sip.telnyx.com",
    numbers = ['+15105550100']
  )

  print(f"Successfully updated {trunk}")

  await lkapi.aclose()

asyncio.run(main())

```

---

**Ruby**:

The Ruby SDK doesn't yet support updating outbound trunks.

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
  trunkName := "My updated outbound trunk"
  numbers := &livekit.ListUpdate{Set: []string{"+16265550100"}}
  transport := livekit.SIPTransport_SIP_TRANSPORT_UDP

  trunkId := "<sip-trunk-id>"

  trunkInfo := &livekit.SIPOutboundTrunkUpdate{
    Name: &trunkName,
    Numbers: numbers,
    Transport: &transport,
  }

  // Create a request
  request := &livekit.UpdateSIPOutboundTrunkRequest{
    SipTrunkId: trunkId,
    Action: &livekit.UpdateSIPOutboundTrunkRequest_Update{
      Update: trunkInfo,
    },  
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))
  
  // Update trunk
  trunk, err := sipClient.UpdateSIPOutboundTrunk(context.Background(), request)

  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(trunk)
  }
}
~   

```

---

**Kotlin**:

```kotlin
import io.livekit.server.SipServiceClient
import io.livekit.server.UpdateSipOutboundTrunkOptions

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.updateSipOutboundTrunk(
    sipTrunkId = trunkId,
    options = UpdateSipOutboundTrunkOptions(
        name = "My updated outbound trunk",
        numbers = listOf("+16265550100")
        metadata = "{'key1': 'value1', 'key2': 'value2'}",
        authUsername = "updated-username",
        authPassword = "updated-password"
    )
).execute()

if (!response.isSuccessful) {
    println(response.errorBody())
} else {
    val trunk = response.body()

    if (trunk != null) {
        println("Updated outbound trunk: ${trunk}")
    }
}

```

---

**LiveKit Cloud**:

Update and replace functions are the same in the LiveKit Cloud dashboard. For an example, see the [replace an outbound trunk](#replace-trunk) section.

### Replace an outbound trunk

The `UpdateSIPOutboundTrunk` API allows you to replace an existing outbound trunk with a new one using the same trunk ID.

**LiveKit CLI**:

The CLI doesn't support replacing outbound trunks.

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

async function replaceTrunk(trunkId) {
  // Replace an inbound trunk entirely.
  const trunk = {
    name: "My replaced trunk",
    address: "sip.telnyx.com",
    numbers: ['+17025550100'], 
    metadata: "{\"is_internal\": true}",
    authUsername: '<updated-username>',
    authPassword: '<updated-password>',
  };

  const updatedTrunk = await sipClient.updateSipOutboundTrunk(
    trunkId,
    trunk
  );

  return updatedTrunk;
}

replaceTrunk('<outbound-trunk-id>');

```

---

**Python**:

To replace a trunk, edit the previous example by adding the following import, `trunk`, and call the `update_sip_outbound_trunk` function:

```python
from livekit.protocol.sip import SIPOutboundTrunkInfo, SIPTransport

  trunk = SIPOutboundTrunkInfo(
      address = "sip.telnyx.com",
      numbers = ['+15105550100'],
      name = "My replaced outbound trunk",
      transport = SIPTransport.SIP_TRANSPORT_AUTO,
      auth_username = "<username>",
      auth_password = "<password>",
  )

  trunk = await lkapi.sip.update_sip_outbound_trunk(
    trunkId,
    trunk
  )                     

```

---

**Ruby**:

The Ruby SDK doesn't yet support updating outbound trunks.

---

**Go**:

To replace a trunk, use the previous example with the following `trunkInfo` and `request` values:

```go
  // Create a SIPOutboundTrunkInfo object
  trunkInfo := &livekit.SIPOutboundTrunkInfo{
    Name: "My replaced outbound trunk",
    Address: "sip.telnyx.com",
    Numbers: []string{"+16265550100"},
    Transport: livekit.SIPTransport_SIP_TRANSPORT_AUTO,
    AuthUsername: "<username>",
    AuthPassword: "<password>",
  }

  // Create a request
  request := &livekit.UpdateSIPOutboundTrunkRequest{
    SipTrunkId: trunkId,
    Action: &livekit.UpdateSIPOutboundTrunkRequest_Replace{
      Replace: trunkInfo,
    },  
  }

```

---

**Kotlin**:

Replacing an outbound trunk is not supported in Kotlin.

---

**LiveKit Cloud**:

1. Sign in to the **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config) page.
2. Navigate to the **Outbound** section.
3. Find the outbound trunk you want to replace → select the more (**⋮**) menu → select **Configure trunk**.
4. Copy and paste the following text into the editor:

```json
{
  "name": "My replaced trunk",
  "address": "sip.telnyx.com",
  "numbers": [
    "+17025550100"
  ],
  "metadata": "{\"is_internal\": true}",
  "authUsername": "<updated-username>",
  "authPassword": "<updated-password>"
}

```
5. Select **Update**.

## IP address range for LiveKit Cloud SIP

LiveKit Cloud nodes do not have a static IP address range, thus there's no way currently to use IP range for outbound authentication.

Thus, prefer setting user/password authentication on SIP trunk Provider.

If it's unavailable, or IP range is required in addition to user/password, set range(s) that include all IPs: e.g. `0.0.0.0/0` or `0.0.0.0/1`+`128.0.0.0/1`.

---

This document was rendered at 2025-09-27T09:36:52.298Z.
For the latest version of this document, see [https://docs.livekit.io/sip/trunk-outbound.md](https://docs.livekit.io/sip/trunk-outbound.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).