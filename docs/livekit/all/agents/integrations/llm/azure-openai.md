LiveKit Docs › Integration guides › Large language models (LLM) › Azure OpenAI

---

# Azure OpenAI LLM integration guide

> How to use the Azure OpenAI LLM plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) provides access to OpenAI's powerful language models like `gpt-4o` and `o1` through Azure's managed service. With LiveKit's Azure OpenAI integration and the Agents framework, you can build sophisticated voice AI applications using their industry-leading models.

> ℹ️ **Note**
> 
> Using the OpenAI platform instead of Azure? See our [OpenAI LLM integration guide](https://docs.livekit.io/agents/integrations/llm/openai.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin:

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

The Azure OpenAI plugin requires either an [Azure OpenAI API key](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource) or a Microsoft Entra ID token.

Set the following environment variables in your `.env` file:

- `AZURE_OPENAI_API_KEY` or `AZURE_OPENAI_ENTRA_TOKEN`
- `AZURE_OPENAI_ENDPOINT`
- `OPENAI_API_VERSION`

### Usage

Use Azure OpenAI within an `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_azure(
        azure_deployment="<model-deployment>",
        azure_endpoint="https://<endpoint>.openai.azure.com/", # or AZURE_OPENAI_ENDPOINT
        api_key="<api-key>", # or AZURE_OPENAI_API_KEY
        api_version="2024-10-01-preview", # or OPENAI_API_VERSION
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    llm: openai.LLM.withAzure({
        azureDeployment: "<model-deployment>",
        azureEndpoint: "https://<endpoint>.openai.azure.com/", // or AZURE_OPENAI_ENDPOINT
        apiKey: "<api-key>", // or AZURE_OPENAI_API_KEY
        apiVersion: "2024-10-01-preview", // or OPENAI_API_VERSION
    }),
    // ... tts, stt, vad, turn_detection, etc.
});

```

### Parameters

This section describes the Azure-specific parameters. For a complete list of all available parameters, see the plugin reference links in the [Additional resources](#additional-resources) section.

- **`azure_deployment`** _(string)_: Name of your model deployment.

- **`entra_token`** _(string)_ (optional): Microsoft Entra ID authentication token. Required if not using API key authentication. To learn more see Azure's [Authentication](https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-reference#authentication) documentation.

- **`temperature`** _(float)_ (optional) - Default: `0.1`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

Valid values are between `0` and `2`.

- **`parallel_tool_calls`** _(bool)_ (optional): Controls whether the model can make multiple tool calls in parallel. When enabled, the model can make multiple tool calls simultaneously, which can improve performance for complex tasks.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. Set to 'auto' to let the model decide, 'required' to force tool usage, or 'none' to disable tool usage.

## Additional resources

The following links provide more information about the Azure OpenAI LLM plugin.

- **[Azure OpenAI docs](https://learn.microsoft.com/en-us/azure/ai-services/openai/)**: Azure OpenAI service documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Azure OpenAI.

- **[Azure ecosystem overview](https://docs.livekit.io/agents/integrations/azure.md)**: Overview of the entire Azure AI ecosystem and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:00.448Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/azure-openai.md](https://docs.livekit.io/agents/integrations/llm/azure-openai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).