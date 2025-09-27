LiveKit Docs › Integration guides › Speech-to-text (STT) › Sarvam

---

# Sarvam STT integration guide

> How to use the Sarvam STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Sarvam](https://docs.sarvam.ai/) provides advanced speech recognition technology optimized for Indian languages. With LiveKit's Sarvam integration and the Agents framework, you can build AI agents that provide high-accuracy transcriptions for Indian languages and accents.

## Quick reference

This section provides a quick reference for the Sarvam STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[sarvam]~=1.2"

```

### Authentication

The Sarvam plugin requires a [Sarvam API key](https://docs.sarvam.ai/).

Set `SARVAM_API_KEY` in your `.env` file.

### Usage

Use Sarvam STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import sarvam

session = AgentSession(
   stt=sarvam.STT(
      language="hi-IN",
      model="saarika:v2.5",
   ),
   # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/sarvam/index.html.md#livekit.plugins.sarvam.STT) for a complete list of all available parameters.

- **`language`** _(string)_ (optional): BCP-47 language code for supported Indian languages. See [documentation](https://docs.sarvam.ai/api-reference-docs/speech-to-text/transcribe#request.body.language_code.language_code) for a complete list of supported languages.

- **`model`** _(string)_ (optional) - Default: `saarika:v2.5`: The Sarvam STT model to use. See [documentation](https://docs.sarvam.ai/api-reference-docs/speech-to-text/transcribe#request.body.model) for a complete list of supported models.

## Additional resources

The following resources provide more information about using Sarvam with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-sarvam/)**: The `livekit-plugins-sarvam` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/sarvam/index.html.md#livekit.plugins.sarvam.STT)**: Reference for the Sarvam STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-sarvam)**: View the source or contribute to the LiveKit Sarvam STT plugin.

- **[Sarvam docs](https://docs.sarvam.ai/)**: Sarvam's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Sarvam.

- **[Sarvam TTS](https://docs.livekit.io/agents/integrations/tts/sarvam.md)**: Guide to the Sarvam TTS integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:10.960Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/sarvam.md](https://docs.livekit.io/agents/integrations/stt/sarvam.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).