LiveKit Docs › Integration guides › Virtual avatars › Anam

---

# Anam virtual avatar integration guide

> How to use the Anam virtual avatar plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Anam](https://anam.ai/) provides lifelike avatars for realtime conversational AI. You can use the open source Anam integration for LiveKit Agents to enable seamless integration of Anam avatars into your voice AI app.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[anam]~=1.2"

```

### Authentication

The Anam plugin requires an [Anam API key](https://lab.anam.ai/api-keys).

Set `ANAM_API_KEY` in your `.env` file.

### Usage

Use the plugin in an `AgentSession`. For example, you can use this avatar in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit import agents
from livekit.agents import AgentSession, RoomOutputOptions
from livekit.plugins import anam

async def entrypoint(ctx: agents.JobContext):
   session = AgentSession(
      # ... stt, llm, tts, etc.
   )

   avatar = anam.AvatarSession(
      persona_config=anam.PersonaConfig(
         name="...",  # Name of the avatar to use.
         avatarId="...",  # ID of the avatar to use. See "Avatar setup" for details.
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

### Avatar setup

You can use stock avatars provided by Anam or create your own custom avatars using Anam Lab.

- **Stock Avatars**: Browse a collection of ready-to-use avatars in the [Avatar Gallery](https://docs.anam.ai/resources/avatar-gallery).
- **Custom Avatars**: Create your own personalized avatar using [Anam Lab](https://lab.anam.ai/avatars).

To use a stock avatar, copy the avatar ID from the gallery and use it in your `PersonaConfig`. For custom avatars, create them in the lab and use the generated avatar ID.

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/anam/index.html.md#livekit.plugins.anam.AvatarSession) for a complete list of all available parameters.

- **`persona_config`** _(anam.PersonaConfig)_ (optional): Configuration for the avatar to use.

- - **`name`** _(string)_: Name of the avatar to use. See [Avatar setup](#avatar-setup) for details.
- - **`avatarId`** _(string)_: ID of the avatar to use. See [Avatar setup](#avatar-setup) for details.

- **`avatar_participant_name`** _(string)_ (optional) - Default: `anam-avatar-agent`: The participant name to use for the avatar.

## Additional resources

The following resources provide more information about using Anam with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-anam/)**: The `livekit-plugins-anam` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/anam/index.html.md)**: Reference for the Anam avatar plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-anam)**: View the source or contribute to the LiveKit Anam avatar plugin.

- **[Anam API docs](https://docs.anam.ai/third-party-integrations/livekit)**: Anam's LiveKit integration docs.

- **[Agents Playground](https://docs.livekit.io/agents/start/playground.md)**: A virtual workbench to test your avatar agent.

- **[Frontend starter apps](https://docs.livekit.io/agents/start/frontend.md#starter-apps)**: Ready-to-use frontend apps with avatar support.

---

This document was rendered at 2025-09-27T09:35:56.110Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/avatar/anam.md](https://docs.livekit.io/agents/integrations/avatar/anam.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).