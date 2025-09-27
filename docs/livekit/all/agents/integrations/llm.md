LiveKit Docs › Integration guides › Large language models (LLM) › Overview

---

# Large language model (LLM) integrations

> Guides for adding LLM integrations to your agents.

## Overview

Large language models (LLMs) are a type of AI model that can generate text output from text input. In voice AI apps, they fit between speech-to-text (STT) and text-to-speech (TTS) and are responsible for tool calls and generating the agent's text response.

## Available providers

The agents framework includes plugins for the following LLM providers out-of-the-box. Choose a provider from the list below for a step-by-step guide. You can also implement the [LLM node](https://docs.livekit.io/agents/build/nodes.md#llm_node) to provide custom behavior or an alternative provider. All providers support high-performance, low-latency streaming and tool calls. Support for other features is noted in the following table.

| Provider | Plugin | Notes | Available in |
| -------- | ------ | ----- | ------------ |
| [Anthropic](https://docs.livekit.io/agents/integrations/llm/anthropic.md) | `anthropic` | Claude family of models. | Python |
| [Amazon Bedrock](https://docs.livekit.io/agents/integrations/llm/aws.md) | `aws` | Wide range of models from Llama, DeepSeek, Mistral, and more. | Python |
| [Baseten](https://docs.livekit.io/agents/integrations/llm/baseten.md) | `baseten` |  | Python |
| [Cerebras](https://docs.livekit.io/agents/integrations/llm/cerebras.md) | `openai` | Models from Llama and DeepSeek. | Python, Nodejs |
| [DeepSeek](https://docs.livekit.io/agents/integrations/llm/deepseek.md) | `openai` |  | Python, Nodejs |
| [Fireworks](https://docs.livekit.io/agents/integrations/llm/fireworks.md) | `openai` | Wide range of models from Llama, DeepSeek, Mistral, and more. | Python, Nodejs |
| [Google Gemini](https://docs.livekit.io/agents/integrations/llm/gemini.md) | `google` |  | Python, Nodejs |
| [Groq](https://docs.livekit.io/agents/integrations/llm/groq.md) | `groq` | Models from Llama, DeepSeek, and more. | Python |
| [LangChain](https://docs.livekit.io/agents/integrations/llm/langchain.md) | `langchain` | Use a LangGraph workflow for your agent LLM. | Python |
| [Letta](https://docs.livekit.io/agents/integrations/llm/letta.md) | `openai` | Stateful API with memory features. | Python |
| [Mistral AI](https://docs.livekit.io/agents/integrations/llm/mistralai.md) | `mistralai` | Mistral family of models (for use with La Plateforme). | Python |
| [Ollama](https://docs.livekit.io/agents/integrations/llm/ollama.md) | `openai` | Self-hosted models from Llama, DeepSeek, and more. | Python |
| [OpenAI](https://docs.livekit.io/agents/integrations/llm/openai.md) | `openai` |  | Python, Nodejs |
| [Azure OpenAI](https://docs.livekit.io/agents/integrations/llm/azure-openai.md) | `openai` |  | Python, Nodejs |
| [Perplexity](https://docs.livekit.io/agents/integrations/llm/perplexity.md) | `openai` |  | Python, Nodejs |
| [Telnyx](https://docs.livekit.io/agents/integrations/llm/telnyx.md) | `openai` | Models from Llama, DeepSeek, OpenAI, and Mistral, and more. | Python, Nodejs |
| [Together AI](https://docs.livekit.io/agents/integrations/llm/together.md) | `openai` | Models from Llama, DeepSeek, Mistral, and more. | Python, Nodejs |
| [xAI](https://docs.livekit.io/agents/integrations/llm/xai.md) | `openai` | Grok family of models. | Python, Nodejs |

Have another provider in mind? LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/integrations.md#contribute).

> ℹ️ **Realtime models**
> 
> Realtime models like the OpenAI Realtime API, Gemini Live, and Amazon Nova Sonic are capable of consuming and producing speech directly. LiveKit Agents supports them as an alternative to using an LLM plugin, without the need for STT and TTS. To learn more, see [Realtime models](https://docs.livekit.io/agents/integrations/realtime.md).

## How to use

The following sections describe high-level usage only.

For more detailed information about installing and using plugins, see the [plugins overview](https://docs.livekit.io/agents/integrations.md#install).

### Usage in `AgentSession`

Construct an `AgentSession` or `Agent` with an `LLM` instance created by your desired plugin:

```python
from livekit.agents import AgentSession
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM(model="gpt-4o-mini")
)

```

### Standalone usage

You can also use an `LLM` instance in a standalone fashion with its simple streaming interface. It expects a `ChatContext` object, which contains the conversation history. The return value is a stream of `ChatChunk`s. This interface is the same across all LLM providers, regardless of their underlying API design:

```python
from livekit.agents import ChatContext
from livekit.plugins import openai

llm = openai.LLM(model="gpt-4o-mini")
    
chat_ctx = ChatContext()
chat_ctx.add_message(role="user", content="Hello, this is a test message!")
    
async with llm.chat(chat_ctx=chat_ctx) as stream:
    async for chunk in stream:
        print("Received chunk:", chunk.delta)

```

### Tool usage

All LLM providers support tools (sometimes called "functions"). LiveKit Agents has full support for them within an `AgentSession`. For more information, see [Tool definition and use](https://docs.livekit.io/agents/build/tools.md).

### Vision usage

All LLM providers support vision within most of their models. LiveKit agents supports vision input from URL or from [realtime video frames](https://docs.livekit.io/home/client/tracks.md). Consult your model provider for details on compatible image types, external URL support, and other constraints. For more information, see [Vision](https://docs.livekit.io/agents/build/vision.md).

## Further reading

- **[Workflows](https://docs.livekit.io/agents/build/workflows.md)**: How to model repeatable, accurate tasks with multiple agents.

- **[Tool definition and usage](https://docs.livekit.io/agents/build/tools.md)**: Let your agents call external tools and more.

---

This document was rendered at 2025-09-27T09:35:59.577Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm.md](https://docs.livekit.io/agents/integrations/llm.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).