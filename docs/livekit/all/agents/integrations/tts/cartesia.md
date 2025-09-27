LiveKit Docs › Integration guides › Text-to-speech (TTS) › Cartesia

---

# Cartesia TTS integration guide

> How to use the Cartesia TTS plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Cartesia](https://www.cartesia.ai/) provides customizable speech synthesis across a number of different languages and produces natural-sounding speech with low latency. You can use the Cartesia TTS plugin for LiveKit Agents to build voice AI applications that sound realistic.

## Quick reference

This section includes a brief overview of the Cartesia TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

**Python**:

```bash
pip install "livekit-agents[cartesia]~=1.2"

```

---

**Node.js**:

```bash
pnpm add @livekit/agents-plugin-cartesia@1.x

```

### Authentication

The Cartesia plugin requires a [Cartesia API key](https://play.cartesia.ai/keys).

Set `CARTESIA_API_KEY` in your `.env` file.

### Usage

Use Cartesia TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import cartesia

session = AgentSession(
   tts=cartesia.TTS(
      model="sonic-2",
      voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",
   )
   # ... llm, stt, etc.
)

```

---

**Node.js**:

```typescript
import * as cartesia from '@livekit/agents-plugin-cartesia';

const session = new voice.AgentSession({
    tts: cartesia.TTS(
        model: "sonic-2",
        voice: "f786b574-daa5-4673-aa0c-cbe3e8534c02",
    ),
    // ... llm, stt, etc.
});

```

### Parameters

This section describes some of the available parameters. See the plugin reference links in the [Additional resources](#additional-resources) section for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `sonic-2`: ID of the model to use for generation. See [supported models](https://docs.cartesia.ai/build-with-cartesia/models/tts).

- **`voice`** _(string | list[float])_ (optional) - Default: `794f9389-aac1-45b6-b726-9d9369183238`: ID of the voice to use for generation, or an embedding array. See [official documentation](https://docs.cartesia.ai/api-reference/tts/tts#send.Generation%20Request.voice).

- **`language`** _(string)_ (optional) - Default: `en`: Language of input text in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format. For a list of languages support by model, see [supported models](https://docs.cartesia.ai/build-with-cartesia/models/tts).

## Customizing pronunciation

Cartesia TTS allows you to customize pronunciation using Speech Synthesis Markup Language (SSML). To learn more, see [Specify Custom Pronunciations](https://docs.cartesia.ai/build-with-cartesia/capability-guides/specify-custom-pronunciations).

## Transcription timing

Cartesia TTS supports aligned transcription forwarding, which improves transcription synchronization in your frontend. Set `use_tts_aligned_transcript=True` in your `AgentSession` configuration to enable this feature. To learn more, see [the docs](https://docs.livekit.io/agents/build/text.md#tts-aligned-transcriptions).

## Additional resources

The following resources provide more information about using Cartesia with LiveKit Agents.

- **[Cartesia docs](https://docs.cartesia.ai/build-with-cartesia/models/tts)**: Cartesia TTS docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Cartesia TTS.

- **[Cartesia STT](https://docs.livekit.io/agents/integrations/stt/cartesia.md)**: Guide to the Cartesia STT integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:13.531Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/cartesia.md](https://docs.livekit.io/agents/integrations/tts/cartesia.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).