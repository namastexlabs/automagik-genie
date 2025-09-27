LiveKit Docs › Integration guides › Virtual avatars › Overview

---

# Virtual avatar integrations

> Guides for adding virtual avatars to your agents.

## Overview

Virtual avatars add lifelike video output for your voice AI agents. You can integrate a variety of providers to LiveKit Agents with just a few lines of code.

## Available providers

The following providers are available. Choose a provider from this list for a step-by-step guide:

| Provider | Plugin | Notes | Available in |
| -------- | ------ | ----- | ------------ |
| [Anam](https://docs.livekit.io/agents/integrations/avatar/anam.md) | `anam` |  | Python |
| [Beyond Presence](https://docs.livekit.io/agents/integrations/avatar/bey.md) | `bey` |  | Python |
| [bitHuman](https://docs.livekit.io/agents/integrations/avatar/bithuman.md) | `bithuman` |  | Python |
| [Hedra](https://docs.livekit.io/agents/integrations/avatar/hedra.md) | `hedra` |  | Python |
| [Simli](https://docs.livekit.io/agents/integrations/avatar/simli.md) | `simli` |  | Python |
| [Tavus](https://docs.livekit.io/agents/integrations/avatar/tavus.md) | `tavus` |  | Python |

Have another provider in mind? LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/integrations.md#contribute).

## How it works

The virtual avatar integrations works with the `AgentSession` class automatically. The plugin adds a separate participant, the avatar worker, to the room. The agent session sends its audio output to the avatar worker instead of to the room, which the avatar worker uses to publish synchronized audio + video tracks to the room and the end user.

To add a virtual avatar:

1. [Install](https://docs.livekit.io/agents/integrations.md#install) the selected plugin and API keys
2. Create an `AgentSession`, as in the [voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)
3. Create an `AvatarSession` and configure it as necessary
4. Start the avatar session, passing in the `AgentSession` instance
5. Start the `AgentSession` with audio output disabled (the audio is sent to the avatar session instead)

## Sample code

Here is an example using [Hedra Realtime Avatars](https://docs.livekit.io/agents/integrations/avatar/hedra.md):

```python
from livekit import agents
from livekit.agents import AgentSession, RoomOutputOptions
from livekit.plugins import hedra

async def entrypoint(ctx: agents.JobContext):
   session = AgentSession(
      # ... stt, llm, tts, etc.
   )

   avatar = hedra.AvatarSession(
      avatar_id="...",  # ID of the Hedra avatar to use
   )

   # Start the avatar and wait for it to join
   await avatar.start(session, room=ctx.room)

   # Start your agent session with the user
   await session.start(
      # ... room, agent, room_input_options, etc....
   )

```

## Avatar workers

To minimize latency, the avatar provider joins the LiveKit room directly as a secondary participant to publish synchronized audio and video to the room. In your frontend app, you must distinguish between the agent — your Python program running the `AgentSession` — and the avatar worker.

```mermaid
graph LR
User[User] --"User Audio"--> Agent[Agent]
Agent -."Audio Data".-> Avatar[Avatar Worker]
Avatar --"Agent Video"--> User
Avatar --"Agent Audio"--> User
```

You can identify an avatar worker as a participant of kind `agent` with the attribute `lk.publish_on_behalf`. Check for these values in your frontend code to associate the worker's audio and video tracks with the agent.

```typescript
const agent = room.remoteParticipants.find(
  p => p.kind === Kind.Agent && p.attributes['lk.publish_on_behalf'] === null
);
const avatarWorker = room.remoteParticipants.find(
  p => p.kind === Kind.Agent && p.attributes['lk.publish_on_behalf'] === agent.identity
);

```

In React apps, use the [useVoiceAssistant hook](https://docs.livekit.io/reference/components/react/hook/usevoiceassistant.md) to get the correct audio and video tracks automatically:

```typescript
const { 
  agent, // The agent participant
  audioTrack, // the worker's audio track
  videoTrack, // the worker's video track
} = useVoiceAssistant();

```

## Frontend starter apps

The following [frontend starter apps](https://docs.livekit.io/agents/start/frontend.md#starter-apps) include out-of-the-box support for virtual avatars.

- **[SwiftUI Voice Agent](https://github.com/livekit-examples/agent-starter-swift)**: A native iOS, macOS, and visionOS voice AI assistant built in SwiftUI.

- **[Next.js Voice Agent](https://github.com/livekit-examples/agent-starter-react)**: A web voice AI assistant built with React and Next.js.

- **[Flutter Voice Agent](https://github.com/livekit-examples/agent-starter-flutter)**: A cross-platform voice AI assistant app built with Flutter.

- **[React Native Voice Agent](https://github.com/livekit-examples/agent-starter-react-native)**: A native voice AI assistant app built with React Native and Expo.

- **[Android Voice Agent](https://github.com/livekit-examples/agent-starter-android)**: A native Android voice AI assistant app built with Kotlin and Jetpack Compose.

- **[Agents Playground](https://docs.livekit.io/agents/start/playground.md)**: A virtual workbench to test your multimodal AI agent.

## Further reading

- **[Web and mobile frontends](https://docs.livekit.io/agents/start/frontend.md)**: Guide to adding web or mobile frontends to your agent.

- **[Vision](https://docs.livekit.io/agents/build/vision.md)**: Give your agent the ability to see you, too.

---

This document was rendered at 2025-09-27T09:35:55.826Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/avatar.md](https://docs.livekit.io/agents/integrations/avatar.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).