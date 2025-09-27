LiveKit Docs › Integration guides › Text-to-speech (TTS) › Deepgram

---

# Deepgram TTS integration guide

> How to use the Deepgram TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Deepgram](https://deepgram.com/) provides responsive, human-like text-to-speech technology for voice AI. With LiveKit's Deepgram integration and the Agents framework, you can build voice AI agents that sound realistic.

## Quick reference

This section provides a quick reference for the Deepgram TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[deepgram]~=1.2"

```

### Authentication

The Deepgram plugin requires a [Deepgram API key](https://console.deepgram.com/).

Set `DEEPGRAM_API_KEY` in your `.env` file.

### Usage

Use Deepgram TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import deepgram

session = AgentSession(
   tts=deepgram.TTS(
      model="aura-asteria-en",
   )
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/deepgram/index.html.md#livekit.plugins.deepgram.TTS) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `aura-asteria-en`: ID of the model to use for generation. To learn more, see [supported models](https://developers.deepgram.com/docs/tts-models).

## Prompting

Deepgram supports filler words and natural pauses through prompting. To learn more, see [Text to Speech Prompting](https://developers.deepgram.com/docs/text-to-speech-prompting).

## Additional resources

The following resources provide more information about using Deepgram with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-deepgram/)**: The `livekit-plugins-deepgram` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/deepgram/index.html.md#livekit.plugins.deepgram.TTS)**: Reference for the Deepgram TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-deepgram)**: View the source or contribute to the LiveKit Deepgram TTS plugin.

- **[Deepgram docs](https://developers.deepgram.com/docs)**: Deepgram's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Deepgram.

- **[Deepgram STT](https://docs.livekit.io/agents/integrations/stt/deepgram.md)**: Guide to the Deepgram STT integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:13.826Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/deepgram.md](https://docs.livekit.io/agents/integrations/tts/deepgram.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).