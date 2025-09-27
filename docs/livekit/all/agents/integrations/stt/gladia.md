LiveKit Docs › Integration guides › Speech-to-text (STT) › Gladia

---

# Gladia integration guide

> How to use the Gladia STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Gladia](https://gladia.io/) provides accurate speech recognition optimized for enterprise use cases. You can use the open source Gladia integration for LiveKit Agents to build voice AI with fast, accurate transcription and optional translation features.

## Quick reference

This section provides a brief overview of the Gladia STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[gladia]~=1.2"

```

### Authentication

The Gladia plugin requires a [Gladia API key](https://app.gladia.io/account).

Set `GLADIA_API_KEY` in your `.env` file.

### Initialization

Use Gladia STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import gladia

session = AgentSession(
    stt = gladia.STT(),
    # ... llm, tts, etc.
)

```

### Realtime translation

To use realtime translation, set `translation_enabled` to `True` and specify the expected audio languages in `languages` and the desired target language in `translation_target_languages`.

For example, to transcribe and translate a mixed English and French audio stream into English, set the following options:

```python
gladia.STT(
    translation_enabled=True,
    languages=["en", "fr"],
    translation_target_languages=["en"]
)

```

Note that if you specify more than one target language, the plugin emits a separate transcription event for each. When used in an `AgentSession`, this adds each transcription to the conversation history, in order, which might confuse the LLM.

### Updating options

Use the `update_options` method to configure the STT on the fly:

```python

gladia_stt = gladia.STT()

gladia_stt.update_options(
    languages=["ja", "en"],
    translation_enabled=True,
    translation_target_languages=["fr"]
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/gladia/index.html.md#livekit.plugins.gladia.STT) for a complete list of all available parameters.

- **`languages`** _(list[string])_ (optional) - Default: `[]`: List of languages to use for transcription. If empty, Gladia will auto-detect the language.

- **`code_switching`** _(bool)_ (optional) - Default: `false`: Enable switching between languages during recognition.

- **`translation_enabled`** _(bool)_ (optional) - Default: `false`: Enable real-time translation.

- **`translation_target_languages`** _(list[string])_ (optional) - Default: `[]`: List of target languages for translation.

## Additional resources

The following resources provide more information about using Gladia with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-gladia/)**: The `livekit-plugins-gladia` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/gladia/index.html.md#livekit.plugins.gladia.STT)**: Reference for the Gladia STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-gladia)**: View the source or contribute to the LiveKit Gladia STT plugin.

- **[Gladia documentation](https://docs.gladia.io/)**: Gladia's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Gladia.

---

This document was rendered at 2025-09-27T09:36:09.466Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/gladia.md](https://docs.livekit.io/agents/integrations/stt/gladia.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).