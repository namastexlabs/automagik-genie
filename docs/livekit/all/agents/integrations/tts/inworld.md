LiveKit Docs › Integration guides › Text-to-speech (TTS) › Inworld

---

# Inworld TTS integration guide

> How to use the Inworld TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Inworld](https://inworld.ai/) develops AI products for builders of consumer applications, including an accessible, high quality text-to-speech service for developers. With LiveKit's Inworld TTS integration and the Agents framework, you can build engaging and immersive voice AI experiences.

## Quick reference

This section includes a brief overview of the Inworld TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[inworld]~=1.2"

```

### Authentication

The Inworld plugin requires Base64 [Inworld API key](https://platform.inworld.ai/login).

Set `INWORLD_API_KEY` in your `.env` file.

### Usage

Use Inworld TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import inworld

session = AgentSession(
   tts=inworld.TTS(voice="Hades")
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/inworld/index.html.md#livekit.plugins.inworld.TTS) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `"inworld-tts-1"`: ID of the model to use for generation. See [supported models](https://docs.inworld.ai/docs/models#tts).

- **`voice`** _(string)_ (optional) - Default: `"Ashley"`: ID of the voice to use for generation. Use the [List voices API endpoint](https://docs.inworld.ai/api-reference/ttsAPI/texttospeech/list-voices) for possible values.

- **`temperature`** _(float)_ (optional) - Default: `0.8`: Controls randomness in the output. Recommended to set between 0.6 and 1.0. See [docs](https://docs.inworld.ai/docs/tts/tts#additional-configurations).

- **`speaking_rate`** _(float)_ (optional) - Default: `1.0`: Controls how fast the voice speaks. 1.0 is the normal native speed, while 0.5 is half the normal speed and 1.5 is 1.5x faster than the normal speed. See [docs](https://docs.inworld.ai/docs/tts/tts#additional-configurations).

- **`pitch`** _(float)_ (optional) - Default: `0.0`: Adjusts how high or low the voice sounds. Negative values make the voice deeper/lower, while positive values make it higher/squeakier. See [docs](https://docs.inworld.ai/docs/tts/tts#additional-configurations).

## Additional resources

The following resources provide more information about using Inworld with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-inworld/)**: The `livekit-plugins-inworld` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/inworld/index.html.md#livekit.plugins.inworld.TTS)**: Reference for the Inworld TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-inworld)**: View the source or contribute to the LiveKit Inworld TTS plugin.

- **[Inworld docs](https://docs.inworld.ai/docs/introduction)**: Inworld TTS docs.

---

This document was rendered at 2025-09-27T09:36:16.638Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/inworld.md](https://docs.livekit.io/agents/integrations/tts/inworld.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).