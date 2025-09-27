LiveKit Docs › Integration guides › Realtime models › Azure OpenAI Realtime API

---

# Azure OpenAI Realtime API and LiveKit

> How to use the Azure OpenAI Realtime API with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/) provides an implementation of OpenAI's Realtime API that enables low-latency, multimodal interactions with realtime audio and text processing through Azure's managed service. Use LiveKit's Azure OpenAI plugin to create an agent that uses the Realtime API.

> ℹ️ **Note**
> 
> Using the OpenAI platform instead of Azure? See our [OpenAI Realtime API guide](https://docs.livekit.io/agents/integrations/realtime/openai.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the OpenAI plugin from PyPI:

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

The Azure OpenAI plugin requires an [Azure OpenAI API key](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource) and your Azure OpenAI endpoint.

Set the following environment variables in your `.env` file:

```bash
AZURE_OPENAI_API_KEY=<your-azure-openai-api-key>
AZURE_OPENAI_ENDPOINT=<your-azure-openai-endpoint>
OPENAI_API_VERSION=2024-10-01-preview

```

### Usage

Use the Azure OpenAI Realtime API within an `AgentSession`:

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.realtime.RealtimeModel.with_azure(
        azure_deployment="<model-deployment>",
        azure_endpoint="wss://<endpoint>.openai.azure.com/",
        api_key="<api-key>",
        api_version="2024-10-01-preview",
    ),
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    llm: openai.realtime.RealtimeModel.withAzure({
        azureDeployment: "<model-deployment>",
        azureEndpoint: "wss://<endpoint>.openai.azure.com/",
        apiKey: "<api-key>",
        apiVersion: "2024-10-01-preview",
    }),
});

```

For a more comprehensive agent example, see the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

### Parameters

This section describes the Azure-specific parameters. For a complete list of all available parameters, see the plugin reference links in the [Additional resources](#additional-resources) section.

- **`azure_deployment`** _(string)_: Name of your model deployment.

- **`entra_token`** _(string)_ (optional): Microsoft Entra ID authentication token. Required if not using API key authentication. To learn more see Azure's [Authentication](https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-reference#authentication) documentation.

- **`voice`** _(string)_ (optional) - Default: `alloy`: Voice to use for speech. To learn more, see [Voice options](https://platform.openai.com/docs/guides/text-to-speech#voice-options).

- **`temperature`** _(float)_ (optional) - Default: `1.0`: Controls the randomness of the model's output. Higher values, for example 0.8, make the output more random, while lower values, for example 0.2, make it more focused and deterministic.

To learn more, see [chat completions](https://platform.openai.com/docs/api-reference/chat/create#chat-create-temperature).

- **`instructions`** _(string)_ (optional) - Default: ``: Initial system instructions.

- **`modalities`** _(list[api_proto.Modality])_ (optional) - Default: `["text", "audio"]`: Modalities to use, such as ["text", "audio"]. Set to `["text"]` to use the model in text-only mode with a [separate TTS plugin](#separate-tts).

- **`turn_detection`** _(TurnDetection | None)_ (optional): Configuration for turn detection, see the section on [Turn detection](#turn-detection) for more information.

## Turn detection

The Azure OpenAI Realtime API includes [voice activity detection (VAD)](https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-reference#realtimeturndetection) to automatically detect when a user has started or stopped speaking. This feature is enabled by default

There is one supported mode for VAD:

- **Server VAD** (default) - Uses periods of silence to automatically chunk the audio

### Server VAD

Server VAD is the default mode and can be configured with the following properties:

**Python**:

```python
from livekit.plugins.openai import realtime
from openai.types.beta.realtime.session import TurnDetection

session = AgentSession(
    llm=realtime.RealtimeModel(
        turn_detection=TurnDetection(
            type="server_vad",
            threshold=0.5,
            prefix_padding_ms=300,
            silence_duration_ms=500,
            create_response=True,
            interrupt_response=True,
        )
    ),
    # ... vad, tts, stt, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';
import * as livekit from '@livekit/agents-plugin-livekit';

const session = new voice.AgentSession({
    llm: new openai.realtime.RealtimeModel(
        turnDetection: null,
    ),
    turnDetection: new livekit.turnDetector.EnglishModel(),
    // ... vad, tts, stt, etc.
});

```

- `threshold`: Higher values require louder audio to activate, better for noisy environments.
- `prefix_padding_ms`: Amount of audio to include before detected speech.
- `silence_duration_ms`: Duration of silence to detect speech stop (shorter = faster turn detection).

## Usage with separate TTS

To use the Azure OpenAI Realtime API with a different [TTS provider](https://docs.livekit.io/agents/integrations/tts.md), configure it with a text-only response modality and include a TTS plugin in your `AgentSession` configuration. This configuration allows you to gain the benefits of direct speech understanding while maintaining complete control over the speech output.

**Python**:

```python
session = AgentSession(
    llm=openai.realtime.RealtimeModel.with_azure(
        # ... endpoint and auth params ...,
        modalities=["text"]
    ),
    tts=cartesia.TTS() # Or other TTS plugin of your choice
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';
import * as cartesia from '@livekit/agents-plugin-cartesia';

const session = new voice.AgentSession({
    llm: openai.realtime.RealtimeModel.withAzure({
        // ... endpoint and auth params ...,
        modalities: ["text"]
    }),
    tts: cartesia.TTS(), // Or other TTS plugin of your choice
});

```

## Loading conversation history

If you load conversation history into the model, it might respond with text output even if configured for audio response. To work around this issue, use the model [with a separate TTS plugin](#separate-tts) and text-only response modality. You can use the [Azure OpenAI TTS plugin](https://docs.livekit.io/agents/integrations/tts/azure-openai.md) to continue using the same voices supported by the Realtime API.

For additional workaround options, see the OpenAI [thread](https://community.openai.com/t/trouble-loading-previous-messages-with-realtime-api) on this topic.

## Additional resources

The following resources provide more information about using Azure OpenAI with LiveKit Agents.

- **[Azure OpenAI docs](https://learn.microsoft.com/en-us/azure/ai-services/openai/)**: Azure OpenAI service documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Azure OpenAI.

- **[Azure ecosystem overview](https://docs.livekit.io/agents/integrations/azure.md)**: Overview of the entire Azure AI ecosystem and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:05.506Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/realtime/azure-openai.md](https://docs.livekit.io/agents/integrations/realtime/azure-openai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).