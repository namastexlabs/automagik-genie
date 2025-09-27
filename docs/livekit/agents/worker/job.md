LiveKit Docs › Worker lifecycle › Job lifecycle

---

# Job lifecycle

> Learn more about the entrypoint function and how to end and clean up LiveKit sessions.

## Lifecycle

When a [worker](https://docs.livekit.io/agents/worker.md) accepts a job request from LiveKit server, it starts a new process and runs your agent code inside. Each job runs in a separate process to isolate agents from each other. If a session instance crashes, it doesn't affect other agents running on the same worker. The job runs until all standard and SIP participants leave the room, or you explicitly shut it down.

## Entrypoint

The `entrypoint` is executed as the main function of the process for each new job run by the worker, effectively handing control over to your code. You should load any necessary app-specific data and then execute your agent's logic.

You can use the `entrypoint` function and Agents Framework without creating an `AgentSession`. This lets you take advantage of the framework’s job context and lifecycle to build a programmatic participant that's automatically dispatched to rooms. To learn more, see [Worker lifecycle](https://docs.livekit.io/agents/worker.md).

> ℹ️ **Note**
> 
> If you use `AgentSession`, it connects to LiveKit automatically when started. If you're not using `AgentSession`, or if you need to control the precise timing or method of connection, for instance to enable [end-to-end encryption](https://docs.livekit.io/home/client/tracks/encryption.md), use the `JobContext` [connect method](https://docs.livekit.io/reference/python/livekit/agents/index.html.md#livekit.agents.JobContext.connect).

This example shows a simple entrypoint that processes incoming audio tracks and publishes a text message to the room.

**Python**:

```python
async def do_something(track: rtc.RemoteAudioTrack):
    audio_stream = rtc.AudioStream(track)
    async for event in audio_stream:
        # Do something here to process event.frame
        pass
    await audio_stream.aclose()

async def entrypoint(ctx: JobContext):
    # an rtc.Room instance from the LiveKit Python SDK
    room = ctx.room

    # set up listeners on the room before connecting
    @room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, *_):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(do_something(track))

    # connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # when connected, room.local_participant represents the agent
    await room.local_participant.send_text('hello world', topic='hello-world')

    # iterate through currently connected remote participants
    for rp in room.remote_participants.values():
        print(rp.identity)

```

---

**Node.js**:

```typescript
async function doSomething(track: RemoteTrack) {
  for await (const frame of new AudioStream(track)) {
    // do something with the frame
  }
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // an rtc.Room instance from the LiveKit Node.js SDK
    const room = ctx.room;

    // set up listeners on the room before connecting
    room.on(RoomEvent.TrackSubscribed, async (track: RemoteTrack) => {
      if (track.kind === TrackKind.KIND_AUDIO) {
        doSomething(track);
      }
    });

    await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);

    // when connected, room.localParticipant represents the agent
    await room.localParticipant?.sendText('hello world', {
      topic: 'hello-world',
    });

    // iterate through currently connected remote participants
    for (const rp of ctx.room.remoteParticipants.values()) {
      console.log(rp.identity);
    }
  },
});

```

Working examples of LiveKit Agents for Node.js are available in the [repository](https://github.com/livekit/agents-js/tree/main/examples/src).

- **[Echo Agent](https://github.com/livekit/agents/blob/main/examples/primitives/echo-agent.py)**: This programmatic participant example demonstrates how to subscribe to audio tracks and play them back to the room.

For more LiveKit Agents examples, see the [GitHub repository](https://github.com/livekit/agents/tree/main/examples). To learn more about publishing and receiving tracks, see the following topics:

- **[Media tracks](https://docs.livekit.io/home/client/tracks.md)**: Use the microphone, speaker, cameras, and screen share with your agent.

- **[Realtime text and data](https://docs.livekit.io/home/client/data.md)**: Use text and data channels to communicate with your agent.

- **[Processing raw media tracks](https://docs.livekit.io/home/client/tracks/raw-tracks.md)**: Use server-side SDKs to read, process, and publish raw media tracks and files.

### Participant entrypoint function

You can also add a participant entrypoint function to the `JobContext` using the `add_participant_entrypoint` method. This function is called for every participant that joins the room, and every participant already in the room when your agent joins. For an example, see the following:

- **[Participant entrypoint function](https://github.com/livekit/agents/blob/main/examples/primitives/participant_entrypoint.py)**: This example shows how to add a participant entrypoint function to the `JobContext` to log the participant's identity when they join the room.

## Adding custom fields to agent logs

Available in:
- [ ] Node.js
- [x] Python

Each job outputs JSON-formatted logs that include the user transcript, turn detection data, job ID, process ID, and more. You can include custom fields in the logs using `ctx.log_fields_context` for additional diagnostic context.

The following example adds worker ID and room name to the logs:

```python
async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {
      "worker_id": ctx.worker_id,
      "room_name": ctx.room.name,
    }

```

To learn more, see the reference documentation for [JobContext.log_context_fields](https://docs.livekit.io/reference/python/v1/livekit/agents/index.html.md#livekit.agents.JobContext.log_context_fields).

## Passing data to a job

You can customize a job with user or job-specific data using either job metadata, room metadata, or participant attributes.

### Job metadata

Job metadata is a freeform string field defined in the [dispatch request](https://docs.livekit.io/agents/worker/agent-dispatch.md#via-api) and consumed in the `entrypoint` function. Use JSON or similar structured data to pass complex information.

The following example assumes your agent dispatch request includes the `user_id`, `user_name`, and `user_phone` fields in the metadata. You can access this data in the `entrypoint` function:

**Python**:

```python
import json

async def entrypoint(ctx: JobContext):
    metadata = json.loads(ctx.job.metadata)
    user_id = metadata["user_id"]
    user_name = metadata["user_name"]
    user_phone = metadata["user_phone"]
    # ...

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    const metadata = JSON.parse(ctx.job.metadata);
    const userId = metadata.user_id;
    const userName = metadata.user_name;
    const userPhone = metadata.user_phone;
    // ...
  },
});

```

For more information on dispatch, see the following article:

- **[Agent dispatch](https://docs.livekit.io/agents/worker/agent-dispatch.md#via-api)**: Learn how to dispatch an agent with custom metadata.

### Room metadata and participant attributes

You can also use properties such as the room's name, metadata, and participant attributes to customize agent behavior.

Here's an example showing how to access various properties:

**Python**:

```python
async def entrypoint(ctx: JobContext):
  # connect to the room
  await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

  # wait for the first participant to arrive
  participant = await ctx.wait_for_participant()

  # customize behavior based on the participant
  print(f"connected to room {ctx.room.name} with participant {participant.identity}")

  # inspect the current value of the attribute
  language = participant.attributes.get("user.language")

  # listen to when the attribute is changed
  @ctx.room.on("participant_attributes_changed")
  def on_participant_attributes_changed(changed_attrs: dict[str, str], p: rtc.Participant):
      if p == participant:
        language = p.attributes.get("user.language")
        print(f"participant {p.identity} changed language to {language}")

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // connect to the room
    await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);

    // wait for the first participant to arrive
    const participant = await ctx.waitForParticipant();

    // customize behavior based on the participant
    console.log(`connected to room ${ctx.room.name} with participant ${participant.identity}`);

    // inspect the current value of the attribute
    let language = participant.attributes['user.language'];

    // listen to when the attribute is changed
    ctx.room.on(
      'participantAttributesChanged',
      (changedAttrs: Record<string, string>, p: Participant) => {
        if (p === participant) {
          language = p.attributes['user.language'];
          console.log(`participant ${p.identity} changed language to ${language}`);
        }
      },
    );
  },
});

```

For more information, see the following topics:

- **[Room metadata](https://docs.livekit.io/home/client/state/room-metadata.md)**: Learn how to set and use room metadata.

- **[Participant attributes & metadata](https://docs.livekit.io/home/client/state/participant-attributes.md)**: Learn how to set and use participant attributes and metadata.

## Ending the session

### Disconnecting the agent

You can disconnect an agent after it completes its task and is no longer needed in the room. This allows the other participants in the LiveKit session to continue. Your [shutdown hooks](#post-processing-and-cleanup) run after the `shutdown` function.

**Python**:

```python
async def entrypoint(ctx: JobContext):
    # do some work
    ...

    # disconnect from the room
    ctx.shutdown(reason="Session ended")

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // do some work...

    // disconnect from the room
    ctx.shutdown('Session ended');
  },
});

```

### Disconnecting everyone

If the session should end for everyone, use the server API [deleteRoom](https://docs.livekit.io/home/server/managing-rooms.md#delete-a-room) to end the session.

When the `Disconnected` [room event](https://docs.livekit.io/home/client/events.md) is sent, the room is removed from the server.

**Python**:

```python
from livekit import api

async def entrypoint(ctx: JobContext):
    # do some work
    ...

    api_client = api.LiveKitAPI(
        os.getenv("LIVEKIT_URL"),
        os.getenv("LIVEKIT_API_KEY"),
        os.getenv("LIVEKIT_API_SECRET"),
    )
    await api_client.room.delete_room(api.DeleteRoomRequest(
        room=ctx.job.room.name,
    ))

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // do some work...

    const roomServiceClient = new RoomServiceClient(
      process.env.LIVEKIT_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
    );
    await roomServiceClient.deleteRoom(ctx.job.room.name);
  },
});

```

## Post-processing and cleanup

After a session ends, you can perform post-processing or cleanup tasks using shutdown hooks. For example, you might want to save user state in a database.

**Python**:

```python
async def entrypoint(ctx: JobContext):
    async def my_shutdown_hook():
        # save user state
        ...
    ctx.add_shutdown_callback(my_shutdown_hook)

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    ctx.addShutdownCallback(() => {
      // save user state...
    });
  },
});

```

> ℹ️ **Note**
> 
> Shutdown hooks should complete within a short amount of time. By default, the framework waits 60 seconds before forcefully terminating the process. You can adjust this timeout using the `shutdown_process_timeout` parameter in [WorkerOptions](https://docs.livekit.io/agents/worker/options.md).

---

This document was rendered at 2025-09-27T09:36:24.008Z.
For the latest version of this document, see [https://docs.livekit.io/agents/worker/job.md](https://docs.livekit.io/agents/worker/job.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).