LiveKit Docs › Integration guides › Speech-to-text (STT) › Cartesia

---

# Cartesia STT integration guide

> How to use the Cartesia STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Cartesia](https://www.cartesia.ai/) provides advanced speech recognition technology with their Ink-Whisper model, optimized for real-time transcription in conversational settings. With LiveKit's Cartesia integration and the Agents framework, you can build AI agents that provide high-accuracy transcriptions with ultra-low latency.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[cartesia]~=1.2"

```

### Authentication

The Cartesia plugin requires a [Cartesia API key](https://play.cartesia.ai/keys).

Set `CARTESIA_API_KEY` in your `.env` file.

### Usage

Use Cartesia STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import cartesia

session = AgentSession(
   stt = cartesia.STT(
      model="ink-whisper"
   ),
   # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/cartesia/index.html.md#livekit.plugins.cartesia.STT) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `ink-whisper`: Selected model to use for STT. See [Cartesia STT models](https://docs.cartesia.ai/build-with-cartesia/models/stt) for supported values.

- **`language`** _(string)_ (optional) - Default: `en`: Language of input audio in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format. See [Cartesia STT models](https://docs.cartesia.ai/build-with-cartesia/models/stt) for supported values.

## Additional resources

The following resources provide more information about using Cartesia with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-cartesia/)**: The `livekit-plugins-cartesia` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/cartesia/index.html.md#livekit.plugins.cartesia.STT)**: Reference for the Cartesia STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-cartesia)**: View the source or contribute to the LiveKit Cartesia STT plugin.

- **[Cartesia docs](https://docs.cartesia.ai/build-with-cartesia/models/stt)**: Cartesia STT docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Cartesia STT.

- **[Cartesia TTS](https://docs.livekit.io/agents/integrations/tts/cartesia.md)**: Guide to the Cartesia TTS integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:08.305Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/cartesia.md](https://docs.livekit.io/agents/integrations/stt/cartesia.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).