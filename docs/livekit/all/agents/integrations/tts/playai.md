LiveKit Docs › Integration guides › Text-to-speech (TTS) › PlayHT

---

# PlayHT integration guide

> How to use the PlayHT TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[PlayHT](https://www.play.ht/) provides realistic TTS voice generation. With LiveKit's PlayHT integration and the Agents framework, you can build voice AI applications with fluent and conversational voices.

To learn more about TTS and generating agent speech, see [Agent speech](https://docs.livekit.io/agents/build/audio.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[playai]~=1.2"

```

### Authentication

The PlayHT plugin requires a [PlayHT API key](https://play.ht/studio/api-access).

Set the following environment variables in your `.env` file:

```shell
PLAYHT_API_KEY=<playht-api-key>
PLAYHT_USER_ID=<playht-user-id>

```

### Usage

Use PlayHT TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import playai

session = AgentSession(
   tts=playai.TTS(
      voice="s3://voice-cloning-zero-shot/a59cb96d-bba8-4e24-81f2-e60b888a0275/charlottenarrativesaad/manifest.json",
      language="SPANISH",
      model="play3.0-mini",
   ),
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/playai/index.html.md#livekit.plugins.playai.TTS) for a complete list of all available parameters.

- **`voice`** _(string)_ (optional) - Default: `s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json`: URL of the voice manifest file. For a full list, see [List of pre-built voices](https://docs.play.ht/reference/list-of-prebuilt-voices).

- **`model`** _(TTSModel | string)_ (optional) - Default: `Play3.0-mini`: Name of the TTS model. For a full list, see [Models](https://docs.play.ht/reference/models).

- **`language`** _(string)_ (optional) - Default: `ENGLISH`: Language of the text to be spoken. For language support by model, see [Models](https://docs.play.ht/reference/models).

## Customizing pronunciation

PlayHT TTS supports adding custom pronunciations to your speech-to-text conversions. To learn more, see the [Add Custom Pronunciations to your Audio help article](https://help.play.ht/en/article/add-custom-pronunciations-to-your-audio-a141nv/).

## Additional resources

The following resources provide more information about using PlayHT with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-playai/)**: The `livekit-plugins-playai` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/playai/index.html.md#livekit.plugins.playai.TTS)**: Reference for the PlayHT TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-playai)**: View the source or contribute to the LiveKit PlayHT TTS plugin.

- **[PlayHT docs](https://docs.play.ht)**: PlayHT TTS docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and PlayHT TTS.

---

This document was rendered at 2025-09-27T09:36:17.803Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/playai.md](https://docs.livekit.io/agents/integrations/tts/playai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).