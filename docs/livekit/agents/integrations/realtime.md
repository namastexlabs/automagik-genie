LiveKit Docs › Integration guides › Realtime models › Overview

---

# Realtime model integrations

> Guides for adding realtime model integrations to your agents.

## Overview

Realtime models are capable of consuming and producing speech directly, bypassing the need for a voice pipeline with speech-to-text and text-to-speech components. They can be better at understanding the emotional context of input speech, as well as other verbal cues that may not translate well to text transcription. Additionally, the generated speech can include similar emotional aspects and other improvements over what a text-to-speech model can produce.

You can also use supported realtime models in tandem with a [TTS](https://docs.livekit.io/agents/integrations/tts.md) plugin of your choice, to gain the benefits of realtime speech comprehension while maintaining complete control over speech output

The agents framework includes plugins for popular realtime models out of the box. This is a new area in voice AI and LiveKit aims to support new providers as they emerge.

LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/integrations.md#contribute).

## How to use

Realtime model plugins have a constructor method to create a `RealtimeModel` instance. This instance can be passed directly to an `AgentSession` or `Agent` in its constructor, in place of an [LLM plugin](https://docs.livekit.io/agents/integrations/llm.md).

** Filename: `agent.py`**

```python
from livekit.agents import AgentSession
from livekit.plugins import openai

session = AgentSession(
    llm=openai.realtime.RealtimeModel()
)

```

** Filename: `agent.ts`**

```typescript
import voice from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
   llm: new openai.realtime.RealtimeModel()
});

```

For additional information about installing and using plugins, see the [plugins overview](https://docs.livekit.io/agents/integrations.md#install).

### Usage with separate TTS

To use a realtime model with a different [TTS provider](https://docs.livekit.io/agents/integrations/tts.md), configure the realtime model to use a text-only response modality and include a TTS plugin in your `AgentSession` configuration.

** Filename: `agent.py`**

```python
session = AgentSession(
    llm=openai.realtime.RealtimeModel(modalities=["text"]), # Or other realtime model plugin
    tts=cartesia.TTS() # Or other TTS plugin of your choice
)

```

** Filename: `agent.ts`**

```typescript
const session = new voice.AgentSession({
   llm: new openai.realtime.RealtimeModel(modalities=["text"]), // Or other realtime model plugin
   tts: new elevenlabs.TTS() // Or other TTS plugin of your choice
});

```

This feature requires support for a text-only response modality. Consult the following table for information about which providers support this feature.

## Available providers

The following table lists the available realtime model providers. All providers support fast and expressive full speech-to-speech generation, tool calling, image understanding, and simple VAD-based [turn detection](https://docs.livekit.io/agents/build/turns.md). Support for other features is noted in the following table.

| Provider | Plugin | Notes | Available in |
| -------- | ------ | ----- | ------------ |
| [Gemini Live API](https://docs.livekit.io/agents/integrations/realtime/gemini.md) | `google` |  | Python, Nodejs |
| [Amazon Nova Sonic](https://docs.livekit.io/agents/integrations/realtime/nova-sonic.md) | `aws` |  | Python |
| [OpenAI Realtime API](https://docs.livekit.io/agents/integrations/realtime/openai.md) | `openai` |  | Python, Nodejs |
| [Azure OpenAI Realtime API](https://docs.livekit.io/agents/integrations/realtime/azure-openai.md) | `openai` |  | Python, Nodejs |

## Considerations and limitations

Realtime models bring great benefits due to their wider range of audio understanding and expressive output. However, they also have some limitations and considerations to keep in mind.

### Turn detection and VAD

In general, LiveKit recommends using the built-in turn detection capabilities of the realtime model whenever possible. Accurate turn detection relies on both VAD and context gained from realtime speech-to-text, which, as discussed in the following section, isn't available with realtime models. If you need to use the LiveKit [turn detector model](https://docs.livekit.io/agents/build/turns/turn-detector.md), you must also add a separate STT plugin to provide the necessary interim transcripts.

### Delayed transcription

Realtime models don't provide interim transcription results, and in general the user input transcriptions can be considerably delayed and often arrive after the agent's response. If you need realtime transcriptions, you should consider an STT-LLM-TTS pipeline or add a separate STT plugin for realtime transcription.

### Scripted speech output

Realtime models don't offer a method to directly generate speech from a text script, such as with the `say` method. You can produce a response with `generate_reply(instructions='...')` and include specific instructions but the output isn't guaranteed to precisely follow any provided script. If your application requires the use of specific scripts, consider using the model [with a separate TTS plugin](#separate-tts) instead.

### Loading conversation history

Current models only support loading call history in text format. This limits their ability to interpret emotional context and other verbal cues that may not translate well to text transcription. Additionally, the OpenAI Realtime API becomes more likely to respond in text only after loading extensive history, even if configured to use speech. For OpenAI, it's recommended that you use a [separate TTS plugin](#separate-tts) if you need to load conversation history.

---

This document was rendered at 2025-09-27T09:36:05.232Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/realtime.md](https://docs.livekit.io/agents/integrations/realtime.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).