LiveKit Docs › Integration guides › Speech-to-text (STT) › Spitch

---

# Spitch STT integration guide

> How to use the Spitch STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Spitch](https://spitch.app/) provides AI-powered speech and language solutions optimized for African languages. With LiveKit's Spitch STT integration and the Agents framework, you can build voice AI agents that understand speech in a variety of African languages.

## Quick reference

This section provides a quick reference for the Spitch STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[spitch]~=1.2"

```

### Authentication

The Spitch plugin requires a [Spitch API key](https://studio.spitch.app/api/keys).

Set `SPITCH_API_KEY` in your `.env` file.

### Usage

Use Spitch STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import spitch

session = AgentSession(
   stt=spitch.STT(
      language="en",
   ),
   # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/spitch/index.html.md#livekit.plugins.spitch.STT) for a complete list of all available parameters.

- **`language`** _(string)_ (optional) - Default: `en`: Language short code of the input speech. For supported values, see [Spitch languages](https://docs.spitch.app/concepts/languages).

## Additional resources

The following resources provide more information about using Spitch with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-spitch/)**: The `livekit-plugins-spitch` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/spitch/index.html.md#livekit.plugins.spitch.STT)**: Reference for the Spitch STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-spitch)**: View the source or contribute to the LiveKit Spitch STT plugin.

- **[Spitch docs](https://docs.spitch.app/)**: Spitch's official documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Spitch.

- **[Spitch TTS](https://docs.livekit.io/agents/integrations/tts/spitch.md)**: Guide to the Spitch TTS integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:11.894Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/spitch.md](https://docs.livekit.io/agents/integrations/stt/spitch.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).