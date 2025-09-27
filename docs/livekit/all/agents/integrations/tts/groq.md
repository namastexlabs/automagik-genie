LiveKit Docs › Integration guides › Text-to-speech (TTS) › Groq

---

# Groq TTS integration guide

> How to use the Groq TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Groq](https://groq.com/) provides fast TTS using models from PlayAI. With LiveKit's Groq integration and the Agents framework, you can build voice AI applications with fluent and conversational voices. Groq TTS supports English and Arabic speech.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[groq]~=1.2"

```

### Authentication

The Groq plugin requires a [Groq API key](https://console.groq.com/keys).

Set `GROQ_API_KEY` in your `.env` file.

### Usage

Use Groq TTS in your `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import groq
   
session = AgentSession(
   tts=groq.TTS(
      model="playai-tts",
      voice="Arista-PlayAI",
   ),
   # ... stt, llm, vad, turn_detection, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/groq/index.html.md#livekit.plugins.groq.TTS) for a complete list of all available parameters.

- **`model`** _(TTSModel | string)_ (optional) - Default: `playai-tts`: Name of the TTS model. For a full list, see [Models](https://console.groq.com/docs/models).

- **`voice`** _(string)_ (optional) - Default: `Arista-PlayAI`: Name of the voice. For a full list, see [English](https://console.groq.com/docs/text-to-speech#available-english-voices) and [Arabic](https://console.groq.com/docs/text-to-speech#available-arabic-voices) voices.

## Additional resources

The following resources provide more information about using Groq with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-groq/)**: The `livekit-plugins-groq` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/groq/index.html.md#livekit.plugins.groq.TTS)**: Reference for the Groq TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-groq)**: View the source or contribute to the LiveKit Groq TTS plugin.

- **[Groq docs](https://console.groq.com/docs/text-to-speech)**: Groq TTS docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Groq TTS.

- **[Groq ecosystem guide](https://docs.livekit.io/agents/integrations/groq.md)**: Overview of the entire Groq and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:14.949Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/groq.md](https://docs.livekit.io/agents/integrations/tts/groq.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).