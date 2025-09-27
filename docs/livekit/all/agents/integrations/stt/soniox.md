LiveKit Docs › Integration guides › Speech-to-text (STT) › Soniox

---

# Soniox STT integration guide

> How to use the Soniox STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Soniox](https://soniox.com/) provides realtime speech recognition. Use the Soniox plugin with LiveKit Agents to build voice agents with fast, accurate transcription.

## Quick reference

This section provides a quick reference for the Soniox STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install livekit-plugins-soniox

```

### Authentication

The Soniox plugin requires an API key from the [Soniox console](https://console.soniox.com/).

Set `SONIOX_API_KEY` in your `.env` file.

### Usage

Use Soniox STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import soniox

session = AgentSession(
   stt=soniox.STT(),
   # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/soniox/index.html.md) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `stt-rt-preview`: The Soniox STT model to use. See [documentation](https://soniox.com/docs/stt/models) for a complete list of supported models.

- **`context`** _(string)_ (optional) - Default: `None`: Free-form text that provides additional context or vocabulary to bias transcription towards domain-specific terms.

- **`enable_language_identification`** _(boolean)_ (optional) - Default: `true`: When `true`, the Soniox attempts to identify the language of the input audio.

## Additional resources

The following resources provide more information about using Soniox with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-soniox/)**: The `livekit-plugins-soniox` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/soniox/index.html.md)**: Reference for the Soniox STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-soniox)**: View the source or contribute to the LiveKit Soniox STT plugin.

- **[Soniox docs](https://soniox.com/docs)**: Soniox's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Soniox.

---

This document was rendered at 2025-09-27T09:36:11.239Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/soniox.md](https://docs.livekit.io/agents/integrations/stt/soniox.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).