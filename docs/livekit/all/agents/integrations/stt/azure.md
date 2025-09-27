LiveKit Docs › Integration guides › Speech-to-text (STT) › Azure AI Speech

---

# Azure Speech STT integration guide

> How to use the Azure Speech STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Azure Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview) provides a streaming [STT service](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/index-speech-to-text) with high accuracy, realtime transcription. You can use the open source Azure Speech plugin for LiveKit Agents to build voice AI with fast, accurate transcription.

## Quick reference

This section provides a brief overview of the Azure Speech STT plugin. For more information, see [Additional resources](#additional-resources).

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

Use Azure Speech STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import azure

azure_stt = stt.STT(
  speech_key="<speech_service_key>",
  speech_region="<speech_service_region>",
)

```

> ℹ️ **Note**
> 
> To create an instance of `azure.STT`, one of the following options must be met:
> 
> - `speech_host` must be set, _or_
> - `speech_key` _and_ `speech_region` must both be set, _or_
> - `speech_auth_token` _and_ `speech_region` must both be set

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/azure/index.html.md#livekit.plugins.azure.STT) for a complete list of all available parameters.

- **`speech_key`** _(string)_ (optional) - Environment: `AZURE_SPEECH_KEY`: Azure Speech speech-to-text key. To learn more, see [Azure Speech prerequisites](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text?tabs=macos,terminal&pivots=programming-language-python#prerequisites).

- **`speech_region`** _(string)_ (optional) - Environment: `AZURE_SPEECH_REGION`: Azure Speech speech-to-text region. To learn more, see [Azure Speech prerequisites](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-speech-to-text#prerequisites).

- **`speech_host`** _(string)_ (optional) - Environment: `AZURE_SPEECH_HOST`: Azure Speech endpoint.

- **`speech_auth_token`** _(string)_ (optional): Azure Speech authentication token.

- **`languages`** _(list[string])_ (optional): List of potential source languages. To learn more, see [Standard locale names](https://learn.microsoft.com/en-us/globalization/locale/standard-locale-names).

## Additional resources

The following resources provide more information about using Azure Speech with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-azure/)**: The `livekit-plugins-azure` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/azure/index.html.md#livekit.plugins.azure.STT)**: Reference for the Azure Speech STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-azure)**: View the source or contribute to the LiveKit Azure Speech STT plugin.

- **[Azure Speech docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/overview)**: Azure Speech's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Azure Speech.

- **[Azure ecosystem guide](https://docs.livekit.io/agents/integrations/azure.md)**: Overview of the entire Azure AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:07.738Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/azure.md](https://docs.livekit.io/agents/integrations/stt/azure.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).