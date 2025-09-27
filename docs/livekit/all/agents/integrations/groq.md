LiveKit Docs › Partner spotlight › Groq › Overview

---

# Groq and LiveKit

> Ship lightning-fast voice AI with Groq and LiveKit Agents.

## Groq ecosystem support

[Groq](https://groq.com/) provides fast AI inference in the cloud and on-prem AI compute centers. LiveKit Agents can integrate with the following Groq services:

- **STT**: Fast and cost-effective English or multilingual transcription based on `whisper-large-v3`.
- **TTS**: Fast English and Arabic text-to-speech based on `playai-tts`.
- **LLM**: Fast inference for open models like `llama-3.1-8b-instant` and more.

## Getting started

Use the Voice AI quickstart to build a voice AI app with Groq. Select an STT-LLM-TTS pipeline model type and add the following components to build on Groq.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build your first voice AI app with Groq.

Install the Groq plugin:

```shell
pip install "livekit-agents[groq]~=1.2"

```

Add your Groq API key to your `.env.` file:

** Filename: `.env`**

```shell
GROQ_API_KEY=<Your Groq API Key>

```

Use Groq components to initialize your `AgentSession`:

** Filename: `agent.py`**

```python
from livekit.plugins import groq

# ...

# in your entrypoint function
session = AgentSession(
    stt=groq.STT(
        model="whisper-large-v3-turbo",
        language="en",
    ),
    llm=groq.LLM(
        model="llama3-8b-8192"
    ),
    tts=groq.TTS(
      model="playai-tts",
      voice="Arista-PlayAI",
    ),
    # ... vad, turn_detection, etc.
)

```

## LiveKit Agents overview

LiveKit Agents is an open source framework for building realtime AI apps in Python and Node.js. It supports complex voice AI [workflows](https://docs.livekit.io/agents/build/workflows.md) with multiple agents and discrete processing steps, and includes built-in load balancing.

LiveKit provides SIP support for [telephony integration](https://docs.livekit.io/agents/start/telephony.md) and full-featured [frontend SDKs](https://docs.livekit.io/agents/start/frontend.md) in multiple languages. It uses [WebRTC](https://docs.livekit.io/home/get-started/intro-to-livekit.md#what-is-webrtc) transport for end-user devices, enabling high-quality, low-latency realtime experiences. To learn more, see [LiveKit Agents](https://docs.livekit.io/agents.md).

## Groq plugin documentation

The following links provide more information on each available Groq component in LiveKit Agents.

- **[Groq STT](https://docs.livekit.io/agents/integrations/stt/groq.md)**: LiveKit Agents docs for Groq transcription models.

- **[Groq TTS](https://docs.livekit.io/agents/integrations/tts/groq.md)**: LiveKit Agents docs for Groq speech models.

- **[Groq LLM](https://docs.livekit.io/agents/integrations/llm/groq.md)**: LiveKit Agents docs for Groq LLM models including Llama 3, DeepSeek, and more.

---

This document was rendered at 2025-09-27T09:35:59.010Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/groq.md](https://docs.livekit.io/agents/integrations/groq.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).