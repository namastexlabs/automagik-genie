LiveKit Docs › Integration guides › Speech-to-text (STT) › Baseten

---

# Baseten STT integration guide

> How to use the Baseten STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Baseten](https://www.baseten.co/) is a hosted inference platform that allows you to deploy and serve any machine learning model. With LiveKit's Baseten integration and the Agents framework, you can build AI agents that provide high-accuracy transcriptions using models like Whisper.

## Quick reference

This section provides a quick reference for the Baseten STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[baseten]~=1.2"

```

### Authentication

The Baseten plugin requires a [Baseten API key](https://app.baseten.co/settings/api-keys).

Set the following in your `.env` file:

```shell
BASETEN_API_KEY=<your-baseten-api-key>

```

### Model deployment

You must deploy a websocket-based STT model to Baseten to use it with LiveKit Agents. The standard Whisper deployments available in the Baseten library are not suitable for realtime use. Contact Baseten support for help deploying a websocket-compatible Whisper model.

Your model endpoint may show as an HTTP URL such as `https://model-<id>.api.baseten.co/environments/production/predict`. The domain is correct but you must change the protocol to `wss` and the path to `/v1/websocket` to use it as the `model_endpoint` parameter for the Baseten STT plugin.

The correct websocket URL format is:

```
wss://<your-model-id>.api.baseten.co/v1/websocket

```

### Usage

Use Baseten STT within an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import baseten

session = AgentSession(
   stt=baseten.STT(
      model_endpoint="wss://<your-model-id>.api.baseten.co/v1/websocket",
   )
   # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/baseten/index.html.md#livekit.plugins.baseten.STT) for a complete list of all available parameters.

- **`model_endpoint`** _(string)_ (optional) - Environment: `BASETEN_MODEL_ENDPOINT`: The endpoint URL for your deployed model. You can find this in your Baseten dashboard. Note that this must be a websocket URL (starts with `wss://`). See [Model deployment](#model-deployment) for more details.

- **`language`** _(string)_ (optional) - Default: `en`: Language of input audio in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format.

- **`vad_threshold`** _(float)_ (optional) - Default: `0.5`: Threshold for voice activity detection.

- **`vad_min_silence_duration_ms`** _(int)_ (optional) - Default: `300`: Minimum duration of silence in milliseconds to consider speech ended.

- **`vad_speech_pad_ms`** _(int)_ (optional) - Default: `30`: Duration in milliseconds to pad speech segments.

## Additional resources

The following resources provide more information about using Baseten with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-baseten/)**: The `livekit-plugins-baseten` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/baseten/index.html.md#livekit.plugins.baseten.STT)**: Reference for the Baseten STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-baseten)**: View the source or contribute to the LiveKit Baseten STT plugin.

- **[Baseten docs](https://docs.baseten.co/)**: Baseten's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Baseten.

- **[Baseten TTS](https://docs.livekit.io/agents/integrations/tts/baseten.md)**: Guide to the Baseten TTS integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:08.027Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/baseten.md](https://docs.livekit.io/agents/integrations/stt/baseten.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).