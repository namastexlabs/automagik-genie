LiveKit Docs › Integration guides › Text-to-speech (TTS) › LMNT

---

# LMNT TTS integration guide

> How to use the LMNT TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[LMNT](https://lmnt.com/) provides a fast text-to-speech service optimized for realtime voice AI. With LiveKit's LMNT integration and the Agents framework, you can build high-performance and lifelike voice AI at scale.

## Quick reference

This section provides a quick reference for the LMNT TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[lmnt]~=1.2"

```

### Authentication

The LMNT plugin requires an [LMNT API key](https://app.lmnt.com/account).

Set `LMNT_API_KEY` in your `.env` file.

### Usage

Use LMNT TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import lmnt

session = AgentSession(
   tts=lmnt.TTS(
      voice="leah",
   )
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the parameters you can set when you create an LMNT TTS. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/lmnt/index.html.md#livekit.plugins.lmnt.TTS) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `blizzard`: The model to use for synthesis. Refer to the [LMNT models guide](https://docs.lmnt.com/guides/models) for possible values.

- **`voice`** _(string)_ (optional) - Default: `leah`: The voice ID to use. Find or create new voices in the [LMNT voice library](https://app.lmnt.com/voice-library).

- **`language`** _(string)_ (optional): Two-letter ISO 639-1 language code. See the [LMNT API documentation](https://docs.lmnt.com/api-reference/speech/synthesize-speech-bytes#body-language) for supported languages.

- **`temperature`** _(float)_ (optional): Influences how expressive and emotionally varied the speech becomes. Lower values (like 0.3) create more neutral, consistent speaking styles. Higher values (like 1.0) allow for more dynamic emotional range and speaking styles.

- **`top_p`** _(float)_ (optional): Controls the stability of the generated speech. A lower value (like 0.3) produces more consistent, reliable speech. A higher value (like 0.9) gives more flexibility in how words are spoken, but might occasionally produce unusual intonations or speech patterns.

## Additional resources

The following resources provide more information about using LMNT with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-lmnt/)**: The `livekit-plugins-lmnt` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/lmnt/index.html.md#livekit.plugins.lmnt.TTS)**: Reference for the LMNT TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-lmnt)**: View the source or contribute to the LiveKit LMNT TTS plugin.

- **[LMNT docs](https://docs.lmnt.com/)**: LMNT API documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and LMNT TTS.

---

This document was rendered at 2025-09-27T09:36:16.913Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/lmnt.md](https://docs.livekit.io/agents/integrations/tts/lmnt.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).