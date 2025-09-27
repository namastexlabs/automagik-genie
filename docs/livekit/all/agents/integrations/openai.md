LiveKit Docs › Partner spotlight › OpenAI › Overview

---

# OpenAI and LiveKit

> Build world-class realtime AI apps with OpenAI and LiveKit Agents.

## OpenAI ecosystem support

[OpenAI](https://openai.com/) provides some of the most powerful AI models and services today, which integrate into LiveKit Agents in the following ways:

- **Realtime API**: The original production-grade speech-to-speech model. Build lifelike voice assistants with just one model.
- **GPT 4o, o1-mini, and more**: Smart and creative models for voice AI.
- **STT models**: From industry-standard `whisper-1` to leading-edge `gpt-4o-transcribe`.
- **TTS models**: Use OpenAI's latest `gpt-4o-mini-tts` to generate lifelike speech in a voice pipeline.

LiveKit Agents supports OpenAI models through the [OpenAI developer platform](https://platform.openai.com/) as well as [Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/overview). See the [Azure AI integration guide](https://docs.livekit.io/agents/integrations/azure.md) for more information on Azure OpenAI.

## Getting started

Use the following guide to speak to your own OpenAI-powered voice AI agent in less than 10 minutes.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build your first voice AI app with the OpenAI Realtime API or GPT-4o.

- **[Realtime playground](https://playground.livekit.io)**: Experiment with the OpenAI Realtime API and personalities like the **Snarky Teenager** or **Opera Singer**.

## LiveKit Agents overview

LiveKit Agents is an open source framework for building realtime AI apps in Python and Node.js. It supports complex voice AI [workflows](https://docs.livekit.io/agents/build/workflows.md) with multiple agents and discrete processing steps, and includes built-in load balancing.

LiveKit provides SIP support for [telephony integration](https://docs.livekit.io/agents/start/telephony.md) and full-featured [frontend SDKs](https://docs.livekit.io/agents/start/frontend.md) in multiple languages. It uses [WebRTC](https://docs.livekit.io/home/get-started/intro-to-livekit.md#what-is-webrtc) transport for end-user devices, enabling high-quality, low-latency realtime experiences. To learn more, see [LiveKit Agents](https://docs.livekit.io/agents.md).

## Realtime API

LiveKit Agents serves as a bridge between your frontend — connected over WebRTC — and the OpenAI Realtime API — connected over WebSockets. LiveKit automatically converts Realtime API audio response buffers to WebRTC audio streams synchronized with text, and handles business logic like interruption handling automatically. You can add your own logic within your agent, and use LiveKit features for realtime state and data to coordinate with your frontend.

Additional benefits of LiveKit Agents for the Realtime API include:

- **Noise cancellation**: One line of code to remove background noise and speakers from your input audio.
- **Telephony**: Inbound and outbound calling using SIP trunks.
- **Interruption handling**: Automatically handles context truncation on interruption.
- **Transcription sync**: Realtime API text output is synced to audio playback automatically.

```mermaid
graph LR
client[App/Phone] <==LiveKit WebRTC==> agents[Agent]
agents <==WebSocket==> rtapi[Realtime API]client <-.Realtime voice.-> agents
agents -.Synced text.-> client
agents <-.Forwarded tools.-> clientagents <-."Voice buffer".-> rtapi
rtapi -."Transcriptions".-> agents
rtapi <-."Tool calls".-> agents
```

- **[Realtime API quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Use the Voice AI quickstart with the Realtime API to get up and running in less than 10 minutes.

- **[Web and mobile frontends](https://docs.livekit.io/agents/start/frontend.md)**: Put your agent in your pocket with a custom web or mobile app.

- **[Telephony integration](https://docs.livekit.io/agents/start/telephony.md)**: Your agent can place and receive calls with LiveKit's SIP integration.

- **[Building voice agents](https://docs.livekit.io/agents/build.md)**: Comprehensive documentation to build advanced voice AI apps with LiveKit.

- **[Recipes](https://docs.livekit.io/recipes.md)**: Get inspired by LiveKit's collection of recipes and example apps.

## OpenAI plugin documentation

The following links provide more information on each available OpenAI component in LiveKit Agents.

- **[Realtime API](https://docs.livekit.io/agents/integrations/realtime/openai.md)**: LiveKit Agents docs for the OpenAI Realtime API.

- **[OpenAI Models](https://docs.livekit.io/agents/integrations/llm/openai.md)**: LiveKit Agents docs for `gpt-4o`, `o1-mini`, and other OpenAI LLMs.

- **[OpenAI STT](https://docs.livekit.io/agents/integrations/stt/openai.md)**: LiveKit Agents docs for `whisper-1`, `gpt-4o-transcribe`, and other OpenAI STT models.

- **[OpenAI TTS](https://docs.livekit.io/agents/integrations/tts/openai.md)**: LiveKit Agents docs for `tts-1`, `gpt-4o-mini-tts`, and other OpenAI TTS models.

---

This document was rendered at 2025-09-27T09:36:04.957Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/openai.md](https://docs.livekit.io/agents/integrations/openai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).