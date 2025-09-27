LiveKit Docs › Integration guides › Large language models (LLM) › Ollama

---

# Ollama integration guide

> How to run models locally using Ollama with LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Ollama](https://ollama.com/library) is an open source LLM engine that you can use to run models locally with an OpenAI-compatible API. Ollama support is available using the OpenAI plugin for LiveKit Agents.

## Usage

Install the OpenAI plugin to add Ollama support:

```bash
pip install "livekit-agents[openai]~=1.2"

```

Create an Ollama LLM using the `with_ollama` method:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_ollama(
        model="llama3.1",
        base_url="http://localhost:11434/v1",
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/openai/index.html.md#livekit.plugins.openai.LLM.with_cerebras) for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `llama3.1`: Ollama model to use. For a list of available models, see [Ollama models](https://ollama.com/models).

- **`base_url`** _(string)_ (optional) - Default: `http://localhost:11434/v1`: Base URL for the Ollama API.

- **`temperature`** _(float)_ (optional): Controls the randomness of the model's output. Higher values (e.g., 0.8) make the output more random, while lower values (e.g., 0.2) make it more focused and deterministic.

## Links

The following links provide more information about the Ollama integration.

- **[Python package](https://pypi.org/project/livekit-plugins-openai/)**: The `livekit-plugins-openai` package on PyPI.

- **[Plugin reference](https://docs.livekit.run/reference/python/v1/livekit/plugins/openai/index.html#livekit.plugins.openai.LLM.with_ollama)**: Reference for the `with_ollama` method of the OpenAI LLM plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-openai)**: View the source or contribute to the LiveKit OpenAI LLM plugin.

- **[Ollama docs](https://ollama.com/)**: Ollama site and documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Ollama.

---

This document was rendered at 2025-09-27T09:36:03.312Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/ollama.md](https://docs.livekit.io/agents/integrations/llm/ollama.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).