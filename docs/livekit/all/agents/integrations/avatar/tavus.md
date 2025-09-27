LiveKit Docs › Integration guides › Virtual avatars › Tavus

---

# Tavus virtual avatar integration guide

> How to use the Tavus virtual avatar plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Tavus](https://tavus.io/) provides hyper-realistic interactive avatars for conversational video AI agents. You can use the open source Tavus integration for LiveKit Agents to add virtual avatars to your voice AI app.

- **[Tavus demo](https://www.youtube.com/watch?v=iuX5PDP73bQ)**: A video showcasing an educational AI agent that uses Tavus to create an interactive study partner.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[tavus]~=1.2"

```

### Authentication

The Tavus plugin requires a [Tavus API key](https://docs.tavus.io/sections/guides/api-key-guide).

Set `TAVUS_API_KEY` in your `.env` file.

### Replica and persona setup

The Tavus plugin requires a [Replica](https://docs.tavus.io/sections/replicas/overview) and a [Persona](https://docs.tavus.io/sections/conversational-video-interface/creating-a-persona) to start an avatar session.

You can use any replica with the Tavus plugin, but must setup a persona with the following settings for full compatibility with LiveKit Agents:

- Set the `pipeline_mode` to `echo`
- Define a `transport` layer under `layers`, setting the `transport_type` inside to `livekit`.

Here is a simple `curl` command to create a persona with the correct settings using the [Create Persona endpoint](https://docs.tavus.io/api-reference/personas/create-persona):

```bash
curl --request POST \
  --url https://tavusapi.com/v2/personas \
  -H "Content-Type: application/json" \
  -H "x-api-key: <api-key>" \
  -d '{
    "layers": {
        "transport": {
            "transport_type": "livekit"
        }
    },
    "persona_name": "My Persona",
    "pipeline_mode": "echo"
}'

```

Copy your replica ID and persona ID for the following steps.

### Usage

Use the plugin in an `AgentSession`. For example, you can use this avatar in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit import agents
from livekit.agents import AgentSession, RoomOutputOptions
from livekit.plugins import tavus

async def entrypoint(ctx: agents.JobContext):
   session = AgentSession(
      # ... stt, llm, tts, etc.
   )

   avatar = tavus.AvatarSession(
      replica_id="...",  # ID of the Tavus replica to use
      persona_id="...",  # ID of the Tavus persona to use (see preceding section for configuration details)
   )

   # Start the avatar and wait for it to join
   await avatar.start(session, room=ctx.room)

   # Start your agent session with the user
   await session.start(
      # ... room, agent, room_input_options, etc....
   )

```

Preview the avatar in the [Agents Playground](https://docs.livekit.io/agents/start/playground.md) or a frontend [starter app](https://docs.livekit.io/agents/start/frontend.md#starter-apps) that you build.

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/tavus/index.html.md#livekit.plugins.tavus.AvatarSession) for a complete list of all available parameters.

- **`replica_id`** _(string)_: ID of the Tavus replica to use. See [Replica and persona setup](#persona) for details.

- **`persona_id`** _(string)_: ID of the Tavus persona to use. See [Replica and persona setup](#persona) for details.

- **`avatar_participant_name`** _(string)_ (optional) - Default: `Tavus-avatar-agent`: The name of the participant to use for the avatar.

## Additional resources

The following resources provide more information about using Tavus with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-tavus/)**: The `livekit-plugins-tavus` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/tavus/index.html.md)**: Reference for the Tavus avatar plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-tavus)**: View the source or contribute to the LiveKit Tavus avatar plugin.

- **[Tavus docs](https://docs.tavus.io/)**: Tavus's full docs site.

- **[Agents Playground](https://docs.livekit.io/agents/start/playground.md)**: A virtual workbench to test your avatar agent.

- **[Frontend starter apps](https://docs.livekit.io/agents/start/frontend.md#starter-apps)**: Ready-to-use frontend apps with avatar support.

---

This document was rendered at 2025-09-27T09:35:57.558Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/avatar/tavus.md](https://docs.livekit.io/agents/integrations/avatar/tavus.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).