LiveKit Docs › Integration guides › Large language models (LLM) › Cerebras

---

# Cerebras LLM integration guide

> How to use the Cerebras inference with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Cerebras](https://www.cerebras.net/) provides access to Llama 3.1 and 3.3 models through their inference API. These models are multilingual and text-only, making them suitable for a variety of agent applications.

## Usage

Install the OpenAI plugin to add Cerebras support:

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
CEREBRAS_API_KEY=<your-cerebras-api-key>

```

Create a Cerebras LLM using the `with_cerebras` method:

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_cerebras(
        model="llama3.1-8b",
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    llm: openai.LLM.withCerebras({
        model: "llama3.1-8b",
    }),
    // ... tts, stt, vad, turn_detection, etc.
});

```

## Parameters

This section describes some of the available parameters. See the plugin reference links in the [Additional resources](#additional-resources) section for a complete list of all available parameters.

- **`model`** _(str | CerebrasChatModels)_ (optional) - Default: `llama3.1-8b`: Model to use for inference. To learn more, see [supported models](https://inference-docs.cerebras.ai/api-reference/chat-completions#param-model).

- **`temperature`** _(float)_ (optional) - Default: `1.0`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

Valid values are between `0` and `1.5`. To learn more, see the [Cerebras documentation](https://inference-docs.cerebras.ai/api-reference/chat-completions#param-temperature).

- **`parallel_tool_calls`** _(bool)_ (optional): Controls whether the model can make multiple tool calls in parallel. When enabled, the model can make multiple tool calls simultaneously, which can improve performance for complex tasks.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. Set to 'auto' to let the model decide, 'required' to force tool usage, or 'none' to disable tool usage.

## Additional resources

The following links provide more information about the Cerebras LLM integration.

- **[Cerebras docs](https://inference-docs.cerebras.ai/)**: Cerebras inference docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Cerebras.

---

This document was rendered at 2025-09-27T09:36:01.006Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/cerebras.md](https://docs.livekit.io/agents/integrations/llm/cerebras.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).