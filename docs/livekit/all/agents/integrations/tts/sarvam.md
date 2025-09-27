LiveKit Docs › Integration guides › Text-to-speech (TTS) › Sarvam

---

# Sarvam TTS integration guide

> How to use the Sarvam TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Sarvam](https://sarvam.ai/) provides high-quality text-to-speech technology optimized for Indian languages. With LiveKit's Sarvam integration and the Agents framework, you can build voice AI agents that sound natural in Indian languages.

## Quick reference

This section provides a quick reference for the Sarvam TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[sarvam]~=1.2"

```

### Authentication

The Sarvam plugin requires a [Sarvam API key](https://dashboard.sarvam.ai/key-management).

Set `SARVAM_API_KEY` in your `.env` file.

### Usage

Use Sarvam TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import sarvam

session = AgentSession(
   tts=sarvam.TTS(
      target_language_code="hi-IN",
      speaker="anushka",
   )
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/sarvam/index.html.md#livekit.plugins.sarvam.TTS) for a complete list of all available parameters.

- **`target_language_code`** _(string)_: BCP-47 language code for supported Indian languages. For example: `hi-IN` for Hindi, `en-IN` for Indian English. See [documentation](https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert#request.body.target_language_code) for a complete list of supported languages.

- **`model`** _(string)_ (optional) - Default: `bulbul:v2`: The Sarvam TTS model to use. Currently only `bulbul:v2` is supported. See [documentation](https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert#request.body.model) for a complete list of supported models.

- **`speaker`** _(string)_ (optional) - Default: `anushka`: Voice to use for synthesis. See [documentation](https://docs.sarvam.ai/api-reference-docs/text-to-speech/convert#request.body.speaker) for a complete list of supported voices.

- **`pitch`** _(float)_ (optional) - Default: `0.0`: Voice pitch adjustment. Valid range: -20.0 to 20.0.

- **`pace`** _(float)_ (optional) - Default: `1.0`: Speech rate multiplier. Valid range: 0.5 to 2.0.

- **`loudness`** _(float)_ (optional) - Default: `1.0`: Volume multiplier. Valid range: 0.5 to 2.0.

## Additional resources

The following resources provide more information about using Sarvam with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-sarvam/)**: The `livekit-plugins-sarvam` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/sarvam/index.html.md#livekit.plugins.sarvam.TTS)**: Reference for the Sarvam TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-sarvam)**: View the source or contribute to the LiveKit Sarvam TTS plugin.

- **[Sarvam docs](https://docs.sarvam.ai/)**: Sarvam's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Sarvam.

- **[Sarvam STT](https://docs.livekit.io/agents/integrations/stt/sarvam.md)**: Guide to the Sarvam STT integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:18.658Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/sarvam.md](https://docs.livekit.io/agents/integrations/tts/sarvam.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).