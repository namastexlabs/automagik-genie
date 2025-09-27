LiveKit Docs › Integration guides › Text-to-speech (TTS) › Azure AI Speech

---

# Azure Speech TTS integration guide

> How to use the Azure Speech TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Azure Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview) provides a [streaming TTS service](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/index-text-to-speech) with high accuracy, realtime transcription. You can use the open source Azure Speech plugin for LiveKit Agents to build voice AI with fast, accurate transcription.

## Quick reference

This section provides a brief overview of the Azure Speech TTS plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[azure]~=1.2"

```

### Authentication

The Azure Speech plugin requires an [Azure Speech key](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text?tabs=macos,terminal&pivots=programming-language-python#prerequisites).

Set the following environment variables in your `.env` file:

```shell
AZURE_SPEECH_KEY=<azure-speech-key>
AZURE_SPEECH_REGION=<azure-speech-region>
AZURE_SPEECH_HOST=<azure-speech-host>

```

### Usage

Use an Azure Speech TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import azure

session = AgentSession(
    tts=azure.TTS(
        speech_key="<speech_service_key>",
        speech_region="<speech_service_region>",
    ),
    # ... llm, stt, etc.
)

```

> ℹ️ **Note**
> 
> To create an instance of `azure.TTS`, one of the following options must be met:
> 
> - `speech_host` must be set, _or_
> - `speech_key` _and_ `speech_region` must both be set, _or_
> - `speech_auth_token` _and_ `speech_region` must both be set.

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/azure/index.html.md#livekit.plugins.azure.TTS) for a complete list of all available parameters.

- **`voice`** _(string)_ (optional): Voice for text-to-speech. To learn more, see [Select synthesis language and voice](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis#select-synthesis-language-and-voice).

- **`language`** _(string)_ (optional): Language of the input text. To learn more, see [Select synthesis language and voice](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis#select-synthesis-language-and-voice).

- **`prosody`** _(ProsodyConfig)_ (optional): Specify changes to pitch, rate, and volume for the speech output. To learn more, see [Adjust prosody](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice#adjust-prosody).

- **`speech_key`** _(string)_ (optional) - Environment: `AZURE_SPEECH_KEY`: Azure Speech speech-to-text key. To learn more, see [Azure Speech prerequisites](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text#prerequisites).

- **`speech_region`** _(string)_ (optional) - Environment: `AZURE_SPEECH_REGION`: Azure Speech speech-to-text region. To learn more, see [Azure Speech prerequisites](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text#prerequisites).

- **`speech_host`** _(string)_ (optional) - Environment: `AZURE_SPEECH_HOST`: Azure Speech endpoint.

- **`speech_auth_token`** _(string)_ (optional): Azure Speech authentication token.

## Controlling speech and pronunciation

Azure Speech TTS supports Speech Synthesis Markup Language (SSML) for customizing generated speech. To learn more, see [SSML overview](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup).

## Additional resources

The following resources provide more information about using Azure Speech with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-azure/)**: The `livekit-plugins-azure` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/azure/index.html.md#livekit.plugins.azure.TTS)**: Reference for the Azure Speech TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-azure)**: View the source or contribute to the LiveKit Azure Speech TTS plugin.

- **[Azure Speech docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview)**: Azure Speech's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Azure Speech.

- **[Azure ecosystem guide](https://docs.livekit.io/agents/integrations/azure.md)**: Overview of the entire Azure AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:12.977Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/azure.md](https://docs.livekit.io/agents/integrations/tts/azure.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).