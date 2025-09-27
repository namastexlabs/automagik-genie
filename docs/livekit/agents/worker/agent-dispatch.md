LiveKit Docs › Worker lifecycle › Agent dispatch

---

# Agent dispatch

> Specifying how and when your agents are assigned to rooms.

## Dispatching agents

Dispatch is the process of assigning an agent to a room. LiveKit server manages this process as part of the [worker lifecycle](https://docs.livekit.io/agents/worker.md). LiveKit optimizes dispatch for high concurrency and low latency, typically supporting hundred of thousands of new connections per second with a max dispatch time under 150 ms.

## Automatic agent dispatch

By default, an agent is automatically dispatched to each new room. Automatic dispatch is the best option if you want to assign the same agent to all new participants.

## Explicit agent dispatch

Explicit dispatch is available for greater control over when and how agents join rooms. This approach leverages the same worker systems, allowing you to run agent workers in the same way.

To use explicit dispatch, set the `agent_name` field in the `WorkerOptions`:

**Python**:

```python
opts = WorkerOptions(
    ...
    agent_name="test-agent",
)

```

---

**Node.js**:

```ts
const opts = new WorkerOptions({
  ...
  agentName: "test-agent",
});

```

> ❗ **Important**
> 
> Automatic dispatch is disabled if the `agent_name` property is set.

### Dispatch via API

Agent workers with the `agent_name` set can be explicitly dispatched to a room via `AgentDispatchService`.

**Python**:

```python
import asyncio
from livekit import api

room_name = "my-room"
agent_name = "test-agent"

async def create_explicit_dispatch():
    lkapi = api.LiveKitAPI()
    dispatch = await lkapi.agent_dispatch.create_dispatch(
        api.CreateAgentDispatchRequest(
            agent_name=agent_name, room=room_name, metadata='{"user_id": "12345"}'
        )
    )
    print("created dispatch", dispatch)

    dispatches = await lkapi.agent_dispatch.list_dispatch(room_name=room_name)
    print(f"there are {len(dispatches)} dispatches in {room_name}")
    await lkapi.aclose()

asyncio.run(create_explicit_dispatch())

```

---

**Node.js**:

```ts
import { AgentDispatchClient } from 'livekit-server-sdk';

const roomName = 'my-room';
const agentName = 'test-agent';

async function createExplicitDispatch() {
  const agentDispatchClient = new AgentDispatchClient(process.env.LIVEKIT_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

  // create a dispatch request for an agent named "test-agent" to join "my-room"
  const dispatch = await agentDispatchClient.createDispatch(roomName, agentName, {
    metadata: '{"user_id": "12345"}',
  });
  console.log('created dispatch', dispatch);

  const dispatches = await agentDispatchClient.listDispatch(roomName);
  console.log(`there are ${dispatches.length} dispatches in ${roomName}`);
}

```

---

**LiveKit CLI**:

```shell
lk dispatch create \
  --agent-name test-agent \
  --room my-room \
  --metadata '{"user_id": "12345"}'

```

---

**Go**:

```go
func createAgentDispatch() {
	req := &livekit.CreateAgentDispatchRequest{
		Room:      "my-room",
		AgentName: "test-agent",
		Metadata:  "{\"user_id\": \"12345\"}",
	}
	dispatch, err := dispatchClient.CreateDispatch(context.Background(), req)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Dispatch created: %v\n", dispatch)
}

```

The room, `my-room`, is automatically created during dispatch if it doesn't already exist, and the worker assigns `test-agent` to it.

#### Job metadata

Explicit dispatch allows you to pass metadata to the agent, available in the `JobContext`. This is useful for including details such as the user's ID, name, or phone number.

The metadata field is a string. LiveKit recommends using JSON to pass structured data.

The [examples](#via-api) in the previous section demonstrate how to pass job metadata during dispatch.

For information on consuming job metadata in an agent, see the following guide:

- **[Job metadata](https://docs.livekit.io/agents/worker/job.md#metadata)**: Learn how to consume job metadata in an agent.

### Dispatch from inbound SIP calls

Agents can be explicitly dispatched for inbound SIP calls. [SIP dispatch rules](https://docs.livekit.io/sip/dispatch-rule.md) can define one or more agents using the `room_config.agents` field.

LiveKit recommends explicit agent dispatch for SIP inbound calls rather than automatic agent dispatch as it allows multiple agents within a single project.

### Dispatch on participant connection

You can configure a participant's token to dispatch one or more agents immediately upon connection.

To dispatch multiple agents, include multiple `RoomAgentDispatch` entries in `RoomConfiguration`.

The following example creates a token that dispatches the `test-agent` agent to the `my-room` room when the participant connects:

**Python**:

```python
from livekit.api import (
  AccessToken,
  RoomAgentDispatch,
  RoomConfiguration,
  VideoGrants,
)

room_name = "my-room"
agent_name = "test-agent"

def create_token_with_agent_dispatch() -> str:
    token = (
        AccessToken()
        .with_identity("my_participant")
        .with_grants(VideoGrants(room_join=True, room=room_name))
        .with_room_config(
            RoomConfiguration(
                agents=[
                    RoomAgentDispatch(agent_name="test-agent", metadata='{"user_id": "12345"}')
                ],
            ),
        )
        .to_jwt()
    )
    return token

```

---

**Node.js**:

```ts
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { AccessToken } from 'livekit-server-sdk';

const roomName = 'my-room';
const agentName = 'test-agent';

async function createTokenWithAgentDispatch(): Promise<string> {
  const at = new AccessToken();
  at.identity = 'my-participant';
  at.addGrant({ roomJoin: true, room: roomName });
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: agentName,
        metadata: '{"user_id": "12345"}',
      }),
    ],
  });
  return await at.toJwt();
}

```

---

**Go**:

```go
func createTokenWithAgentDispatch() (string, error) {
	at := auth.NewAccessToken(
		os.Getenv("LIVEKIT_API_KEY"),
		os.Getenv("LIVEKIT_API_SECRET"),
	).
		SetIdentity("my-participant").
		SetName("Participant Name").
		SetVideoGrant(&auth.VideoGrant{
			Room:     "my-room",
			RoomJoin: true,
		}).
		SetRoomConfig(&livekit.RoomConfiguration{
			Agents: []*livekit.RoomAgentDispatch{
				{
					AgentName: "test-agent",
					Metadata:  "{\"user_id\": \"12345\"}",
				},
			},
		})

	return at.ToJWT()
}

```

---

This document was rendered at 2025-09-27T09:36:23.717Z.
For the latest version of this document, see [https://docs.livekit.io/agents/worker/agent-dispatch.md](https://docs.livekit.io/agents/worker/agent-dispatch.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).