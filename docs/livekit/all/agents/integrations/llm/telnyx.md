LiveKit Docs › Integration guides › Large language models (LLM) › Telnyx

---

# Telnyx LLM integration guide

> How to use Telnyx inference with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Telnyx](https://telnyx.com/) provides access to Llama 3.1 and other models through their inference API. These models are multilingual and text-only, making them suitable for a variety of agent applications.

## Usage

Install the OpenAI plugin to add Telnyx support:

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
TELNYX_API_KEY=<your-telnyx-api-key>

```

Create a Telnyx LLM using the `with_telnyx` method:

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_telnyx(
        model="meta-llama/Meta-Llama-3.1-70B-Instruct",
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    llm: openai.LLM.withTelnyx({
        model: "meta-llama/Meta-Llama-3.1-70B-Instruct",
    }),
    // ... tts, stt, vad, turn_detection, etc.
});

```

## Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the plugin reference links in the [Additional resources](#additional-resources) section.

- **`model`** _(str | TelnyxChatModels)_ (optional) - Default: `meta-llama/Meta-Llama-3.1-70B-Instruct`: Model to use for inference. To learn more, see [supported models](https://developers.telnyx.com/docs/inference/getting-started#models).

- **`temperature`** _(float)_ (optional) - Default: `0.1`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

Valid values are between `0` and `2`.

- **`parallel_tool_calls`** _(bool)_ (optional): Controls whether the model can make multiple tool calls in parallel. When enabled, the model can make multiple tool calls simultaneously, which can improve performance for complex tasks.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. Set to 'auto' to let the model decide, 'required' to force tool usage, or 'none' to disable tool usage.

## Additional resources

The following links provide more information about the Telnyx LLM integration.

- **[Telnyx docs](https://developers.telnyx.com/docs/inference/getting-started)**: Telnyx API documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Telnyx.

---

This document was rendered at 2025-09-27T09:36:04.135Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/telnyx.md](https://docs.livekit.io/agents/integrations/llm/telnyx.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).