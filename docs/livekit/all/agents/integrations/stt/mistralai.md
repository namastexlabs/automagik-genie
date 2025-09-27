LiveKit Docs › Integration guides › Speech-to-text (STT) › Mistral AI

---

# Mistral STT integration guide

> How to use the Mistral STT plugin for LiveKit Agents.

## Overview

LiveKit's [Mistral AI](https://mistral.ai/) plugin provides access to their STT models from the [Voxtral](https://mistral.ai/products/voxtral) family through [La Plateforme](https://mistral.ai/products/la-plateforme). You can use Mistral AI with LiveKit Agents for real-time transcription and other speech-understanding tasks.

The Mistral AI plugin also supports [LLM models](https://docs.livekit.io/agents/integrations/llm/mistralai.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

#### Installation

Install the LiveKit Mistral AI plugin from PyPI:

```bash
pip install "livekit-agents[mistralai]~=1.2"

```

### Authentication

The Mistral AI integration requires a [Mistral AI API key](https://console.mistral.ai/api-keys/).

Set the `MISTRAL_API_KEY` in your `.env` file.

### Usage

Use Mistral AI STT in your `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import mistralai

session = AgentSession(
    stt=mistralai.STT(
        model="voxtral-mini-2507"   
    ),
    # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/mistralai.md#livekit.plugins.mistralai.STT) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `voxtral-mini-latest`: Name of the Voxtral STT model to use.

## Additional resources

The following resources provide more information about using Groq with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-mistralai)**: The `livekit-plugins-mistralai` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/mistralai.md#livekit.plugins.mistralai.STT)**: Reference for the Mistral AI STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-mistralai)**: View the source or contribute to the LiveKit Mistral AI LLM plugin.

- **[Mistral AI LLM docs](https://docs.livekit.io/agents/integrations/llm/mistralai.md)**: Mistral AI LLM documentation.

- **[Mistral AI docs](https://docs.mistral.ai/)**: Mistral AI platform documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Mistral AI.

---

This document was rendered at 2025-09-27T09:36:10.312Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/mistralai.md](https://docs.livekit.io/agents/integrations/stt/mistralai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).