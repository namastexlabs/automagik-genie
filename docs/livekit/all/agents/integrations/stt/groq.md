LiveKit Docs › Integration guides › Speech-to-text (STT) › Groq

---

# Groq STT integration guide

> How to use the Groq STT plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Groq](https://groq.com/) provides fast STT using fine-tuned and distilled models based on Whisper V3 Large. With LiveKit's Groq integration and the Agents framework, you can build AI voice applications with fluent and conversational voices.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

**Python**:

```bash
pip install "livekit-agents[groq]~=1.2"

```

---

**Node.js**:

For Node.js, support for Groq STT is available using the OpenAI plugin.

```bash
pnpm add @livekit/agents-plugin-openai@1.x

```

### Authentication

The Groq plugin requires a [Groq API key](https://console.groq.com/keys).

Set `GROQ_API_KEY` in your `.env` file.

### Usage

Use Groq STT in your `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import groq
   
session = AgentSession(
   stt=groq.STT(
      model="whisper-large-v3-turbo",
      language="en",
   ),
   # ... tts, llm, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
    stt: new openai.STT.withGroq(
        model: "whisper-large-v3-turbo"
    ),
    // ... tts, llm, vad, turn_detection, etc.
});

```

### Parameters

This section describes some of the available parameters. See the plugin reference links in the [Additional resources](#additional-resources) section for a complete list of all available parameters.

- **`model`** _(string)_ (optional) - Default: `whisper-large-v3-turbo`: Name of the STT model to use. For help with model selection, see the [Groq STT documentation](https://console.groq.com/docs/speech-to-text).

- **`language`** _(string)_ (optional) - Default: `en`: Language of the input audio in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format.

- **`prompt`** _(string)_ (optional): Prompt to guide the model's style or specify how to spell unfamiliar words. 224 tokens max.

## Additional resources

The following resources provide more information about using Groq with LiveKit Agents.

- **[Groq docs](https://console.groq.com/docs/speech-to-text)**: Groq STT docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Groq STT.

- **[Groq ecosystem guide](https://docs.livekit.io/agents/integrations/groq.md)**: Overview of the entire Groq and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:10.027Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/groq.md](https://docs.livekit.io/agents/integrations/stt/groq.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).