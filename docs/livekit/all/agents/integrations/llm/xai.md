LiveKit Docs › Integration guides › Large language models (LLM) › xAI

---

# xAI LLM integration guide

> How to use xAI LLM with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[xAI](https://x.ai/) provides access to Grok models through their OpenAI-compatible API. These models are multilingual and support multimodal capabilities, making them suitable for a variety of agent applications.

## Usage

Install the OpenAI plugin to add xAI support:

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
XAI_API_KEY=<your-xai-api-key>

```

Create a Grok LLM using the `with_x_ai` method:

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_x_ai(
        model="grok-3-mini",
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    llm: openai.LLM.withXAI({
        model: "grok-3-mini",
    }),
    // ... tts, stt, vad, turn_detection, etc.
});

```

## Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the plugin reference links in the [Additional resources](#additional-resources) section.

- **`model`** _(str | XAIChatModels)_ (optional) - Default: `grok-2-public`: Grok model to use. To learn more, see the [xAI Grok models](https://docs.x.ai/docs/models) page.

- **`temperature`** _(float)_ (optional) - Default: `1.0`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

Valid values are between `0` and `2`. To learn more, see the optional parameters for [Chat completions](https://docs.x.ai/docs/api-reference#chat-completions)

- **`parallel_tool_calls`** _(bool)_ (optional): Controls whether the model can make multiple tool calls in parallel. When enabled, the model can make multiple tool calls simultaneously, which can improve performance for complex tasks.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. Set to 'auto' to let the model decide, 'required' to force tool usage, or 'none' to disable tool usage.

## Additional resources

The following links provide more information about the xAI Grok LLM integration.

- **[xAI docs](https://docs.x.ai/docs/overview)**: xAI Grok documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and xAI Grok.

---

This document was rendered at 2025-09-27T09:36:04.682Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/xai.md](https://docs.livekit.io/agents/integrations/llm/xai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).