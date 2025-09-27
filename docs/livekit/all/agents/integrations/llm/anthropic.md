LiveKit Docs › Integration guides › Large language models (LLM) › Anthropic

---

# Anthropic Claude LLM integration guide

> How to use the Anthropic Claude LLM plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Anthropic](https://www.anthropic.com/claude) provides Claude, an advanced AI assistant with capabilities including advanced reasoning, vision analysis, code generation, and multilingual processing. With LiveKit's Anthropic integration and the Agents framework, you can build sophisticated voice AI applications.

You can also use Claude with [Amazon Bedrock](https://docs.livekit.io/agents/integrations/llm/aws.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[anthropic]~=1.2"

```

### Authentication

The Anthropic plugin requires an [Anthropic API key](https://console.anthropic.com/account/keys).

Set `ANTHROPIC_API_KEY` in your `.env` file.

### Usage

Use Claude within an `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import anthropic

session = AgentSession(
    llm=anthropic.LLM(
        model="claude-3-5-sonnet-20241022",
        temperature=0.8,
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/anthropic/index.html.md#livekit.plugins.anthropic.LLM) for a complete list of all available parameters.

- **`model`** _(str | ChatModels)_ (optional) - Default: `claude-3-5-sonnet-20241022`: Model to use. For a full list of available models, see the [Model options](https://docs.anthropic.com/en/docs/intro-to-claude#model-options).

- **`max_tokens`** _(int)_ (optional): The maximum number of tokens to generate before stopping. To learn more, see the [Anthropic API reference](https://docs.anthropic.com/en/api/messages#body-max-tokens).

- **`temperature`** _(float)_ (optional) - Default: `1`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

Valid values are between `0` and `1`. To learn more, see the [Anthropic API reference](https://docs.anthropic.com/en/api/messages#body-temperature).

- **`parallel_tool_calls`** _(bool)_ (optional): Controls whether the model can make multiple tool calls in parallel. When enabled, the model can make multiple tool calls simultaneously, which can improve performance for complex tasks.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. Set to 'auto' to let the model decide, 'required' to force tool usage, or 'none' to disable tool usage.

## Additional resources

The following links provide more information about the Anthropic LLM plugin.

- **[Python package](https://pypi.org/project/livekit-plugins-anthropic/)**: The `livekit-plugins-anthropic` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/anthropic/index.html.md#livekit.plugins.anthropic.LLM)**: Reference for the Anthropic LLM plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-anthropic)**: View the source or contribute to the LiveKit Anthropic LLM plugin.

- **[Anthropic docs](https://docs.anthropic.com/en/docs/intro-to-claude)**: Anthropic Claude docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Anthropic.

---

This document was rendered at 2025-09-27T09:35:59.860Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/anthropic.md](https://docs.livekit.io/agents/integrations/llm/anthropic.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).