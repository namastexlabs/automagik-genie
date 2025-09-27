LiveKit Docs › Integration guides › Text-to-speech (TTS) › Rime

---

# Rime integration guide

> How to use the Rime TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Rime](https://rime.ai/) provides text-to-speech synthesis (TTS) optimized for speed and quality. With LiveKit's Rime integration and the Agents framework, you can build voice AI applications that are responsive and sound realistic.

To learn more about TTS and generating agent speech, see [Agent speech](https://docs.livekit.io/agents/build/audio.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[rime]~=1.2"

```

### Authentication

The Rime plugin requires a [Rime API key](https://rime.ai/).

Set `RIME_API_KEY` in your `.env` file.

### Usage

Use Rime TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import rime

session = AgentSession(
   tts=rime.TTS(
      model="mist",
      speaker="rainforest",
      speed_alpha=0.9,
      reduce_latency=True,
   ),
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/rime/index.html.md#livekit.plugins.rime.TTS) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `mist`: ID of the model to use. To learn more, see [Models](https://docs.rime.ai/api-reference/models).

- **`speaker`** _(string)_ (optional) - Default: `lagoon`: ID of the voice to use for speech generation. To learn more, see [Voices](https://docs.rime.ai/api-reference/voices).

- **`audio_format`** _(TTSEncoding)_ (optional) - Default: `pcm`: Audio format to use. Valid values are: `pcm` and `mp3`.

- **`sample_rate`** _(integer)_ (optional) - Default: `16000`: Sample rate of the generated audio. Set this rate to best match your application needs. To learn more, see [Recommendations for reducing response time](https://docs.rime.ai/api-reference/latency#recommendations-for-reducing-response-time).

- **`speed_alpha`** _(float)_ (optional) - Default: `1.0`: Adjusts the speed of speech. Lower than `1.0` results in faster speech; higher than `1.0` results in slower speech.

- **`reduce_latency`** _(boolean)_ (optional) - Default: `false`: When set to `true`, turns off text normalization to reduce the amount of time spent preparing input text for TTS inference. This might result in the mispronunciation of digits and abbreviations. To learn more, see [Recommendations for reducing response time](https://docs.rime.ai/api-reference/latency#recommendations-for-reducing-response-time).

- **`phonemize_between_brackets`** _(boolean)_ (optional) - Default: `false`: When set to `true`, allows the use of custom pronunciation strings in text. To learn more, see [Custom pronunciation](https://docs.rime.ai/api-reference/custom-pronunciation).

- **`api_key`** _(string)_ (optional) - Environment: `RIME_API_KEY`: Rime API Key. Required if the environment variable isn't set.

## Customizing pronunciation

Rime TTS supports customizing pronunciation. To learn more, see [Custom Pronunciation guide](https://docs.rime.ai/api-reference/custom-pronunciation).

## Additional resources

The following resources provide more information about using Rime with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-rime/)**: The `livekit-plugins-rime` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/rime/index.html.md#livekit.plugins.rime.TTS)**: Reference for the Rime TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-rime)**: View the source or contribute to the LiveKit Rime TTS plugin.

- **[Rime docs](https://docs.rime.ai)**: Rime TTS docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Rime TTS.

---

This document was rendered at 2025-09-27T09:36:18.383Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/rime.md](https://docs.livekit.io/agents/integrations/tts/rime.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).