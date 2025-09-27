LiveKit Docs › Integration guides › Text-to-speech (TTS) › Resemble AI

---

# Resemble AI TTS integration guide

> How to use the Resemble AI TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Resemble AI](https://resemble.ai/) provides natural and human-like text-to-speech. You can use the Resemble AI TTS plugin for LiveKit Agents to build your voice AI applications.

## Quick reference

This section includes a brief overview of the Resemble AI TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[resemble]~=1.2"

```

## Authentication

The Resemble AI plugin requires a [Resemble AI API key](https://app.resemble.ai/account/api).

Set `RESEMBLE_API_KEY` in your `.env` file.

### Usage

Use Resemble AI TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import resemble

session = AgentSession(
   tts=resemble.TTS(
      voice_uuid="55592656",
   )
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/resemble/index.html.md#livekit.plugins.resemble.TTS) for a complete list of all available parameters.

- **`voice_uuid`** _(string)_ - Default: `55592656`: ID of the voice to use.

## Customizing pronunciation

Resemble AI supports custom pronunciation with Speech Synthesis Markup Language (SSML), an XML-based markup language that gives you granular control over speech output. With SSML, you can leverage XML tags to craft audio content that delivers a more natural and engaging listening experience. To learn more, see [SSML](https://docs.app.resemble.ai/docs/getting_started/ssml).

## Additional resources

The following resources provide more information about using Resemble AI with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-resemble/)**: The `livekit-plugins-resemble` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/resemble/index.html.md#livekit.plugins.resemble.TTS)**: Reference for the Resemble AI TTS plugin.

- **[Resemble AI docs](https://docs.app.resemble.ai)**: Resemble AI docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Resemble AI TTS.

---

This document was rendered at 2025-09-27T09:36:18.076Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/resemble.md](https://docs.livekit.io/agents/integrations/tts/resemble.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).