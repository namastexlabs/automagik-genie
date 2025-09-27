LiveKit Docs › Partner spotlight › Google › Overview

---

# Google AI and LiveKit

> Build world-class realtime AI apps with Google AI and LiveKit Agents.

## Google AI ecosystem support

[Google AI](https://ai.google.dev/) provides some of the most powerful AI models and services today, which integrate into LiveKit Agents in the following ways:

- **Gemini**: A family of general purpose high-performance LLMs.
- **Gemini TTS**: A speech synthesis model that generates customizable speech from text.
- **Google Cloud STT and TTS**: Affordable, production-grade models for transcription and speech synthesis.
- **Gemini Live API**: A speech-to-speech realtime model with live video input.

LiveKit Agents supports Google AI through the [Gemini API](https://ai.google.dev/gemini-api) and [Vertex AI](https://cloud.google.com/vertex-ai).

## Getting started

Use the Voice AI quickstart to build a voice AI app with Gemini. Select an STT-LLM-TTS pipeline model type and add the following components to build on Gemini.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build your first voice AI app with Google Gemini.

Install the Google plugin:

```shell
pip install "livekit-agents[google]~=1.2"

```

Add your Google API key to your `.env.` file:

** Filename: `.env`**

```shell
GOOGLE_API_KEY=<your-google-api-key>

```

Use the Google LLM component to initialize your `AgentSession`:

** Filename: `agent.py`**

```python
from livekit.plugins import google

# ...

# in your entrypoint function
session = AgentSession(
    llm=google.LLM(
        model="gemini-2.0-flash",
    ),
    # ... stt, tts,vad, turn_detection, etc.
)

```

## LiveKit Agents overview

LiveKit Agents is an open source framework for building realtime AI apps in Python and Node.js. It supports complex voice AI [workflows](https://docs.livekit.io/agents/build/workflows.md) with multiple agents and discrete processing steps, and includes built-in load balancing.

LiveKit provides SIP support for [telephony integration](https://docs.livekit.io/agents/start/telephony.md) and full-featured [frontend SDKs](https://docs.livekit.io/agents/start/frontend.md) in multiple languages. It uses [WebRTC](https://docs.livekit.io/home/get-started/intro-to-livekit.md#what-is-webrtc) transport for end-user devices, enabling high-quality, low-latency realtime experiences. To learn more, see [LiveKit Agents](https://docs.livekit.io/agents.md).

## Google plugin documentation

The following links provide more information on each available Google component in LiveKit Agents.

- **[Gemini LLM](https://docs.livekit.io/agents/integrations/llm/gemini.md)**: LiveKit Agents docs for Google Gemini models.

- **[Gemini TTS](https://docs.livekit.io/agents/integrations/tts/gemini.md)**: LiveKit Agents docs for Gemini TTS.

- **[Gemini Live API](https://docs.livekit.io/agents/integrations/realtime/gemini.md)**: LiveKit Agents docs for the Gemini Live API.

- **[Google Cloud STT](https://docs.livekit.io/agents/integrations/stt/google.md)**: LiveKit Agents docs for Google Cloud STT.

- **[Google Cloud TTS](https://docs.livekit.io/agents/integrations/tts/google.md)**: LiveKit Agents docs for Google Cloud TTS.

---

This document was rendered at 2025-09-27T09:35:58.731Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/google.md](https://docs.livekit.io/agents/integrations/google.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).