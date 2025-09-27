LiveKit Docs › Integration guides › Text-to-speech (TTS) › Hume

---

# Hume TTS integration guide

> How to use the Hume TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Hume](https://hume.ai/) provides a text-to-speech service that understands emotional expressions. You can use the Hume TTS plugin for LiveKit Agents to create lifelike and emotional voice AI apps.

## Quick reference

This section includes a brief overview of the Hume TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[hume]~=1.2"

```

## Authentication

The Hume plugin requires a [Hume API key](https://platform.hume.ai/settings/keys).

Set `HUME_API_KEY` in your `.env` file.

### Usage

Use Hume TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import hume

session = AgentSession(
   tts=hume.TTS(
      voice=hume.VoiceByName(name="Colton Rivers", provider=hume.VoiceProvider.hume),
      description="The voice exudes calm, serene, and peaceful qualities, like a gentle stream flowing through a quiet forest.",
   )
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/hume/index.html.md#livekit.plugins.hume.TTS) for a complete list of all available parameters.

- **`voice`** _(VoiceByName | VoiceById)_ (optional): The voice, specified by name or id, to be used. When no voice is specified, a novel voice will be [generated based on the text and optionally provided description](https://dev.hume.ai/docs/text-to-speech-tts/voices#specify-a-voice-or-dont).

- **`description`** _(string)_ (optional): Natural language instructions describing how the synthesized speech should sound, including but not limited to tone, intonation, pacing, and accent. If a Voice is specified in the request, this description serves as [acting](https://dev.hume.ai/docs/text-to-speech-tts/acting-instructions) instructions. If no Voice is specified, a new voice is generated [based on this description](https://dev.hume.ai/docs/text-to-speech-tts/prompting).

- **`speed`** _(float)_ (optional) - Default: `1.0`: Adjusts the relative speaking rate on a non-linear scale from 0.25 (much slower) to 3.0 (much faster), where 1.0 represents normal speaking pace.

- **`instant_mode`** _(bool)_ (optional) - Default: `true`: Enables ultra-low latency streaming, reducing time to first chunk. Recommended for real-time applications. Only for streaming endpoints. With this enabled, requests incur 10% higher cost.

Instant mode is automatically enabled when a voice is specified in the request.

## Updating utterance options

To change the values during the session, use the `update_options` method. It accepts the same parameters as the TTS constructor. The new values take effect on the next utterance:

```python
session.tts.update_options(
   voice=hume.VoiceByName(name="Colton Rivers", provider=hume.VoiceProvider.hume),
   description="The voice exudes calm, serene, and peaceful qualities, like a gentle stream flowing through a quiet forest.",
   speed=2,
)

```

## Additional resources

The following resources provide more information about using Hume with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-hume/)**: The `livekit-plugins-hume` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/hume/index.html.md#livekit.plugins.hume.TTS)**: Reference for the Hume TTS plugin.

- **[Hume docs](https://dev.hume.ai/docs/text-to-speech-tts)**: Hume docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Hume TTS.

---

This document was rendered at 2025-09-27T09:36:16.363Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/hume.md](https://docs.livekit.io/agents/integrations/tts/hume.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).