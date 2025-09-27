LiveKit Docs › Integration guides › Realtime models › Gemini Live API

---

# Gemini Live API integration guide

> How to use the Gemini Live API with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

Google's [Gemini Live API](https://ai.google.dev/gemini-api/docs/live) enables low-latency, two-way interactions that use text, audio, and video input, with audio and text output. LiveKit's Google plugin includes a `RealtimeModel` class that allows you to use this API to create agents with natural, human-like voice conversations.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the Google plugin:

**Python**:

```bash
pip install "livekit-agents[google]~=1.2"

```

---

**Node.js**:

```bash
pnpm add "@livekit/agents-plugin-google@1.x"

```

### Authentication

The Google plugin requires authentication based on your chosen service:

- For Vertex AI, you must set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of the service account key file.
- For Google Gemini API, set the `GOOGLE_API_KEY` environment variable.

### Usage

Use the Gemini Live API within an `AgentSession`. For example, you can use it in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import google

session = AgentSession(
    llm=google.beta.realtime.RealtimeModel(
        model="gemini-2.0-flash-exp",
        voice="Puck",
        temperature=0.8,
        instructions="You are a helpful assistant",
    ),
)

```

---

**Node.js**:

```typescript
import * as google from '@livekit/agents-plugin-google';

const session = new voice.AgentSession({
   llm: new google.beta.realtime.RealtimeModel({
      model: "gemini-2.0-flash-exp",
      voice: "Puck",
      temperature: 0.8,
      instructions: "You are a helpful assistant",
   }),
});

```

> 🔥 **Limitations with Gemini 2.5**
> 
> Gemini 2.5 Live is currently in preview and does not handle function calling correctly. The Gemini team is actively working on a fix. See [GH issue](https://github.com/googleapis/python-genai/issues/843).

### Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the plugin reference links in the [Additional resources](#additional-resources) section.

- **`instructions`** _(string)_ (optional): System instructions to better control the model's output and specify tone and sentiment of responses. To learn more, see [System instructions](https://ai.google.dev/gemini-api/docs/live#system-instructions).

- **`model`** _(LiveAPIModels | string)_ - Default: `gemini-2.0-flash-exp`: Live API model to use.

- **`api_key`** _(string)_ - Environment: `GOOGLE_API_KEY`: Google Gemini API key.

- **`voice`** _(Voice | string)_ - Default: `Puck`: Name of the Gemini Live API voice. For a full list, see [Voices](https://ai.google.dev/gemini-api/docs/live#change-voices).

- **`modalities`** _(list[Modality])_ (optional) - Default: `["AUDIO"]`: List of response modalities to use. Set to `["TEXT"]` to use the model in text-only mode with a [separate TTS plugin](#separate-tts).

- **`vertexai`** _(boolean)_ - Default: `false`: If set to true, use Vertex AI.

- **`project`** _(string)_ (optional) - Environment: `GOOGLE_CLOUD_PROJECT`: Google Cloud project ID to use for the API (if `vertextai=True`). By default, it uses the project in the service account key file (set using the `GOOGLE_APPLICATION_CREDENTIALS` environment variable).

- **`location`** _(string)_ (optional) - Environment: `GOOGLE_CLOUD_LOCATION`: Google Cloud location to use for the API (if `vertextai=True`). By default, it uses the location from the service account key file or `us-central1`.

- **`_gemini_tools`** _(list[GeminiTool])_ (optional): List of built-in Google tools, such as Google Search. For more information, see [Gemini tools](#gemini-tools).

### Gemini tools

> 🔥 **Experimental feature**
> 
> This integration is experimental and may change in a future SDK release.

The `_gemini_tools` parameter allows you to use built-in Google tools with the Gemini model. For example, you can use this feature to implement [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/live-tools#google-search):

**Python**:

```python
from google.genai import types

session = AgentSession(
    llm=google.beta.realtime.RealtimeModel(
        model="gemini-2.0-flash-exp",
        _gemini_tools=[types.GoogleSearch()],
    )
)

```

---

**Node.js**:

```typescript

import * as google from '@livekit/agents-plugin-google';

const session = new voice.AgentSession({
   llm: new google.beta.realtime.RealtimeModel({
      model: "gemini-2.0-flash-exp",
      geminiTools: [new google.types.GoogleSearch()],
   }),
});

```

## Turn detection

The Gemini Live API includes built-in VAD-based turn detection, enabled by default. To use LiveKit’s turn detection model instead, configure the model to disable automatic activity detection. A separate streaming STT model is required in order to use LiveKit’s turn detection model.

**Python**:

```python
from google.genai import types
from livekit.agents import AgentSession
from livekit.plugins.turn_detector.multilingual import MultilingualModel

session = AgentSession(
   turn_detection=MultilingualModel(),
   llm=google.beta.realtime.RealtimeModel(
      realtime_input_config=types.RealtimeInputConfig(
      automatic_activity_detection=types.AutomaticActivityDetection(
         disabled=True,
      ),
   ),
   input_audio_transcription=None,
   stt=deepgram.STT(),
)

```

---

**Node.js**:

```typescript

import * as google from '@livekit/agents-plugin-google';
import * as livekit from '@livekit/agents-plugin-livekit';

const session = new voice.AgentSession({
   turnDetection: new MultilingualModel(),
   llm: new google.beta.realtime.RealtimeModel({
      model: "gemini-2.0-flash-exp",
      realtimeInputConfig: {
         automaticActivityDetection: {
            disabled: true,
         },
      },
   }),
   turnDetection: new livekit.turnDetector.MultilingualModel(),
});

```

## Usage with separate TTS

To use the Gemini Live API with a different [TTS provider](https://docs.livekit.io/agents/integrations/tts.md), configure it with a text-only response modality and include a TTS plugin in your `AgentSession` configuration. This configuration allows you to gain the benefits of realtime speech comprehension while maintaining complete control over the speech output.

**Python**:

```python
from google.genai.types import Modality

session = AgentSession(
    llm=google.beta.realtime.RealtimeModel(modalities=[Modality.TEXT]),
    tts=cartesia.TTS(),
)

```

---

**Node.js**:

```typescript

import * as google from '@livekit/agents-plugin-google';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';

const session = new voice.AgentSession({
   llm: new google.beta.realtime.RealtimeModel({
      model: "gemini-2.0-flash-exp",
      modalities: [google.types.Modality.TEXT],
   }),
   tts: new elevenlabs.TTS(),
});

```

## Additional resources

The following resources provide more information about using Gemini with LiveKit Agents.

- **[Gemini docs](https://ai.google.dev/gemini-api/docs/live)**: Gemini Live API documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Gemini Live API.

- **[Google AI ecosystem guide](https://docs.livekit.io/agents/integrations/google.md)**: Overview of the entire Google AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:05.794Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/realtime/gemini.md](https://docs.livekit.io/agents/integrations/realtime/gemini.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).