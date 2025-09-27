LiveKit Docs › Integration guides › Large language models (LLM) › Perplexity

---

# Perplexity LLM integration guide

> How to use Perplexity LLM with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Perplexity](https://www.perplexity.ai/) provides access to their Sonar models, which are based on Llama 3.1 but fine-tuned for search, through their inference API. These models are multilingual and text-only, making them suitable for a variety of agent applications.

## Usage

Install the OpenAI plugin to add Perplexity support:

**Python**:

```shell
pip install "livekit-agents[openai]~=1.2"

```

---

**Node.js**:

```shell
pnpm add @livekit/agents-plugin-openai@1.x

```

Set the following environment variable in your `.env` file:

```shell
PERPLEXITY_API_KEY=<your-perplexity-api-key>

```

Create a Perplexity LLM using the `with_perplexity` method:

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_perplexity(
        model="llama-3.1-sonar-small-128k-chat",
\    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    llm: openai.LLM.withPerplexity({
        model: "llama-3.1-sonar-small-128k-chat",
    }),
    // ... tts, stt, vad, turn_detection, etc.
});

```

## Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the plugin reference links in the [Additional resources](#additional-resources) section.

- **`model`** _(str | PerplexityChatModels)_ (optional) - Default: `llama-3.1-sonar-small-128k-chat`: Model to use for inference. To learn more, see [supported models](https://docs.perplexity.ai/guides/model-cards).

- **`temperature`** _(float)_ (optional) - Default: `1.0`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

Valid values are between `0` and `2`.

- **`parallel_tool_calls`** _(bool)_ (optional): Controls whether the model can make multiple tool calls in parallel. When enabled, the model can make multiple tool calls simultaneously, which can improve performance for complex tasks.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. Set to 'auto' to let the model decide, 'required' to force tool usage, or 'none' to disable tool usage.

## Additional resources

The following links provide more information about the Perplexity LLM integration.

- **[Perplexity docs](https://docs.perplexity.ai/docs/overview)**: Perplexity API documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Perplexity.

---

This document was rendered at 2025-09-27T09:36:03.857Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/perplexity.md](https://docs.livekit.io/agents/integrations/llm/perplexity.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).