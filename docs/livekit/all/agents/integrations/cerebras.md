LiveKit Docs › Partner spotlight › Cerebras

---

# Cerebras and LiveKit

> Build voice AI on the world's fastest inference.

## Cerebras ecosystem support

[Cerebras](https://cerebras.ai/) provides high-throughput, low-latency AI inference for open models like Llama and DeepSeek. Cerebras is an OpenAI-compatible LLM provider and LiveKit Agents provides full support for Cerebras inference via the OpenAI plugin.

## Getting started

Use the Voice AI quickstart to build a voice AI app with Cerebras. Select an STT-LLM-TTS pipeline model type and add the following components to build on Cerebras.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build your first voice AI app with Cerebras.

Install the OpenAI plugin:

```shell
pip install "livekit-agents[openai]~=1.2"

```

Add your Cerebras API key to your `.env` file:

** Filename: `.env`**

```shell
CEREBRAS_API_KEY=<your-cerebras-api-key>

```

Use the Cerebras LLM to initialize your `AgentSession`:

** Filename: `agent.py`**

```python
from livekit.plugins import openai

# ...

# in your entrypoint function
session = AgentSession(
    llm=openai.LLM.with_cerebras(
        model="llama-3.3-70b",
    ),
)

```

For a full list of supported models, including DeepSeek, see the [Cerebras docs](https://inference-docs.cerebras.ai/introduction).

## LiveKit Agents overview

LiveKit Agents is an open source framework for building realtime AI apps in Python and Node.js. It supports complex voice AI [workflows](https://docs.livekit.io/agents/build/workflows.md) with multiple agents and discrete processing steps, and includes built-in load balancing.

LiveKit provides SIP support for [telephony integration](https://docs.livekit.io/agents/start/telephony.md) and full-featured [frontend SDKs](https://docs.livekit.io/agents/start/frontend.md) in multiple languages. It uses [WebRTC](https://docs.livekit.io/home/get-started/intro-to-livekit.md#what-is-webrtc) transport for end-user devices, enabling high-quality, low-latency realtime experiences. To learn more, see [LiveKit Agents](https://docs.livekit.io/agents.md).

## Further reading

More information about integrating Llama is available in the following article:

- **[Cerebras integration guide](https://docs.livekit.io/agents/integrations/llm/cerebras.md)**: LiveKit docs on Cerebras integration.

---

This document was rendered at 2025-09-27T09:35:58.437Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/cerebras.md](https://docs.livekit.io/agents/integrations/cerebras.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).