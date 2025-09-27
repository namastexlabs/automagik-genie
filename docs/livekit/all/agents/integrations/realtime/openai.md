LiveKit Docs › Integration guides › Realtime models › OpenAI Realtime API

---

# OpenAI Realtime API integration guide

> How to use the OpenAI Realtime API with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

- **[OpenAI Playground](https://playground.livekit.io/)**: Experiment with OpenAI's Realtime API in the playground with personalities like the **Snarky Teenager** or **Opera Singer**.

## Overview

OpenAI's Realtime API enables low-latency, multimodal interactions with realtime audio and text processing. Use LiveKit's OpenAI plugin to create an agent that uses the Realtime API.

> ℹ️ **Note**
> 
> Using Azure OpenAI? See our [Azure OpenAI Realtime API guide](https://docs.livekit.io/agents/integrations/realtime/azure-openai.md).

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the OpenAI plugin:

**Python**:

```bash
pip install "livekit-agents[openai]~=1.2"

```

---

**Node.js**:

```bash
pnpm add "@livekit/agents-plugin-openai@1.x"

```

### Authentication

The OpenAI plugin requires an [OpenAI API key](https://platform.openai.com/api-keys).

Set `OPENAI_API_KEY` in your `.env` file.

### Usage

Use the OpenAI Realtime API within an `AgentSession`. For example, you can use it in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.realtime.RealtimeModel(voice="marin"),
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
   llm: new openai.realtime.RealtimeModel({ voice: "marin" }),
});

```

### Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the plugin reference links in the [Additional resources](#additional-resources) section.

- **`model`** _(str)_ (optional) - Default: `'gpt-realtime'`: ID of the Realtime model to use. For a list of available models, see the [Models](https://platform.openai.com/docs/models).

- **`voice`** _(str)_ (optional) - Default: `'alloy'`: Voice to use for speech generation. For a list of available voices, see [Voice options](https://platform.openai.com/docs/guides/realtime-conversations#voice-options).

- **`temperature`** _(float)_ (optional) - Default: `0.8`: Valid values are between `0.6` and `1.2`. To learn more, see [temperature](https://platform.openai.com/docs/api-reference/realtime-sessions/create#realtime-sessions-create-temperature).

- **`turn_detection`** _(TurnDetection | None)_ (optional): Configuration for turn detection, see the section on [Turn detection](#turn-detection) for more information.

- **`modalities`** _(list[str])_ (optional) - Default: `['text', 'audio']`: List of response modalities to use for the session. Set to `['text']` to use the model in text-only mode with a [separate TTS plugin](https://docs.livekit.io/llms.txt#separate-tts).

## Turn detection

OpenAI's Realtime API includes [voice activity detection (VAD)](https://platform.openai.com/docs/guides/realtime-vad) to automatically detect when a user has started or stopped speaking. This feature is enabled by default.

There are two modes for VAD:

- **Server VAD** (default): Uses periods of silence to automatically chunk the audio.
- **Semantic VAD**: Uses a semantic classifier to detect when the user has finished speaking based on their words.

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
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
   llm: new openai.realtime.RealtimeModel({
      turnDetection: {
         type: "server_vad",
         threshold: 0.5,
         prefix_padding_ms: 300,
         silence_duration_ms: 500,
         create_response: true,
         interrupt_response: true,
      },
   }),
});

```

- `threshold`: Higher values require louder audio to activate, better for noisy environments.
- `prefix_padding_ms`: Amount of audio to include before detected speech.
- `silence_duration_ms`: Duration of silence to detect speech stop (shorter = faster turn detection).

### Semantic VAD

Semantic VAD uses a classifier to determine when the user is done speaking based on their words. This mode is less likely to interrupt users mid-sentence or chunk transcripts prematurely.

**Python**:

```python
from livekit.plugins.openai import realtime
from openai.types.beta.realtime.session import TurnDetection

session = AgentSession(
    llm=realtime.RealtimeModel(
        turn_detection=TurnDetection(
            type="semantic_vad",
            eagerness="auto",
            create_response=True,
            interrupt_response=True,
        )
    ),
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
   llm: new openai.realtime.RealtimeModel({
      turnDetection: null,
   })
   turnDetection: new livekit.turnDetector.EnglishModel(),
});

```

The `eagerness` property controls how quickly the model responds:

- `auto` (default) - Equivalent to `medium`.
- `low` - Lets users take their time speaking.
- `high` - Chunks audio as soon as possible.
- `medium` - Balanced approach.

For more information about turn detection in general, see the [Turn detection guide](https://docs.livekit.io/agents/build/turns.md).

## Usage with separate TTS

To use the OpenAI Realtime API with a different [TTS provider](https://docs.livekit.io/agents/integrations/tts.md), configure it with a text-only response modality and include a TTS plugin in your `AgentSession` configuration. This configuration allows you to gain the benefits of realtime speech comprehension while maintaining complete control over the speech output.

**Python**:

```python
session = AgentSession(
    llm=openai.realtime.RealtimeModel(modalities=["text"]),
    tts=cartesia.TTS() # Or other TTS plugin of your choice
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';

const session = new voice.AgentSession({
   llm: new openai.realtime.RealtimeModel({ 
      modalities: ["text"]
   }),
   tts: new cartesia.TTS(), // Or other TTS plugin of your choice
});

```

## Loading conversation history

If you load conversation history into the model, it might respond with text output even if configured for audio response. To work around this issue, use the model [with a separate TTS plugin](#separate-tts) and text-only response modality. You can use the [Azure OpenAI TTS plugin](https://docs.livekit.io/agents/integrations/tts/azure-openai.md) to continue using the same voices supported by the Realtime API.

For additional workaround options, see the OpenAI [thread](https://community.openai.com/t/trouble-loading-previous-messages-with-realtime-api) on this topic.

## Additional resources

The following resources provide more information about using OpenAI with LiveKit Agents.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build a simple realtime model voice assistant using the OpenAI Realtime API in less than 10 minutes.

- **[OpenAI docs](https://platform.openai.com/docs/guides/realtime)**: OpenAI Realtime API documentation.

- **[OpenAI ecosystem overview](https://docs.livekit.io/agents/integrations/openai.md)**: Overview of the entire OpenAI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:06.367Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/realtime/openai.md](https://docs.livekit.io/agents/integrations/realtime/openai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).