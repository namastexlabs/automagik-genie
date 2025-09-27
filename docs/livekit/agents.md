LiveKit Docs › Getting started › Introduction

---

# LiveKit Agents

> Realtime framework for production-grade multimodal and voice AI agents.

## Introduction

The Agents framework allows you to add a Python or Node.js program to any LiveKit room as a full realtime participant. It's primarily an SDK that includes a complete set of tools and abstractions that make it easy to feed realtime media and data through an AI pipeline that works with any provider, and to publish realtime results back to the room.

While the framework excels at AI-powered voice agents, it's designed to support any type of programmatic participant. You can deploy custom logic that processes realtime audio, video, and data streams, making it suitable for a wide range of applications beyond traditional AI agents. To learn more about this use case, see [Worker lifecycle](https://docs.livekit.io/agents/worker.md).

You can deploy your agents to [LiveKit Cloud](https://docs.livekit.io/agents/ops/deployment.md) or any other [custom environment](https://docs.livekit.io/agents/ops/deployment/custom.md) of your choice.

If you want to get your hands on the code for building an agent right away, follow the Voice AI quickstart guide. It takes just a few minutes to build your first voice agent.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build and deploy a simple voice assistant with Python in less than 10 minutes.

- **[Deeplearning.ai course](https://www.deeplearning.ai/short-courses/building-ai-voice-agents-for-production/)**: Learn to build and deploy voice agents with LiveKit in this free course from Deeplearning.ai.

- **[Deploying to LiveKit Cloud](https://docs.livekit.io/agents/ops/deployment.md)**: Run your agent on LiveKit Cloud's global infrastructure.

- **[GitHub repository](https://github.com/livekit/agents)**: Python source code and examples for the LiveKit Agents SDK.

- **[SDK reference](https://docs.livekit.io/reference/python/v1/livekit/agents/index.html.md)**: Python reference docs for the LiveKit Agents SDK.

## Use cases

Some applications for agents include:

- **Multimodal assistant**: Talk, text, or screen share with an AI assistant.
- **Telehealth**: Bring AI into realtime telemedicine consultations, with or without humans in the loop.
- **Call center**: Deploy AI to the front lines of customer service with inbound and outbound call support.
- **Realtime translation**: Translate conversations in realtime.
- **NPCs**: Add lifelike NPCs backed by language models instead of static scripts.
- **Robotics**: Put your robot's brain in the cloud, giving it access to the most powerful models.

The following [recipes](https://docs.livekit.io/recipes.md) demonstrate some of these use cases:

- **[Medical Office Triage](https://github.com/livekit-examples/python-agents-examples/tree/main/complex-agents/medical_office_triage)**: Agent that triages patients based on symptoms and medical history.

- **[Restaurant Agent](https://github.com/livekit/agents/blob/main/examples/voice_agents/restaurant_agent.py)**: A restaurant front-of-house agent that can take orders, add items to a shared cart, and checkout.

- **[Company Directory](https://docs.livekit.io/recipes/company-directory.md)**: Build a AI company directory agent. The agent can respond to DTMF tones and voice prompts, then redirect callers.

- **[Pipeline Translator](https://github.com/livekit-examples/python-agents-examples/tree/main/translators/pipeline_translator.py)**: Implement translation in the processing pipeline.

## Framework overview

![Diagram showing framework overview.](/images/agents/framework-overview.svg)

Your agent code operates as a stateful, realtime bridge between powerful AI models and your users. While AI models typically run in data centers with reliable connectivity, users often connect from mobile networks with varying quality.

WebRTC ensures smooth communication between agents and users, even over unstable connections. LiveKit WebRTC is used between the frontend and the agent, while the agent communicates with your backend using HTTP and WebSockets. This setup provides the benefits of WebRTC without its typical complexity.

The agents SDK includes components for handling the core challenges of realtime voice AI, such as streaming audio through an STT-LLM-TTS pipeline, reliable turn detection, handling interruptions, and LLM orchestration. It supports plugins for most major AI providers, with more continually added. The framework is fully open source and supported by an active community.

Other framework features include:

- **Voice, video, and text**: Build agents that can process realtime input and produce output in any modality.
- **Tool use**: Define tools that are compatible with any LLM, and even forward tool calls to your frontend.
- **Multi-agent handoff**: Break down complex workflows into simpler tasks.
- **Extensive integrations**: Integrate with nearly every AI provider there is for LLMs, STT, TTS, and more.
- **State-of-the-art turn detection**: Use the custom turn detection model for lifelike conversation flow.
- **Made for developers**: Build your agents in code, not configuration.
- **Production ready**: Includes built-in worker orchestration, load balancing, and Kubernetes compatibility.
- **Open source**: The framework and entire LiveKit ecosystem are open source under the Apache 2.0 license.

## How agents connect to LiveKit

![Diagram showing a high-level view of how agents work.](/images/agents/agents-jobs-overview.svg)

When your agent code starts, it first registers with a LiveKit server (either [self hosted](https://docs.livekit.io/home/self-hosting/deployment.md) or [LiveKit Cloud](https://cloud.livekit.io)) to run as a "worker" process. The worker waits until it receives a dispatch request. To fulfill this request, the worker boots a "job" subprocess which joins the room. By default, your workers are dispatched to each new room created in your LiveKit Cloud project (or self-hosted server). To learn more about workers, see the [Worker lifecycle](https://docs.livekit.io/agents/worker.md) guide.

After your agent and user join a room, the agent and your frontend app can communicate using LiveKit WebRTC. This enables reliable and fast realtime communication in any network conditions. LiveKit also includes full support for telephony, so the user can join the call from a phone instead of a frontend app.

To learn more about how LiveKit works overall, see the [Intro to LiveKit](https://docs.livekit.io/home/get-started/intro-to-livekit.md) guide.

## Getting started

Follow these guides to learn more and get started with LiveKit Agents.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build a simple voice assistant with Python in less than 10 minutes.

- **[Recipes](https://docs.livekit.io/recipes.md)**: A comprehensive collection of examples, guides, and recipes for LiveKit Agents.

- **[Intro to LiveKit](https://docs.livekit.io/home/get-started/intro-to-livekit.md)**: An overview of the LiveKit ecosystem.

- **[Web and mobile frontends](https://docs.livekit.io/agents/start/frontend.md)**: Put your agent in your pocket with a custom web or mobile app.

- **[Telephony integration](https://docs.livekit.io/agents/start/telephony.md)**: Your agent can place and receive calls with LiveKit's SIP integration.

- **[Building voice agents](https://docs.livekit.io/agents/build.md)**: Comprehensive documentation to build advanced voice AI apps with LiveKit.

- **[Worker lifecycle](https://docs.livekit.io/agents/worker.md)**: Learn how to manage your agents with workers and jobs.

- **[Deploying to production](https://docs.livekit.io/agents/ops/deployment.md)**: Guide to deploying your voice agent in a production environment.

- **[Integration guides](https://docs.livekit.io/agents/integrations.md)**: Explore the full list of AI providers available for LiveKit Agents.

---

This document was rendered at 2025-09-27T09:35:51.209Z.
For the latest version of this document, see [https://docs.livekit.io/agents.md](https://docs.livekit.io/agents.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).