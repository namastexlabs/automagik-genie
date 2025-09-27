LiveKit Docs › Integration guides › Text-to-speech (TTS) › Smallest AI

---

# Smallest AI integration guide

> How to use the Smallest AI Waves TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Smallest AI](https://smallest.ai/text-to-speech) provides a TTS platform called Waves, which turns text into natural-sounding speech. With LiveKit's Smallest AI integration, you can convert text to audio in real time, choose different voices, and control output format and quality for your agents.

To learn more about TTS and generating agent speech, see [Agent speech](https://docs.livekit.io/agents/build/audio.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install livekit-plugins-smallestai

```

### Authentication

The Smallest AI plugin requires an [API key](https://console.smallest.ai/apikeys).

Set `SMALLEST_API_KEY` in your `.env` file.

### Usage

Use Smallest AI TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import smallestai

session = AgentSession(
    tts=smallestai.TTS(
        voice_id="irisha",
        sample_rate=24000,
        output_format="pcm",
    ),
    # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/smallestai/index.html.md) for a complete list of all available parameters.

- **`model`** _(TTSModels | string)_ (optional) - Default: `lightning`: Model to use.

- **`voice_id`** _(string)_ (optional): The voice ID for synthesis. Must be a valid Smallest AI voice identifier.

- **`sample_rate`** _(number)_ (optional) - Default: `24000`: Target audio sample rate in Hz. Match the rate to the rest of your audio pipeline to avoid resampling artifacts.

- **`output_format`** _(TTSOutputFormat | string)_ (optional) - Default: `pcm`: Encoding format for synthesized audio. Select a format based on if you want raw audio for streaming/processing or compressed for storage/playback.

## Additional resources

The following resources provide more information about using Smallest AI with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-smallestai/)**: The `livekit-plugins-smallestai` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/smallestai/index.html.md)**: Reference for the Smallest AI TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-smallestai)**: View the source or contribute to the LiveKit Smallest AI TTS plugin.

- **[Smallest AI docs](https://waves-docs.smallest.ai/v3.0.1/content/introduction/introduction)**: Smallest AI's Waves TTS docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Smallest AI TTS.

---

This document was rendered at 2025-09-27T09:36:18.943Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/smallestai.md](https://docs.livekit.io/agents/integrations/tts/smallestai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).