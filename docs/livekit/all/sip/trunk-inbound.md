LiveKit Docs › Accepting calls › Inbound trunk

---

# SIP inbound trunk

> How to create and configure an inbound trunk to accept incoming calls.

## Overview

After you purchase a phone number and [configure your SIP trunking provider](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md), you must create an inbound trunk and [dispatch rule](https://docs.livekit.io/sip/dispatch-rule.md) to accept incoming calls. The inbound trunk allows you to limit incoming calls to those coming from your SIP trunking provider.

You can also configure additional properties for all incoming calls that match the trunk including SIP headers, participant metadata and attributes, and session properties. For a full list of available parameters, see [`CreateSIPInboundTrunk`](https://docs.livekit.io/sip/api.md#createsipinboundtrunk).

> ℹ️ **Note**
> 
> LiveKit supports username and password authentication for inbound trunks, but your SIP trunking provider must also support it. Support varies by provider—for example, Twilio Elastic SIP Trunking doesn’t support it, though you can use username and password authentication with [TwiML](https://docs.livekit.io/sip/accepting-calls-twilio-voice.md). Check with your provider to confirm.

To learn more about LiveKit SIP, see [SIP overview](https://docs.livekit.io/sip.md). To learn more about SIP API endpoints and types, see [SIP API](https://docs.livekit.io/sip/api.md).

## Restricting calls to a region

When you configure your SIP trunking provider for inbound calls, you need to specify the LiveKit SIP endpoint to use. By default, this is a global endpoint and incoming calls are routed to the region closest to the call's origination point—typically the region where your telephony provider initiated the call. You can limit calls to a specific region using [region pinning](https://docs.livekit.io/sip/cloud.md).

## Inbound trunk example

The following examples create an inbound trunk that accepts calls made to the number `+1-510-555-0100` and enables Krisp [noise cancellation](https://docs.livekit.io/sip.md#noise-cancellation-for-calls). This phone number is the number purchased from your SIP trunking provider.

**LiveKit CLI**:

1. Create a file named `inbound-trunk.json` with the following content:

```json
{
  "trunk": {
    "name": "My trunk",
    "numbers": [
      "+15105550100"
    ],
    "krispEnabled": true
  }
}

```

> ❗ **Important**
> 
> If you're using Telnyx, the leading `+` in the phone number assumes the `Destination Number Format` is set to `+E.164` for your number.
2. Create the inbound trunk using `lk`:

```shell
lk sip inbound create inbound-trunk.json

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

// An array of one or more provider phone numbers associated with the trunk.
const numbers = ['+15105550100'];

const name = 'My trunk';

// Trunk options
const trunkOptions = {
  krispEnabled: true,
};

const trunk = sipClient.createSipInboundTrunk(
  name,
  numbers,
  trunkOptions,
);

console.log(trunk);

```

---

**Python**:

```python
import asyncio

from livekit import api

async def main():
  livekit_api = api.LiveKitAPI()

  trunk = api.SIPInboundTrunkInfo(
    name = "My trunk",
    numbers = ["+15105550100"],
    krisp_enabled = True,
  )

  request = api.CreateSIPInboundTrunkRequest(
    trunk = trunk
  )

  trunk = await livekit_api.sip.create_sip_inbound_trunk(request)

  await livekit_api.aclose()

asyncio.run(main())

```

---

**Ruby**:

```ruby
require 'livekit'

name = "My trunk"
numbers = ["+15105550100"]

sip_service = LiveKit::SIPServiceClient.new(
  ENV['LIVEKIT_URL'],
  api_key: ENV['LIVEKIT_API_KEY'],
  api_secret: ENV['LIVEKIT_API_SECRET']
)

resp = sip_service.create_sip_inbound_trunk(
    name,
    numbers
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
  trunkName := "My inbound trunk"
  numbers := []string{"+15105550100"}

  trunkInfo := &livekit.SIPInboundTrunkInfo{
    Name: trunkName,
    Numbers: numbers,
    KrispEnabled: true,
  }

  // Create a request
  request := &livekit.CreateSIPInboundTrunkRequest{
    Trunk: trunkInfo,
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))

  // Create trunk
  trunk, err := sipClient.CreateSIPInboundTrunk(context.Background(), request)

  if err != nil {
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
import io.livekit.server.CreateSipInboundTrunkOptions

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.createSipInboundTrunk(
    name = "My inbound trunk",
    numbers = listOf("+15105550100")
).execute()

if (!response.isSuccessful) {
    println(response.errorBody())
} else {
    val trunk = response.body()

    if (trunk != null) {
        println("Created inbound trunk: ${trunk.sipTrunkId}")
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
> You can also use the **Trunk details** tab to create a basic trunk. However, the JSON editor allows you to configure all available [parameters](https://docs.livekit.io/sip/api.md#createsipinboundtrunk). For example, the `krispEnabled` parameter is only available in the JSON editor.
5. Select **Inbound** for **Trunk direction**.
6. Copy and paste the following text into the editor:

```json
{
  "name": "My trunk",
  "numbers": [
    "+15105550100"
  ],
  "krispEnabled": true
}

```
7. Select **Create**.

## Accepting calls from specific phone numbers

The configuration for inbound trunk accepts inbound calls to number `+1-510-555-0100` from caller numbers `+1-310-555-1100` and `+1-714-555-0100`.

> ❗ **Important**
> 
> Remember to replace the numbers in the example with actual phone numbers when creating your trunks.

> 💡 **Tip**
> 
> You can also filter allowed caller numbers with a [Dispatch Rule](https://docs.livekit.io/sip/dispatch-rule.md).

**LiveKit CLI**:

1. Create a file named `inbound-trunk.json` with the following content:

```json
{
   "trunk": {
     "name": "My trunk",
     "numbers": [
       "+15105550100"
     ],
     "allowedNumbers": [
       "+13105550100",
       "+17145550100"
     ]
   }
}

```

> ❗ **Important**
> 
> If you're using Telnyx, the leading `+` in the phone number assumes the `Destination Number Format` is set to `+E.164` for your number.
2. Create the inbound trunk using `lk`:

```shell
lk sip inbound create inbound-trunk.json

```

---

**Node.js**:

For an executable example, replace the `trunk` in the [Inbound trunk example](#inbound-trunk-example) to include the following `trunkOptions`:

```typescript
// Trunk options
const trunkOptions = {
  allowed_numbers: ["+13105550100", "+17145550100"],
};

const trunk = sipClient.createSipInboundTrunk(
  name,
  numbers,
  trunkOptions,
);

```

---

**Python**:

For an executable example, replace the `trunk` in the [Inbound trunk example](#inbound-trunk-example) with the following;

```python
  trunk = SIPInboundTrunkInfo(
    name = "My trunk",
    numbers = ["+15105550100"],
    allowed_numbers = ["+13105550100", "+17145550100"]
  )

```

---

**Ruby**:

For an executable example, replace `resp` in the [Inbound trunk example](#inbound-trunk-example) with the following;

```ruby
resp = sip_service.create_sip_inbound_trunk(
    name,
    numbers,
    allowed_numbers = ["+13105550100", "+17145550100"]
)

```

---

**Go**:

For an executable example, replace `trunkInfo` in the [Inbound trunk example](#inbound-trunk-example) with the following;

```go
allowedNumbers := []string{"+13105550100", "+17145550100"}

trunkInfo := &livekit.SIPInboundTrunkInfo{
  Name: trunkName,
  Numbers: numbers,
  AllowedNumbers: allowedNumbers,
}

```

---

**Kotlin**:

```kotlin

import io.livekit.server.SipServiceClient
import io.livekit.server.CreateSipInboundTrunkOptions

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.createSipInboundTrunk(
  name = "My inbound trunk",
  numbers = listOf("+15105550100"),
  options = CreateSipInboundTrunkOptions(
    allowedNumbers = listOf("+13105550100", "+17145550100")
  )
).execute()

if (!response.isSuccessful) {
  println(response.errorBody())
} else {
  val trunk = response.body()

  if (trunk != null) {
    println("Created inbound trunk: ${trunk.sipTrunkId}")
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
> The `krispEnabled` and `allowedNumbers` parameters are only available in the **JSON editor** tab.
5. Select **Inbound** for **Trunk direction**.
6. Copy and paste the following text into the editor:

```json
{
  "name": "My trunk",
  "numbers": [
    "+15105550100"
  ],
  "krispEnabled": true,
  "allowedNumbers": [
    "+13105550100",
    "+17145550100"
  ]
}

```
7. Select **Create**.

## List inbound trunks

Use the [`ListSIPInboundTrunk`](https://docs.livekit.io/sip/api.md#listsipinboundtrunk) API to list all inbound trunks and trunk parameters.

**LiveKit CLI**:

```bash
lk sip inbound list

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

const rules = await sipClient.listSipInboundTrunk();

console.log(rules);

```

---

**Python**:

```python
import asyncio

from livekit import api
from livekit.protocol.sip import ListSIPInboundTrunkRequest

async def main():
  livekit_api = api.LiveKitAPI()

  rules = await livekit_api.sip.list_sip_inbound_trunk(
    ListSIPInboundTrunkRequest()
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

resp = sip_service.list_sip_inbound_trunk()

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
  trunks, err := sipClient.ListSIPInboundTrunk(
    context.Background(), &livekit.ListSIPInboundTrunkRequest{})

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

val response = sipClient.listSipInboundTrunk().execute()

if (!response.isSuccessful) {
  println(response.errorBody())
} else {
  val trunks = response.body()

  if (trunks != null) {
    println("Inbound trunks: ${trunks}")
  }
}

```

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. The **Inbound** section lists all inbound trunks.

## Update inbound trunk

Use the [`UpdateSIPInboundTrunk`](https://docs.livekit.io/sip/api.md#updatesipinboundtrunk) API to update specific fields of an inbound trunk or [replace](#replace-inbound-trunk) an inbound trunk with a new one.

### Update specific fields of an inbound trunk

The `UpdateSIPInboundTrunkFields` API allows you to update specific fields of an inbound trunk without affecting other fields.

**LiveKit CLI**:

1. Create a file named `inbound-trunk.json` with the following content:

```json
{
  "name": "My trunk",
  "numbers": [
    "+15105550100"
  ]
}

```

> ❗ **Important**
> 
> If you're using Telnyx, the leading `+` in the phone number assumes the `Destination Number Format` is set to `+E.164` for your number.

Update the inbound trunk using `lk`:

```shell
lk sip inbound update --id <trunk-id> inbound-trunk.json

```

---

**Node.js**:

```typescript
import { SipClient,  } from 'livekit-server-sdk';


const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

async function main() {

  const updatedTrunkFields = {
    allowedNumbers: ['+14155550100'],
    name: 'My updated trunk',
  }
  
  const trunk = await sipClient.updateSipInboundTrunkFields (
    <inbound-trunk-id>,
    updatedTrunkFields,
  );

  console.log('updated trunk ', trunk);

}

await main();

```

---

**Python**:

```python
import asyncio

from livekit import api 
from livekit.protocol.sip import SIPInboundTrunkInfo


async def main():
  livekit_api = api.LiveKitAPI()
  
  # To update specific trunk fields, use the update_sip_inbound_trunk_fields method.
  trunk = await livekit_api.sip.update_sip_inbound_trunk_fields(
    trunk_id = "<sip-trunk-id>",
    allowed_numbers = ["+13105550100", "+17145550100"],
    name = "My updated trunk",
  )
  
  print(f"Successfully updated trunk {trunk}")

  await livekit_api.aclose()

asyncio.run(main())

```

---

**Ruby**:

The update API is not yet available in the Ruby SDK.

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
  trunkName := "My updated inbound trunk"
  numbers := &livekit.ListUpdate{Set: []string{"+16265550100"}}
  allowedNumbers := &livekit.ListUpdate{Set: []string{"+13105550100", "+17145550100"}}

  trunkId := "<sip-trunk-id>"

  trunkInfo := &livekit.SIPInboundTrunkUpdate{
    Name: &trunkName,
    Numbers: numbers,
    AllowedNumbers: allowedNumbers,
  }

  // Create a request
  request := &livekit.UpdateSIPInboundTrunkRequest{
    SipTrunkId: trunkId,
    Action: &livekit.UpdateSIPInboundTrunkRequest_Update{
      Update: trunkInfo,
    },
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))
  
  // Update trunk
  trunk, err := sipClient.UpdateSIPInboundTrunk(context.Background(), request)

  if err != nil {
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
import io.livekit.server.UpdateSipInboundTrunkOptions

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.updateSipInboundTrunk(
    sipTrunkId = trunkId,
    options = UpdateSipInboundTrunkOptions(
        name = "My updated trunk",
        numbers = listOf("+15105550123")
    )
).execute()

if (!response.isSuccessful) {
    println(response.errorBody())
} else {
    val trunk = response.body()

    if (trunk != null) {
        println("Updated inbound trunk: ${trunk}")
    }
}

```

---

**LiveKit Cloud**:

Update and replace functions are the same in the LiveKit Cloud dashboard. For an example, see the [replace inbound trunk](#replace-inbound-trunk) section.

### Replace inbound trunk

The `UpdateSIPInboundTrunk` API allows you to replace an existing inbound trunk with a new one using the same trunk ID.

**LiveKit CLI**:

The CLI doesn't support replacing inbound trunks.

---

**Node.js**:

```typescript
import { SipClient,  } from 'livekit-server-sdk';


const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

async function main() {
  // Replace an inbound trunk entirely.
  const trunk = {
    name: "My replaced trunk",
    numbers: ['+17025550100'], 
    metadata: "Replaced metadata",
    allowedAddresses: ['192.168.254.10'],
    allowedNumbers: ['+14155550100', '+17145550100'],
    krispEnabled: true,
  };

  const updatedTrunk = await sipClient.updateSipInboundTrunk(
    trunkId,
    trunk
  );

  console.log( 'replaced trunk ', updatedTrunk);
}

await main();

```

---

**Python**:

To replace an existing trunk, edit the previous example by adding the import line,`trunk` and calling the `update_sip_inbound_trunk` function:

```python
from livekit.protocol.sip import SIPInboundTrunkInfo

async def main():
  livekit_api = api.LiveKitAPI()

  trunk = SIPInboundTrunkInfo(
      numbers = ['+15105550100'],
      allowed_numbers = ["+13105550100", "+17145550100"],
      name = "My replaced inbound trunk",
  )

  # This takes positional parameters
  trunk = await livekit_api.sip.update_sip_inbound_trunk("<sip-trunk-id>", trunk)

```

---

**Ruby**:

The update API is not yet available in the Ruby SDK.

---

**Go**:

To replace the trunk, update the previous example with the following `trunkInfo` and `request` objects:

```go
  // To replace the trunk, use the SIPInboundTrunkInfo object.
  trunkInfo := &livekit.SIPInboundTrunkInfo{
      Numbers: numbers,
      AllowedNumbers: allowedNumbers,
      Name: trunkName,
  }

  // Create a request.
  request := &livekit.UpdateSIPInboundTrunkRequest{
    SipTrunkId: trunkId,
    // To replace the trunk, use the Replace action instead of Update.
    Action: &livekit.UpdateSIPInboundTrunkRequest_Replace{
      Replace: trunkInfo,
    },  
  }

```

---

**Kotlin**:

Replacing an inbound trunk is not supported in Kotlin.

---

**LiveKit Cloud**:

1. Sign in to the **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config) page.
2. Navigate to the **Inbound** section.
3. Find the inbound trunk you want to replace → select the more (**⋮**) menu → select **Configure trunk**.
4. Copy and paste the following text into the editor:

```json
{
  "name": "My replaced trunk",
  "numbers": [
    "+17025550100"
  ],
  "metadata": "Replaced metadata",
  "allowedAddresses": ["192.168.254.10"],
  "allowedNumbers": [
    "+14155550100",
    "+17145550100"
  ],
  "krispEnabled": true
}

```
5. Select **Update**.

---

This document was rendered at 2025-09-27T09:36:52.029Z.
For the latest version of this document, see [https://docs.livekit.io/sip/trunk-inbound.md](https://docs.livekit.io/sip/trunk-inbound.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).