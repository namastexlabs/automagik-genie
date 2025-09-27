LiveKit Docs › Integration guides › Text-to-speech (TTS) › Baseten

---

# Baseten TTS integration guide

> How to use the Baseten TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Baseten](https://www.baseten.co/) is a hosted inference platform that allows you to deploy and serve any machine learning model. With LiveKit's Baseten integration and the Agents framework, you can build AI agents that provide high-quality speech synthesis using models like Orpheus.

## Quick reference

This section provides a quick reference for the Baseten TTS plugin. For more information, see [Additional resources](#additional-resources).

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

You must deploy a TTS model such as [Orpheus](https://www.baseten.co/library/orpheus-tts/) to Baseten to use it with LiveKit Agents. Your deployment includes a private model endpoint URL to provide to the LiveKit Agents integration.

### Usage

Use Baseten TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import baseten

session = AgentSession(
   tts=baseten.TTS(
      model_endpoint="<your-model-endpoint>",
      voice="tara",
   )
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/baseten/index.html.md#livekit.plugins.baseten.TTS) for a complete list of all available parameters.

- **`model_endpoint`** _(string)_ (optional) - Environment: `BASETEN_MODEL_ENDPOINT`: The endpoint URL for your deployed model. You can find this in your Baseten dashboard.

- **`voice`** _(string)_ (optional) - Default: `tara`: The voice to use for speech synthesis.

- **`language`** _(string)_ (optional) - Default: `en`: Language of output audio in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) format.

- **`temperature`** _(float)_ (optional) - Default: `0.6`: Controls the randomness of the generated speech. Higher values make the output more random.

## Additional resources

The following resources provide more information about using Baseten with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-baseten/)**: The `livekit-plugins-baseten` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/baseten/index.html.md#livekit.plugins.baseten.TTS)**: Reference for the Baseten TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-baseten)**: View the source or contribute to the LiveKit Baseten TTS plugin.

- **[Baseten docs](https://docs.baseten.co/)**: Baseten's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Baseten.

- **[Baseten STT](https://docs.livekit.io/agents/integrations/stt/baseten.md)**: Guide to the Baseten STT integration with LiveKit Agents.

---

This document was rendered at 2025-09-27T09:36:13.257Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/baseten.md](https://docs.livekit.io/agents/integrations/tts/baseten.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).