LiveKit Docs › Integration guides › Speech-to-text (STT) › Deepgram

---

# Deepgram STT integration guide

> How to use the Deepgram STT plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Deepgram](https://deepgram.com/) provides advanced speech recognition technology and AI-driven audio processing solutions. Customizable speech models allow you to fine tune transcription performance for your specific use case. With LiveKit's Deepgram integration and the Agents framework, you can build AI agents that provide high-accuracy transcriptions.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

**Python**:

```bash
pip install "livekit-agents[deepgram]~=1.2"

```

---

**Node.js**:

```bash
pnpm add @livekit/agents-plugin-deepgram@1.x

```

### Authentication

The Deepgram plugin requires a [Deepgram API key](https://console.deepgram.com/).

Set `DEEPGRAM_API_KEY` in your `.env` file.

### Usage

Use Deepgram STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import deepgram

session = AgentSession(
   stt = deepgram.STT(
      model="nova-3",
   ),
   # ... llm, tts, etc.
)

```

---

**Node.js**:

```typescript
import * as deepgram from '@livekit/agents-plugin-deepgram';

const session = new voice.AgentSession({
    stt: new deepgram.STT(
        model: "nova-3"
    ),
    // ... llm, tts, etc.
});

```

### Parameters

This section describes the available parameters. See the plugin reference links in the [Additional resources](#additional-resources) section for more details.

- **`model`** _(string)_ (optional) - Default: `nova-3`: The Deepgram model to use for speech recognition.

- **`language`** _(string)_ (optional) - Default: `en-US`: The language code for recognition.

- **`endpointing_ms`** _(int)_ (optional) - Default: `25`: Time in milliseconds of silence to consider end of speech. Set to 0 to disable.

- **`keyterms`** _(list[string])_ (optional) - Default: `[]`: List of key terms to improve recognition accuracy. Supported by Nova-3 models.

## Additional resources

The following resources provide more information about using Deepgram with LiveKit Agents.

- **[Deepgram docs](https://developers.deepgram.com/docs)**: Deepgram's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Deepgram.

- **[Deepgram TTS](https://docs.livekit.io/agents/integrations/tts/deepgram.md)**: Guide to the Deepgram TTS integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:08.908Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/deepgram.md](https://docs.livekit.io/agents/integrations/stt/deepgram.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).