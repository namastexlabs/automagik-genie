LiveKit Docs › Integration guides › Text-to-speech (TTS) › ElevenLabs

---

# ElevenLabs TTS integration guide

> How to use the ElevenLabs TTS plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[ElevenLabs](https://elevenlabs.io/) provides an AI text-to-speech (TTS) service with thousands of human-like voices across a number of different languages. With LiveKit's ElevenLabs integration and the Agents framework, you can build voice AI applications that sound realistic.

## Quick reference

This section provides a quick reference for the ElevenLabs TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

**Python**:

```bash
pip install "livekit-agents[elevenlabs]~=1.2"

```

---

**Node.js**:

```bash
pnpm add @livekit/agents-plugin-elevenlabs@1.x

```

### Authentication

The ElevenLabs plugin requires an [ElevenLabs API key](https://elevenlabs.io/app/settings/api-keys).

Set `ELEVEN_API_KEY` in your `.env` file.

### Usage

Use ElevenLabs TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import elevenlabs

session = AgentSession(
   tts=elevenlabs.TTS(
      voice_id="ODq5zmih8GrVes37Dizd",
      model="eleven_multilingual_v2"
   )
   # ... llm, stt, etc.
)

```

---

**Node.js**:

```typescript
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';

const session = new voice.AgentSession({
    tts: new elevenlabs.TTS(
      voice: { id: "ODq5zmih8GrVes37Dizd" },
      model: "eleven_multilingual_v2"
    ),
    // ... llm, stt, etc.
});

```

### Parameters

This section describes some of the parameters you can set when you create an ElevenLabs TTS. See the plugin reference links in the [Additional resources](#additional-resources) section for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `eleven_flash_v2_5`: ID of the model to use for generation. To learn more, see the [ElevenLabs documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert#/docs/api-reference/text-to-speech/convert#request.body.model_id).

- **`voice_id`** _(string)_ (optional) - Default: `EXAVITQu4vr4xnSDxMaL`: ID of the voice to use for generation. To learn more, see the [ElevenLabs documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

- **`voice_settings`** _(VoiceSettings)_ (optional): Voice configuration. To learn more, see the [ElevenLabs documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert#request.body.voice_settings).

- - **`stability`** _(float)_ (optional):
- - **`similarity_boost`** _(float)_ (optional):
- - **`style`** _(float)_ (optional):
- - **`use_speaker_boost`** _(bool)_ (optional):
- - **`speed`** _(float)_ (optional):

- **`language`** _(string)_ (optional) - Default: `en`: Language of output audio in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format. To learn more, see the [ElevenLabs documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert#request.body.language_code).

- **`streaming_latency`** _(int)_ (optional) - Default: `3`: Latency in seconds for streaming.

- **`enable_ssml_parsing`** _(bool)_ (optional) - Default: `false`: Enable Speech Synthesis Markup Language (SSML) parsing for input text. Set to `true` to [customize pronunciation](#customizing-pronunciation) using SSML.

- **`chunk_length_schedule`** _(list[int])_ (optional) - Default: `[80, 120, 200, 260]`: Schedule for chunk lengths. Valid values range from `50` to `500`.

## Customizing pronunciation

ElevenLabs supports custom pronunciation for specific words or phrases with SSML `phoneme` tags. This is useful to ensure correct pronunciation of certain words, even when missing from the voice's lexicon. To learn more, see [Pronunciation](https://elevenlabs.io/docs/best-practices/prompting#pronunciation).

## Transcription timing

ElevenLabs TTS supports aligned transcription forwarding, which improves transcription synchronization in your frontend. Set `use_tts_aligned_transcript=True` in your `AgentSession` configuration to enable this feature. To learn more, see [the docs](https://docs.livekit.io/agents/build/text.md#tts-aligned-transcriptions).

## Additional resources

The following resources provide more information about using ElevenLabs with LiveKit Agents.

- **[ElevenLabs docs](https://elevenlabs.io/docs)**: ElevenLabs TTS docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and ElevenLabs TTS.

---

This document was rendered at 2025-09-27T09:36:14.110Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/elevenlabs.md](https://docs.livekit.io/agents/integrations/tts/elevenlabs.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).