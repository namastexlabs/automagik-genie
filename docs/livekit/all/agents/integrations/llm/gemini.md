LiveKit Docs › Integration guides › Large language models (LLM) › Google Gemini

---

# Google Gemini integration guide

> A guide to using Google Gemini with LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

[Google Gemini](https://ai.google.dev/gemini-api/docs/models/gemini) provides powerful language models with advanced reasoning and multimodal capabilities. With LiveKit's Google plugin and the Agents framework, you can build sophisticated voice AI applications using Vertex AI or Google Gemini API.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

**Python**:

```bash
pip install "livekit-agents[google]~=1.2"

```

---

**Node.js**:

```bash
pnpm add @livekit/agents-plugin-google@1.x

```

### Authentication

The Google plugin requires authentication based on your chosen service:

- For Vertex AI, you must set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of the service account key file.
- For Google Gemini API, set the `GOOGLE_API_KEY` environment variable.

### Usage

Use Gemini within an `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import google

session = AgentSession(
    llm=google.LLM(
        model="gemini-2.0-flash-exp",
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as google from '@livekit/agents-plugin-google';

const session = new voice.AgentSession({
    llm: google.LLM(
        model: "gemini-2.0-flash-exp",
    ),
    // ... tts, stt, vad, turn_detection, etc.
});

```

### Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the [plugin reference](https://docs.livekit.io/python/v1/livekit/plugins/google/index.html.md#livekit.plugins.google.LLM).

- **`model`** _(ChatModels | str)_ (optional) - Default: `gemini-2.0-flash-001`: ID of the model to use. For a full list, see [Gemini models](https://ai.google.dev/gemini-api/docs/models/gemini).

- **`api_key`** _(str)_ (optional) - Environment: `GOOGLE_API_KEY`: API key for Google Gemini API.

- **`vertexai`** _(bool)_ (optional) - Default: `false`: True to use [Vertex AI](https://cloud.google.com/vertex-ai); false to use [Google AI](https://cloud.google.com/ai-platform/docs).

- **`project`** _(str)_ (optional) - Environment: `GOOGLE_CLOUD_PROJECT`: Google Cloud project to use (only if using Vertex AI). Required if using Vertex AI and the environment variable isn't set.

- **`location`** _(str)_ (optional) - Default: `` - Environment: `GOOGLE_CLOUD_LOCATION`: Google Cloud location to use (only if using Vertex AI). Required if using Vertex AI and the environment variable isn't set.

- **`gemini_tools`** _(List[GeminiTool])_ (optional): List of built-in Google tools, such as Google Search. For more information, see [Gemini tools](#gemini-tools).

### Gemini tools

The `gemini_tools` parameter allows you to use built-in Google tools with the Gemini model. For example, you can use this feature to implement [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search):

**Python**:

```python
from livekit.plugins import google
from google.genai import types

session = AgentSession(
    llm=google.LLM(
        model="gemini-2.0-flash-exp",
        gemini_tools=[types.GoogleSearch()],
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

---

**Node.js**:

```typescript
import * as google from '@livekit/agents-plugin-google';

const session = new voice.AgentSession({
    llm: google.LLM(
        model: "gemini-2.0-flash-exp",
        geminiTools: [new google.types.GoogleSearch()],
    ),
    // ... tts, stt, vad, turn_detection, etc.
});

```

The full list of supported tools, depending on the model, is:

- `google.genai.types.GoogleSearchRetrieval()`
- `google.genai.types.ToolCodeExecution()`
- `google.genai.types.GoogleSearch()`
- `google.genai.types.UrlContext()`
- `google.genai.types.GoogleMaps()`

## Additional resources

The following resources provide more information about using Google Gemini with LiveKit Agents.

- **[Gemini docs](https://ai.google.dev/gemini-api/docs/models/gemini)**: Google Gemini documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Google Gemini.

- **[Google AI ecosystem guide](https://docs.livekit.io/agents/integrations/google.md)**: Overview of the entire Google AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:01.845Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/gemini.md](https://docs.livekit.io/agents/integrations/llm/gemini.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).