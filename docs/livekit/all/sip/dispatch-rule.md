LiveKit Docs › Accepting calls › Dispatch rule

---

# SIP dispatch rule

> How to create and configure a dispatch rule.

## Introduction

A _dispatch rule_  controls how callers are added as SIP participants in rooms. When an inbound call reaches your SIP trunking provider and is connected to LiveKit, the SIP service authenticates the inbound trunk (if applicable) and looks for a matching dispatch rule. It then uses the rule to dispatch SIP participants to rooms.

The dispatch rule can also include room configuration options that specify which agents to dispatch to the room. _Agent dispatch_ is a separate feature that handles how agents are dispatched to rooms. To learn more, see [Agent dispatch](https://docs.livekit.io/agents/worker/agent-dispatch.md).

To create a dispatch rule with the SIP service, use the `CreateSIPDispatchRule` API. It returns a `SIPDispatchRuleInfo` object that describes the dispatch rule.

By default, a dispatch rule matches all your trunks and makes a caller's phone number visible to others in the room. You can modify these defaults using dispatch rule options. For a full list of available options, see the [`CreateSIPDispatchRule`](https://docs.livekit.io/sip/api.md#createsipdispatchrule) API reference.

To learn more about, see the following:

- [SIP overview](https://docs.livekit.io/sip.md): General concepts and features.
- [SIP API](https://docs.livekit.io/sip/api.md): API endpoints and types.

## Caller dispatch rule (individual)

An `SIPDispatchRuleIndividual` rule creates a new room for each caller. The name of the created room is the phone number of the caller plus a random suffix. You can optionally add a specific prefix to the room name by using the `roomPrefix` option.

The following examples dispatch callers into individual rooms prefixed with `call-`, and [dispatches an agent](https://docs.livekit.io/agents/worker/agent-dispatch.md) named `inbound-agent` to newly created rooms:

**LiveKit CLI**:

```json
{
  "dispatch_rule":
    {   
      "rule": {
        "dispatchRuleIndividual": {
          "roomPrefix": "call-"
        }   
      },  
      "name": "My dispatch rule",
      "roomConfig": {
        "agents": [{
          "agentName": "inbound-agent",
          "metadata": "job dispatch metadata"
        }]  
      }   
    }   
}

```

---

**Node.js**:

```typescript
const rule: SipDispatchRuleIndividual = {
  roomPrefix: "call-",
  type: 'individual',
};
const options: CreateSipDispatchRuleOptions = {
  name: 'My dispatch rule',
  roomConfig: new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: "inbound-agent",
        metadata: 'dispatch metadata',
      }),
    ],
  }),
};

const dispatchRule = await sipClient.createSipDispatchRule(rule, options);
console.log("created dispatch rule", dispatchRule);

```

---

**Python**:

```python
from livekit import api

lkapi = api.LiveKitAPI()

# Create a dispatch rule to place each caller in a separate room
rule = api.SIPDispatchRule(
  dispatch_rule_individual = api.SIPDispatchRuleIndividual(
    room_prefix = 'call-',
  )
)

request = api.CreateSIPDispatchRuleRequest(
  dispatch_rule = api.SIPDispatchRuleInfo(
    rule = rule,
    name = 'My dispatch rule',
    trunk_ids = [],
    room_config=api.RoomConfiguration(
        agents=[api.RoomAgentDispatch(
            agent_name="inbound-agent",
            metadata="job dispatch metadata",
        )]
    )
  )
)

dispatch = await lkapi.sip.create_sip_dispatch_rule(request)
print("created dispatch", dispatch)
await lkapi.aclose()

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

rule = LiveKit::Proto::SIPDispatchRule.new(
  dispatch_rule_direct: LiveKit::Proto::SIPDispatchRuleIndividual.new(
    room_prefix: "call-",
  )
)

resp = sip_service.create_sip_dispatch_rule(
  rule,
  name: "My dispatch rule",
  room_config: LiveKit::Proto::RoomConfiguration.new(
    agents: [
      LiveKit::Proto::RoomAgentDispatch.new(
        agent_name: "inbound-agent",
        metadata: "job dispatch metadata",
      )
    ]
  )
)

puts resp.data

```

---

**Go**:

```go
func main() {
  rule := &livekit.SIPDispatchRule{
    Rule: &livekit.SIPDispatchRule_DispatchRuleIndividual{
      DispatchRuleIndividual: &livekit.SIPDispatchRuleIndividual{
        RoomPrefix: "call-",
      },
    },
  }

  request := &livekit.CreateSIPDispatchRuleRequest{
    DispatchRule: &livekit.SIPDispatchRuleInfo{
      Name: "My dispatch rule",
      Rule: rule,
      RoomConfig: &livekit.RoomConfiguration{
        Agents: []*livekit.RoomAgentDispatch{
          {
            AgentName: "inbound-agent",
            Metadata:  "job dispatch metadata",
          },
        },
      },
    },
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                os.Getenv("LIVEKIT_API_KEY"),
                os.Getenv("LIVEKIT_API_SECRET"))

  // Execute the request
  dispatchRule, err := sipClient.CreateSIPDispatchRule(context.Background(), request)
  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(dispatchRule)
  }
}

```

---

**Kotlin**:

The SIP service client in Kotlin requires the HTTPS URL for the `host` parameter. This is your LIVEKIT_URL with the `wss` scheme replaced with the `https` scheme. For example, `https://<your-subdomain>.livekit.cloud`.

> ℹ️ **Agent dispatch not supported**
> 
> Adding a room configuration to a dispatch rule to enable agent dispatch is not supported in Kotlin.

```kotlin
import io.livekit.server.SipServiceClient
import io.livekit.server.SIPDispatchRuleIndividual
import io.livekit.server.CreateSipDispatchRuleOptions

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val rule = SIPDispatchRuleIndividual(
    roomPrefix = "call-"
)

val response = sipClient.createSipDispatchRule(
    rule = rule,
    options = CreateSipDispatchRuleOptions(
      name = "My dispatch rule"
    )
).execute()

if (response.isSuccessful) {
    val dispatchRule = response.body()
    println("Dispatch rule created: ${dispatchRule}")
}

```

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select **Create new** → **Dispatch rule**.
4. Select the **JSON editor** tab.

> ℹ️ **Note**
> 
> You can also use the **Dispatch rule details** tab to create a dispatch rule. However, the JSON editor allows you to configure all available [parameters](https://docs.livekit.io/sip/api.md#createsipdispatchrule).
5. Copy and paste the following JSON:

```json
 {
   "rule": {
     "dispatchRuleIndividual": {
       "roomPrefix": "call-"
     }
   },
   "name": "My dispatch rule",
   "roomConfig": {
     "agents": [{
       "agentName": "inbound-agent",
       "metadata": "job dispatch metadata"
     }]
   }
 }

```
6. Select **Create**.

> ℹ️ **Note**
> 
> When you omit the `trunk_ids` field, the dispatch rule matches calls from all inbound trunks.

## Direct dispatch rule

A direct dispatch rule places all callers into a specified room. You can optionally protect room access by adding a pin in the `pin` field:

In the following examples, all calls are immediately connected to room `open-room` on LiveKit.

**LiveKit CLI**:

1. Create a file named `dispatch-rule.json` and add the following:

```json
 {
   "dispatch_rule":
     {   
       "rule": {
         "dispatchRuleDirect": {
           "roomName": "open-room"
         }   
       },  
       "name": "My dispatch rule"
     }   
 }

```
2. Create the dispatch rule using `lk`:

```shell
lk sip dispatch create dispatch-rule.json

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

// Name of the room to attach the call to
const roomName = 'open-room';

const dispatchRuleOptions = {
  name: 'My dispatch rule',
};

// Dispatch all callers to the same room
const ruleType = {
  roomName: roomName,
  type: 'direct',
};

const dispatchRule = await sipClient.createSipDispatchRule(
  ruleType,
  dispatchRuleOptions
);

console.log(dispatchRule);

```

---

**Python**:

```python
import asyncio

from livekit import api

async def main():
  livekit_api = api.LiveKitAPI()

  # Create a dispatch rule to place all callers in the same room
  rule = api.SIPDispatchRule(
    dispatch_rule_direct = api.SIPDispatchRuleDirect(
      room_name = 'open-room',
    )
  )

  request = api.CreateSIPDispatchRuleRequest(
    dispatch_rule = api.SIPDispatchRuleInfo(
      rule = rule,
      name = 'My dispatch rule',
    )
  )

  try:
    dispatchRule = await livekit_api.sip.create_sip_dispatch_rule(request)
    print(f"Successfully created {dispatchRule}")
  except api.twirp_client.TwirpError as e:
    print(f"{e.code} error: {e.message}")

  await livekit_api.aclose()

asyncio.run(main())

```

---

**Ruby**:

```ruby
require 'livekit'

name = "My dispatch rule"
room_name = "open-room"

sip_service = LiveKit::SIPServiceClient.new(
  ENV['LIVEKIT_URL'],
  api_key: ENV['LIVEKIT_API_KEY'],
  api_secret: ENV['LIVEKIT_API_SECRET']
)

rule = LiveKit::Proto::SIPDispatchRule.new(
  dispatch_rule_direct: LiveKit::Proto::SIPDispatchRuleDirect.new(
    room_name: room_name,
  )
)

resp = sip_service.create_sip_dispatch_rule(
  rule,
  name: name,
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

  // Specify rule type and options
	rule := &livekit.SIPDispatchRule{
		Rule: &livekit.SIPDispatchRule_DispatchRuleDirect{
			DispatchRuleDirect: &livekit.SIPDispatchRuleDirect{
				RoomName: "open-room",
			},
		},
	}

  // Create request
	request := &livekit.CreateSIPDispatchRuleRequest{
		DispatchRule: &livekit.SIPDispatchRuleInfo{
			Rule:            rule,
			Name:            "My dispatch rule",
		},
	}

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))

  // Execute the request
  dispatchRule, err := sipClient.CreateSIPDispatchRule(context.Background(), request)

  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(dispatchRule)
  }
}

```

---

**Kotlin**:

> ℹ️ **Agent dispatch not supported**
> 
> Adding a room configuration to a dispatch rule to enable agent dispatch is not supported in Kotlin.

```kotlin
import io.livekit.server.SipServiceClient
import io.livekit.server.SIPDispatchRuleDirect
import io.livekit.server.CreateSipDispatchRuleOptions

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val rule = SIPDispatchRuleDirect(
    roomName = "open-room"
)

val response = sipClient.createSipDispatchRule(
    rule = rule,
    options = CreateSipDispatchRuleOptions(
      name = "My dispatch rule"
    )
).execute()

if (response.isSuccessful) {
    val dispatchRule = response.body()
    println("Dispatch rule created: ${dispatchRule}")
}

```

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select **Create new** → **Dispatch rule**.
4. Select the **JSON editor** tab.

> ℹ️ **Note**
> 
> You can also use the **Dispatch rule details** tab for this example by selecting **Direct** for **Rule type**.
5. Copy and paste the following JSON:

```json
 {
   "rule": {
     "dispatchRuleDirect": {
       "roomName": "open-room"
     }
   },
   "name": "My dispatch rule"
 }

```
6. Select **Create**.

### Pin-protected room

Add a `pin` to a room to require callers to enter a pin to connect to a room in LiveKit. The following example requires callers to enter `12345#` on the phone to enter `safe-room`:

```json
{
  "dispatch_rule":
    {
      "trunk_ids": [],
      "rule": {
        "dispatchRuleDirect": {
          "roomName": "safe-room",
          "pin": "12345"
        }
      },
      "name": "My dispatch rule"
    }
}

```

## Callee dispatch rule

This creates a dispatch rule that puts callers into rooms based on the called number. The name of the room is the called phone number plus an optional prefix (if `roomPrefix` is set). You can optionally add a random suffix for each caller by setting `randomize` to true, making a separate room per caller.

**LiveKit CLI**:

```json
{
  "dispatch_rule":
    {
      "rule": {
        "dispatchRuleCallee": {
          "roomPrefix": "number-",
          "randomize": false
        }
      },
      "name": "My dispatch rule"
    }
}

```

---

**Node.js**:

Callee dispatch rules can't be created using Node.js.

---

**Python**:

For an executable example, replace the rule in the [Direct dispatch rule](#direct-dispatch-rule) example with the following rule:

```python
from livekit import api

# Create a dispatch rule to place callers to the same phone number in the same room
rule = api.SIPDispatchRule(
  dispatch_rule_callee = api.SIPDispatchRuleCallee(
    room_prefix = 'number-',
    randomize = False,
  )
)

```

---

**Ruby**:

For an executable example, replace the rule in the [Direct dispatch rule](#direct-dispatch-rule) example with the following rule:

```ruby
rule = LiveKit::Proto::SIPDispatchRule.new(
  dispatch_rule_callee: LiveKit::Proto::SIPDispatchRuleCallee.new(
    room_prefix: 'number-',
    randomize: false,
  )
)

```

---

**Go**:

For an executable example, replace the rule in the [Direct dispatch rule](#direct-dispatch-rule) example with the following rule:

```go
  rule := &livekit.SIPDispatchRule{
    Rule: &livekit.SIPDispatchRule_DispatchRuleCallee{
      DispatchRuleCallee: &livekit.SIPDispatchRuleCallee{
        RoomPrefix: "number-",
        Randomize: false,
      },
    },
  }

```

---

**Kotlin**:

Callee dispatch rules can't be created using Kotlin.

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select **Create new** → **Dispatch rule**.
4. Select the **JSON editor** tab.

> ℹ️ **Note**
> 
> You can also use the **Dispatch rule details** tab for this example by selecting **Callee** for **Rule type**.
5. Copy and paste the following JSON:

```json
 {
   "rule": {
     "dispatchRuleCallee": {
       "roomPrefix": "number-",
       "randomize": false
     }
   },
   "name": "My dispatch rule"
 }

```
6. Select **Create**.

## Setting custom attributes on inbound SIP participants

LiveKit participants have an `attributes` field that stores key-value pairs. You can add custom attributes for SIP participants in the dispatch rule. These attributes are inherited by all SIP participants created by the dispatch rule.

To learn more, see [SIP participant attributes](https://docs.livekit.io/sip/sip-participant.md#sip-participant-attributes).

The following examples add two attributes to SIP participants created by this dispatch rule:

**LiveKit CLI**:

```json
{
  "dispatch_rule":
    {
      "attributes": {
        "<key_name1>": "<value1>",
        "<key_name2>": "<value2>"
      },
      "rule": {
        "dispatchRuleIndividual": {
          "roomPrefix": "call-"
        }
      },
      "name": "My dispatch rule"
    }
}

```

---

**Node.js**:

For an executable example, replace `dispatchRuleOptions` in the [Direct dispatch rule](#direct-dispatch-rule) example with the following options:

```typescript
const dispatchRuleOptions = {
  name: 'My invidividual dispatch rule',
  attributes: {
    "<key_name1>": "<value1>",
    "<key_name2>": "<value2>"
  },
};

```

---

**Python**:

For an executable example, replace `request` in the [Direct dispatch rule](#direct-dispatch-rule) example with the following options:

```python
request = api.CreateSIPDispatchRuleRequest(
  dispatch_rule = api.SIPDispatchRuleInfo(
    rule = rule,
    name = 'My dispatch rule',
    attributes = {
      "<key_name1>": "<value1>",
      "<key_name2>": "<value2>",
    }
  )
)

```

---

**Ruby**:

For an executable example, use the [Direct dispatch rule](#direct-dispatch-rule) example with the following options:

```ruby
resp = sip_service.create_sip_dispatch_rule(
  rule,
  name: name,
  attributes: {
    "<key_name1>" => "<value1>",
    "<key_name2>" => "<value2>",
  },
)

```

---

**Go**:

For an executable example, replace `request` in the [Direct dispatch rule](#direct-dispatch-rule) example with the following code:

```go
  // Create a request
	request := &livekit.CreateSIPDispatchRuleRequest{
		DispatchRule: &livekit.SIPDispatchRuleInfo{
			Rule:            rule,
			Name:            "My dispatch rule",
			Attributes: map[string]string{
				"<key_name1>": "<value1>",
				"<key_name2>": "<value2>",
			},
		},
	}

```

---

**Kotlin**:

Setting participant attributes in dispatch rules is not supported in Kotlin.

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select **Create new** → **Dispatch rule**.
4. Select the **JSON editor** tab.

> ℹ️ **Note**
> 
> The `attributes` parameter is only available in the **JSON editor** tab.
5. Copy and paste the following text into the editor:

```json
{
  "name": "My dispatchrule",
  "attributes": {
    "<key_name1>": "<value1>",
    "<key_name2>": "<value2>"
  },
  "rule": {
    "dispatchRuleIndividual": {
      "roomPrefix": "call-"
    }
  }
}

```
6. Select **Create**.

## Setting custom metadata on inbound SIP participants

LiveKit participants have a `metadata` field that can store arbitrary data for your application (typically JSON). It can also be set on SIP participants created by a dispatch rule. Specifically, `metadata` set on a dispatch rule will be inherited by all SIP participants created by it.

The following examples add the metadata, `{"is_internal": true}`, to all SIP participants created from an inbound call by this dispatch rule:

**LiveKit CLI**:

```json
{
  "dispatch_rule": {
    "metadata": "{\"is_internal\": true}",
    "rule": {
      "dispatchRuleIndividual": {
        "roomPrefix": "call-"
      }
    },
    "name": "My dispatch rule"
  }
}

```

---

**Node.js**:

For an executable example, replace `dispatchRuleOptions` in the [Direct dispatch rule](#direct-dispatch-rule) example with the following options:

```typescript
const dispatchRuleOptions = {
  name: 'My invidividual dispatch rule',
  metadata: "{\"is_internal\": true}",
};

```

---

**Python**:

For an executable example, replace `request` in the [Direct dispatch rule](#direct-dispatch-rule) example with the following options:

```python
  request = api.CreateSIPDispatchRuleRequest(
    dispatch_rule = api.SIPDispatchRuleInfo(
      rule = rule,
      name = 'My dispatch rule',
      metadata = "{\"is_internal\": true}",
    )
  )

```

---

**Ruby**:

For an executable example, use the [Direct dispatch rule](#direct-dispatch-rule) example with the following options:

```ruby
resp = sip_service.create_sip_dispatch_rule(
  rule,
  name: name,
  metadata: "{\"is_internal\": true}",
)

```

---

**Go**:

For an executable example, replace `request` in the [Direct dispatch rule](#direct-dispatch-rule) example with the following options:

```go
  // Create a request
	request := &livekit.CreateSIPDispatchRuleRequest{
		DispatchRule: &livekit.SIPDispatchRuleInfo{
			Rule:            rule,
			Name:            "My dispatch rule",
			Metadata: "{\"is_internal\": true}",
		},
	}

```

---

**Kotlin**:

For an executable example, modify the parameters for `CreateSipDispatchRuleOptions` in the [Direct dispatch rule](#direct-dispatch-rule) example to include the `metadata` parameter:

```kotlin
val response = sipClient.createSipDispatchRule(
    rule = rule,
    options = CreateSipDispatchRuleOptions(
      name = "My dispatch rule",
      metadata = "{\"is_internal\": true}"
    )
).execute()

```

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select **Create new** → **Dispatch rule**.
4. Select the **JSON editor** tab.

> ℹ️ **Note**
> 
> The `metadata` parameter is only available in the **JSON editor** tab.
5. Copy and paste the following text into the editor:

```json
{
  "name": "My dispatch rule",
  "metadata": "{\"is_internal\": true}",
  "rule": {
    "dispatchRuleIndividual": {
      "roomPrefix": "call-"
    }
  }
}

```
6. Select **Create**.

## Update dispatch rule

Use the [`UpdateSIPDispatchRule`](https://docs.livekit.io/sip/api.md#updatesipdispatchrule) API to update specific fields of a dispatch rule or [replace](#replace-dispatch-rule) a dispatch rule with a new one.

### Update specific fields of a dispatch rule

The `UpdateSIPDispatchRuleFields` API allows you to update specific fields of a dispatch rule without affecting other fields.

**LiveKit CLI**:

Create a file named `dispatch-rule.json` with the following content:

```json
{
  "name": "My updated dispatch rule",
  "rule": {
    "dispatchRuleCallee": {
      "roomPrefix": "number-",
      "randomize": false,
      "pin": "1234"
    }
  }
}

```

Update the dispatch rule using `lk`. You can update the `trunks` parameter to a comma-separated string of trunks IDs if the rule matches specific trunks.

```shell
lk sip dispatch update --id <dispatch-rule-id> \
  --trunks "[]" \
  dispatch-rule.json

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

const updatedRuleFields = {
  name: 'My updated dispatch rule',
  trunkIds: ["<trunk-id1>", "<trunk-id2>"],
  hidePhoneNumber: true,
  metadata: "{\"is_internal\": false}",
}

const rule = await sipClient.updateSipDispatchRuleFields (
  ruleId,
  updatedRuleFields,
);

return rule;

```

---

**Python**:

```python
import asyncio

from livekit import api


async def main():
  """Use the update_sip_dispatch_rule_fields method to update specific fields of a dispatch rule."""

  rule_id = '<dispatch-rule-id>'

  livekit_api = api.LiveKitAPI()
  dispatchRule = None

  try:
    dispatchRule = await livekit_api.sip.update_sip_dispatch_rule_fields(
        rule_id=rule_id,
        metadata = "{\"is_internal\": false}",
        attributes={
          "<updated_key1>": "<updated_value1>",
          "<updated_key2>": "<updated_value2>",
        }
    )
    print(f"Successfully updated {dispatchRule}")

  except api.twirp_client.TwirpError as e:
    print(f"{e.code} error: {e.message}")

  await livekit_api.aclose()
  return dispatchRule

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

  "github.com/livekit/protocol/livekit"
  lksdk "github.com/livekit/server-sdk-go/v2"
)

func main() {

  rule_id := "<dispatch-rule-id>"

  // Update dispatch rule
  name2 := "My updated dispatch rule"
  request := &livekit.UpdateSIPDispatchRuleRequest{
    SipDispatchRuleId: rule_id,
    Action: &livekit.UpdateSIPDispatchRuleRequest_Update{
      Update: &livekit.SIPDispatchRuleUpdate{
        Name: &name2,
        TrunkIds: &livekit.ListUpdate{
          Set: []string{"<trunk-id1>", "<trunk-id2>"},
        },
      },
    },
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
    os.Getenv("LIVEKIT_API_KEY"),
    os.Getenv("LIVEKIT_API_SECRET"))

  updated, err := sipClient.UpdateSIPDispatchRule(context.Background(), request)

  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(updated)
  }
}

```

---

**Kotlin**:

The following updates the dispatch rule created in the [Direct dispatch rule](#direct-dispatch-rule) example. To update an individual dispatch rule, pass in a `SIPDispatchRuleIndividual` object instead of a `SIPDispatchRuleDirect` object.

```kotlin
import io.livekit.server.SipServiceClient
import io.livekit.server.SIPDispatchRuleDirect
import io.livekit.server.UpdateSipDispatchRuleOptions

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.updateSipDispatchRule(
    sipDispatchRuleId = <rule-id>,
    options = UpdateSipDispatchRuleOptions(
        name = "My updated dispatch rule",
        metadata = "{'key1': 'value1', 'key2': 'value2'}",
        rule = SipDispatchRuleDirect(
            roomName = "new-room"
        )
    )).execute()

if (response.isSuccessful) {
    val dispatchRule = response.body()
    println("Dispatch rule updated: ${dispatchRule}")
}

```

---

**LiveKit Cloud**:

Update and replace functions are the same in the LiveKit Cloud dashboard. For an example, see the [replace dispatch rule](#replace-dispatch-rule) section.

### Replace dispatch rule

The `UpdateSIPDispatchRule` API allows you to replace an existing dispatch rule with a new one using the same dispatch rule ID.

**LiveKit CLI**:

The instructions for replacing a dispatch rule are the same as for [updating a dispatch rule](#update-specific-fields-of-a-dispatch-rule).

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

  async function replaceDispatchRule(ruleId) {

    const updatedRuleOptions = {
      name: 'My replaced dispatch rule',
      trunkIds: ["<trunk-id1>", "<trunk-id2>"],
      hidePhoneNumber: false,
      metadata: "{\"is_internal\": true}",
      rule:  {
        rule: {case: "dispatchRuleIndividual", value: individualRuleType},
      }
    };


  const updatedRule = await sipClient.updateSipDispatchRule(
    ruleId,
    updatedRuleOptions,
  );

  return updatedRule;
}

await replaceDispatchRule('<dispatch-rule-id>');

```

---

**Python**:

```python
import asyncio

from livekit import api


async def main():
  """Use the update_sip_dispatch_rule function to replace a dispatch rule."""

  livekit_api = api.LiveKitAPI()

  # Dispatch rule ID of rule to replace.
  rule_id = '<dispatch-rule-id>'

  # Dispatch rule type.
  rule = api.SIPDispatchRule(
    dispatch_rule_direct = api.SIPDispatchRuleDirect(
      room_name = "caller-room",
      pin = '1212'
    )
  )

  ruleInfo = api.SIPDispatchRuleInfo(
    rule = rule,
    name = 'My replaced dispatch rule',
    trunk_ids = ["<trunk-id1>", "<trunk-id2>"],
    hide_phone_number = True,
    metadata = "{\"is_internal\": false}",
    attributes = {
      "<replaced_key_name1>": "<replaced_value1>",
      "<replaced_key_name2>": "<replaced_value2>",
    },
  )

  dispatchRule = None
  try:
    dispatchRule = await livekit_api.sip.update_sip_dispatch_rule(
      rule_id,
      ruleInfo
    )
    print(f"Successfully replaced {dispatchRule}")

  except api.twirp_client.TwirpError as e:
    print(f"{e.code} error: {e.message}")

  await livekit_api.aclose()
  return dispatchRule

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

  "github.com/livekit/protocol/livekit"
  lksdk "github.com/livekit/server-sdk-go/v2"
)

func main() {

  rule_id := "<dispatch-rule-id>"

  // Replace dispatch rule
  rule := &livekit.SIPDispatchRuleInfo{
    Name: "My replaced dispatch rule",
    TrunkIds: []string{"<trunk-id1>", "<trunk-id2>"},
    Rule: &livekit.SIPDispatchRule{
      Rule: &livekit.SIPDispatchRule_DispatchRuleDirect{
        DispatchRuleDirect: &livekit.SIPDispatchRuleDirect{
          RoomName: "my-room",
        },
      },
    },
  }

  request := &livekit.UpdateSIPDispatchRuleRequest{
    SipDispatchRuleId: rule_id,
    Action: &livekit.UpdateSIPDispatchRuleRequest_Replace{
      Replace: rule,
    },
  }

  sipClient := lksdk.NewSIPClient(os.Getenv("LIVEKIT_URL"),
                                  os.Getenv("LIVEKIT_API_KEY"),
                                  os.Getenv("LIVEKIT_API_SECRET"))

  updated, err := sipClient.UpdateSIPDispatchRule(context.Background(), request)

  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(updated)
  }
}

```

---

**Kotlin**:

Replacing a dispatch rule is not supported in Kotlin.

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Navigate to the **Dispatch rules** section and find the dispatch rule you want to update.
4. Select the more (**⋮**) menu → select **Edit**.
5. Select the **JSON editor** tab and copy and paste the following text into the editor:

```json
 {
   "name": "My replaced dispatch rule",
   "rule": {
     "dispatchRuleIndividual": {
       "roomPrefix": "caller-room"
     }
   },
   "trunkIds": ["<trunk-id1>", "<trunk-id2>"],
   "hidePhoneNumber": false,
   "metadata": "{\"is_internal\": true}",
   "attributes": {
     "<replaced_key_name1>": "<replaced_value1>",
     "<replaced_key_name2>": "<replaced_value2>",
   }
 }

```
6. Select **Update**.

## List dispatch rules

Use the [`ListSIPDispatchRule`](https://docs.livekit.io/sip/api.md#listsipdispatchrule) API to list all dispatch rules.

**LiveKit CLI**:

```bash
lk sip dispatch list

```

---

**Node.js**:

```typescript
import { SipClient } from 'livekit-server-sdk';

const sipClient = new SipClient(process.env.LIVEKIT_URL,
                                process.env.LIVEKIT_API_KEY,
                                process.env.LIVEKIT_API_SECRET);

const rules = await sipClient.listSipDispatchRule();

console.log(rules);

```

---

**Python**:

```python
import asyncio

from livekit import api

async def main():
  livekit_api = api.LiveKitAPI()

  rules = await livekit_api.sip.list_sip_dispatch_rule(
    api.ListSIPDispatchRuleRequest()
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

resp = sip_service.list_sip_dispatch_rule()

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
  dispatchRules, err := sipClient.ListSIPDispatchRule(
    context.Background(), &livekit.ListSIPDispatchRuleRequest{})

  if err != nil {
    fmt.Println(err)
  } else {
    fmt.Println(dispatchRules)
  }
}

```

---

**Kotlin**:

```kotlin
import livekit.LivekitSip
import io.livekit.server.SipServiceClient

val sipClient = SipServiceClient.createClient(
  host = System.getenv("LIVEKIT_URL").replaceFirst(Regex("^ws"), "http"),
  apiKey = System.getenv("LIVEKIT_API_KEY"),
  secret = System.getenv("LIVEKIT_API_SECRET")
)

val response = sipClient.listSipDispatchRule().execute()
if (response.isSuccessful) {
    val dispatchRules = response.body()
    println("Number of dispatch rules: ${dispatchRules?.size}")
}

```

---

**LiveKit Cloud**:

1. Sign in to the **LiveKit Cloud** [dashboard](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. The **Dispatch rules** section lists all dispatch rules.

---

This document was rendered at 2025-09-27T09:36:47.827Z.
For the latest version of this document, see [https://docs.livekit.io/sip/dispatch-rule.md](https://docs.livekit.io/sip/dispatch-rule.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).