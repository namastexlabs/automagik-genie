LiveKit Docs › Integration guides › Text-to-speech (TTS) › Speechify

---

# Speechify TTS integration guide

> How to use the Speechify TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Speechify](https://speechify.com) provides an ultra low latency, human quality, and affordable text to speech API with voice cloning features. You can use the Speechify TTS plugin for LiveKit Agents to build high-quality voice AI applications.

## Quick reference

This section includes a brief overview of the Speechify TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[speechify]~=1.2"

```

## Authentication

The Speechify plugin requires a [Speechify API key](https://console.sws.speechify.com).

Set `SPEECHIFY_API_KEY` in your .env file.

### Usage

Use Speechify TTS within an AgentSession or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import speechify

session = AgentSession(
   tts=speechify.TTS(
      model="simba-english",
      voice_id="jack",
   )
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/speechify/index.html.md#livekit.plugins.speechify.TTS) for a complete list of all available parameters.

- **`voice_id`** _(string)_ - Default: `jack`: ID of the voice to be used for synthesizing speech. Refer to `list_voices()` method in the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/speechify/index.html.md#livekit.plugins.speechify.TTS.list_voices).

- **`model`** _(string)_ (optional): ID of the model to use for generation. Use `simba-english` or `simba-multilingual` To learn more, see: [supported models](https://docs.sws.speechify.com/v1/docs/get-started/models).

- **`language`** _(string)_ (optional): Language of input text in ISO-639-1 format. See the [supported languages](https://docs.sws.speechify.com/v1/docs/features/language-support).

- **`encoding`** _(string)_ (optional) - Default: `wav_48000`: Audio encoding to use. Choose between `wav_48000`, `mp3_24000`, `ogg_24000` or `aac_24000`.

- **`loudness_normalization`** _(boolean)_ (optional): Determines whether to normalize the audio loudness to a standard level. When enabled, loudness normalization aligns the audio output to the following standards: Integrated loudness: -14 LUFS True peak: -2 dBTP Loudness range: 7 LU If disabled, the audio loudness will match the original loudness of the selected voice, which may vary significantly and be either too quiet or too loud. Enabling loudness normalization can increase latency due to additional processing required for audio level adjustments.

- **`text_normalization`** _(boolean)_ (optional): Determines whether to normalize the text. If enabled, it will transform numbers, dates, etc. into words. For example, "55" is normalized into "fifty five". This can increase latency due to additional processing required for text normalization.

## Customizing pronunciation

Speechify supports custom pronunciation with Speech Synthesis Markup Language (SSML), an XML-based markup language that gives you granular control over speech output. With SSML, you can leverage XML tags to craft audio content that delivers a more natural and engaging listening experience. To learn more, see [SSML](https://docs.sws.speechify.com/v1/docs/features/ssml).

## Additional resources

The following resources provide more information about using Speechify with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-speechify/)**: The `livekit-plugins-speechify` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/speechify/index.html.md#livekit.plugins.speechify.TTS)**: Reference for the Speechify TTS plugin.

- **[Speechify docs](https://docs.sws.speechify.com/v1/docs)**: Speechify docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Speechify TTS.

---

This document was rendered at 2025-09-27T09:36:19.225Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/speechify.md](https://docs.livekit.io/agents/integrations/tts/speechify.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).