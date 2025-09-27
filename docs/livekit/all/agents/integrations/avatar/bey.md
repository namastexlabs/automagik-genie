LiveKit Docs › Integration guides › Virtual avatars › Beyond Presence

---

# Beyond Presence virtual avatar integration guide

> How to use the Beyond Presence virtual avatar plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Beyond Presence](https://www.beyondpresence.ai/) provides hyper-realistic interactive avatars for conversational video AI agents. You can use the open source Beyond Presence integration for LiveKit Agents to add virtual avatars to your voice AI app.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[bey]~=1.2"

```

### Authentication

The Beyond Presence plugin requires a [Beyond Presence API key](https://docs.bey.dev/api-key).

Set `BEY_API_KEY` in your `.env` file.

### Usage

Use the plugin in an `AgentSession`. For example, you can use this avatar in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import bey

session = AgentSession(
   # ... stt, llm, tts, etc.
)

avatar = bey.AvatarSession(
    avatar_id="...",  # ID of the Beyond Presence avatar to use
)

# Start the avatar and wait for it to join
await avatar.start(session, room=ctx.room)

# Start your agent session with the user
await session.start(
    room=ctx.room,
)

```

Preview the avatar in the [Agents Playground](https://docs.livekit.io/agents/start/playground.md) or a frontend [starter app](https://docs.livekit.io/agents/start/frontend.md#starter-apps) that you build.

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/bey/index.html.md#livekit.plugins.bey.AvatarSession) for a complete list of all available parameters.

- **`avatar_id`** _(string)_ (optional) - Default: `b9be11b8-89fb-4227-8f86-4a881393cbdb`: ID of the Beyond Presence avatar to use.

- **`avatar_participant_identity`** _(string)_ (optional) - Default: `bey-avatar-agent`: The identity of the participant to use for the avatar.

- **`avatar_participant_name`** _(string)_ (optional) - Default: `bey-avatar-agent`: The name of the participant to use for the avatar.

## Additional resources

The following resources provide more information about using Beyond Presence with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-bey/)**: The `livekit-plugins-bey` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/bey/index.html.md#livekit.plugins.bey.AvatarSession)**: Reference for the Beyond Presence avatar plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-bey)**: View the source or contribute to the LiveKit Beyond Presence avatar plugin.

- **[Beyond Presence docs](https://docs.bey.dev/docs)**: Beyond Presence's full docs site.

- **[Agents Playground](https://docs.livekit.io/agents/start/playground.md)**: A virtual workbench to test your avatar agent.

- **[Frontend starter apps](https://docs.livekit.io/agents/start/frontend.md#starter-apps)**: Ready-to-use frontend apps with avatar support.

---

This document was rendered at 2025-09-27T09:35:56.455Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/avatar/bey.md](https://docs.livekit.io/agents/integrations/avatar/bey.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).