LiveKit Docs › Integration guides › Large language models (LLM) › Baseten

---

# Baseten LLM integration guide

> How to use the Baseten LLM plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Baseten](https://www.baseten.co/) is a hosted inference platform that includes a Model API for a variety of popular open source LLMs from Llama, DeepSeek, and more. With LiveKit's Baseten integration and the Agents framework, you can build AI agents on top of these models.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[baseten]~=1.2"

```

### Authentication

The Baseten plugin requires a [Baseten API key](https://app.baseten.co/settings/api-keys).

Set the following in your `.env` file:

```shell
BASETEN_API_KEY=<your-baseten-api-key>

```

### Model selection

LiveKit Agents integrates with Baseten's Model API, which supports the most popular open source LLMs with per-token billing. To use the Model API, you only need to activate the model and then copy its name.

1. Activate your desired model in the [Model API](https://app.baseten.co/model-apis/create)
2. Copy its name from your model API endpoint dialog in your [model library](https://app.baseten.co/model-apis)
3. Use the model name in the plugin (e.g. `"meta-llama/Llama-4-Maverick-17B-128E-Instruct"`)

### Usage

Use a Baseten LLM in your `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import baseten

session = AgentSession(
    llm=baseten.LLM(
        model="meta-llama/Llama-4-Maverick-17B-128E-Instruct"
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

### Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the [plugin reference](https://docs.livekit.io/python/v1/livekit/plugins/groq/services.html.md#livekit.plugins.groq.services.LLM).

- **`model`** _(string)_ (optional) - Default: `meta-llama/Llama-4-Maverick-17B-128E-Instruct`: Name of the LLM model to use from the [Model API](https://www.baseten.co/model-apis). See [Model selection](#model-selection) for more information.

## Additional resources

The following resources provide more information about using Baseten with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-baseten/)**: The `livekit-plugins-baseten` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/baseten/index.html.md#livekit.plugins.baseten.LLM)**: Reference for the Baseten LLM plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-baseten)**: View the source or contribute to the LiveKit Baseten LLM plugin.

- **[Baseten docs](https://docs.baseten.co/)**: Baseten docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Baseten.

- **[Baseten TTS](https://docs.livekit.io/agents/integrations/tts/baseten.md)**: Baseten TTS integration guide.

- **[Baseten STT](https://docs.livekit.io/agents/integrations/stt/baseten.md)**: Baseten STT integration guide.

---

This document was rendered at 2025-09-27T09:36:00.727Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/baseten.md](https://docs.livekit.io/agents/integrations/llm/baseten.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).