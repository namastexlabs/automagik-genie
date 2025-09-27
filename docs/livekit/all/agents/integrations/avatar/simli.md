LiveKit Docs › Integration guides › Virtual avatars › Simli

---

# Simli virtual avatar integration guide

> How to use the Simli virtual avatar plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Simli](https://simli.com/) provides realtime low-latency video avatars. You can use the open source Simli integration for LiveKit Agents to add virtual avatars to your voice AI app.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[simli]~=1.2"

```

### Authentication

The Simli plugin requires a [Simli API key](https://app.simli.com/apikey).

Set `SIMLI_API_KEY` in your `.env` file.

### Usage

Use the plugin in an `AgentSession`. For example, you can use this avatar in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit import agents
from livekit.agents import AgentSession, RoomOutputOptions
from livekit.plugins import simli

async def entrypoint(ctx: agents.JobContext):
   session = AgentSession(
      # ... stt, llm, tts, etc.
   )

   avatar = simli.AvatarSession(
      simli_config=simli.SimliConfig(
         api_key=os.getenv("SIMLI_API_KEY"),
         face_id="...",  # ID of the Simli face to use for your avatar. See "Face setup" for details.
      ),
   )

   # Start the avatar and wait for it to join
   await avatar.start(session, room=ctx.room)

   # Start your agent session with the user
   await session.start(
      # ... room, agent, room_input_options, etc....
   )

```

Preview the avatar in the [Agents Playground](https://docs.livekit.io/agents/start/playground.md) or a frontend [starter app](https://docs.livekit.io/agents/start/frontend.md#starter-apps) that you build.

### Face setup

The Simli plugin requires a face from which to generate the avatar. You can choose a face from the [default library](https://app.simli.com/create/from-existing) or [upload your own](https://app.simli.com/faces).

Include the face ID in the `SimliConfig` when you create the `AvatarSession`.

### Emotions

Simli supports [configurable emotions](https://docs.simli.com/emotions). Pass an `emotion_id`  to the `SimliConfig` when you create the `AvatarSession`.

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/simli/index.html.md#livekit.plugins.simli.AvatarSession) for a complete list of all available parameters.

- **`simli_config`** _(simli.SimliConfig)_ (optional): Configuration for the Simli face to use.

- - **`face_id`** _(string)_: ID of the Simli face to use. See [Face setup](#face-setup) for details.
- - **`emotion_id`** _(string)_: ID of the Simli emotion to use. See [Emotions](#emotions) for details.

- **`avatar_participant_name`** _(string)_ (optional) - Default: `simli-avatar-agent`: The name of the participant to use for the avatar.

## Additional resources

The following resources provide more information about using Simli with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-simli/)**: The `livekit-plugins-simli` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/simli/index.html.md)**: Reference for the Simli avatar plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-simli)**: View the source or contribute to the LiveKit Simli avatar plugin.

- **[Simli API docs](https://docs.simli.com/)**: Simli's API docs.

- **[Agents Playground](https://docs.livekit.io/agents/start/playground.md)**: A virtual workbench to test your avatar agent.

- **[Frontend starter apps](https://docs.livekit.io/agents/start/frontend.md#starter-apps)**: Ready-to-use frontend apps with avatar support.

---

This document was rendered at 2025-09-27T09:35:57.285Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/avatar/simli.md](https://docs.livekit.io/agents/integrations/avatar/simli.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).