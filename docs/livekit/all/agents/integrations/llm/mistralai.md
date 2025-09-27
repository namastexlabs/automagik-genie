LiveKit Docs › Integration guides › Large language models (LLM) › Mistral AI

---

# Mistral AI integration guide

> How to integrate Mistral AI's La Plateforme inference service with LiveKit Agents.

## Overview

LiveKit's [Mistral AI](https://mistral.ai/) plugin provides access to their instruction-tuned, code, and vision chat models through [La Plateforme](https://mistral.ai/products/la-plateforme). You can use Mistral AI with LiveKit Agents for conversation, reasoning, and other text-generation tasks.

The Mistral AI plugin also supports [STT models](https://docs.livekit.io/agents/integrations/stt/mistralai.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the LiveKit Mistral AI plugin from PyPI:

```bash
pip install "livekit-agents[mistralai]~=1.2"

```

### Authentication

The Mistral AI integration requires a [Mistral AI API key](https://console.mistral.ai/api-keys/).

Set the `MISTRAL_API_KEY` in your `.env` file.

### Usage

Use Mistral AI within an `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import mistralai

session = AgentSession(
    llm=mistralai.LLM(
        model="mistral-medium-latest"
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/mistralai.md#livekit.plugins.mistralai.LLM) for a complete list of all available parameters.

- **`model`** _(string | ChatModels)_ (optional) - Default: `ministral-8b-2410`: Which Mistral AI model to use. You can pass a string or a typed enum from `ChatModels`.

- **`temperature`** _(float)_ (optional): Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

## Additional resources

The following resources provide more information about using Mistral AI with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-mistralai)**: The `livekit-plugins-mistralai` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/mistralai.md#livekit.plugins.mistralai.LLM)**: Reference for the Mistral AI LLM plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-mistralai)**: View the source or contribute to the LiveKit Mistral AI LLM plugin.

- **[Mistral AI STT docs](https://docs.livekit.io/agents/integrations/stt/mistralai.md)**: Mistral AI STT documentation.

- **[Mistral AI docs](https://docs.mistral.ai/)**: Mistral AI platform documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Mistral AI.

---

This document was rendered at 2025-09-27T09:36:03.045Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/mistralai.md](https://docs.livekit.io/agents/integrations/llm/mistralai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).