LiveKit Docs › Integration guides › Large language models (LLM) › OpenAI

---

# OpenAI LLM integration guide

> How to use the OpenAI LLM plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[OpenAI](https://openai.com/) provides powerful language models like `gpt-4o` and `o1`. With LiveKit's OpenAI integration and the Agents framework, you can build sophisticated voice AI applications using their industry-leading models.

> 💡 **Using Azure OpenAI?**
> 
> See our [Azure OpenAI LLM guide](https://docs.livekit.io/agents/integrations/llm/azure-openai.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

**Python**:

```bash
pip install "livekit-agents[openai]~=1.2"

```

---

**Node.js**:

```bash
pnpm add @livekit/agents-plugin-openai@1.x

```

### Authentication

The OpenAI plugin requires an [OpenAI API key](https://platform.openai.com/api-keys).

Set `OPENAI_API_KEY` in your `.env` file.

### Usage

Use OpenAI within an `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM(
        model="gpt-4o-mini"
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    llm: openai.LLM(
        model: "gpt-4o-mini"
    ),
    // ... tts, stt, vad, turn_detection, etc.
});

```

### Parameters

This section describes some of the available parameters. See the plugin reference links in the [Additional resources](#additional-resources) section for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `gpt-4o-mini`: The model to use for the LLM. For more information, see the [OpenAI documentation](https://platform.openai.com/docs/models).

- **`temperature`** _(float)_ (optional) - Default: `0.8`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

Valid values are between `0` and `2`.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. Set to 'auto' to let the model decide, 'required' to force tool usage, or 'none' to disable tool usage.

## Additional resources

The following resources provide more information about using OpenAI with LiveKit Agents.

- **[OpenAI docs](https://platform.openai.com/docs)**: OpenAI platform documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and OpenAI.

- **[OpenAI ecosystem overview](https://docs.livekit.io/agents/integrations/openai.md)**: Overview of the entire OpenAI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:03.590Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/openai.md](https://docs.livekit.io/agents/integrations/llm/openai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).