LiveKit Docs › Integration guides › Speech-to-text (STT) › OpenAI

---

# OpenAI STT integration guide

> How to use the OpenAI STT plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[OpenAI](https://platform.openai.com) provides STT support via the latest `gpt-4o-transcribe` model as well as `whisper-1`. You can use the open source OpenAI plugin for LiveKit agents to build voice AI applications with fast, accurate transcription.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

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

The OpenAI plugin requires an [OpenAI API key](https://platform.openai.com/api-keys).

Set `OPENAI_API_KEY` in your `.env` file.

### Usage

Use OpenAI STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import openai

session = AgentSession(
  stt = openai.STT(
    model="gpt-4o-transcribe",
  ),
  # ... llm, tts, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    stt: new openai.STT(
        model: "gpt-4o-transcribe"
    ),
    // ... llm, tts, etc.
});

```

### Parameters

This section describes some of the available parameters. See the plugin reference links in the [Additional resources](#additional-resources) section for a complete list of all available parameters.

- **`model`** _(WhisperModels | string)_ (optional) - Default: `gpt-4o-transcribe`: Model to use for transcription. See OpenAI's documentation for a list of [supported models](https://platform.openai.com/docs/models#transcription).

- **`language`** _(string)_ (optional) - Default: `en`: Language of input audio in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format. See OpenAI's documentation for a list of [supported languages](https://platform.openai.com/docs/guides/speech-to-text#supported-languages).

## Additional resources

The following resources provide more information about using OpenAI with LiveKit Agents.

- **[OpenAI docs](https://platform.openai.com/docs/guides/speech-to-text)**: OpenAI STT docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and OpenAI STT.

- **[OpenAI ecosystem guide](https://docs.livekit.io/agents/integrations/openai.md)**: Overview of the entire OpenAI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:10.592Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/openai.md](https://docs.livekit.io/agents/integrations/stt/openai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).