LiveKit Docs › Integration guides › Speech-to-text (STT) › Azure OpenAI

---

# Azure OpenAI STT integration guide

> How to use the Azure OpenAI STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service/) provides OpenAI services hosted on Azure. With LiveKit's Azure OpenAI STT integration and the Agents framework, you can build voice AI applications with fast, accurate transcription.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Support for Azure OpenAI STT is available in the `openai` plugin.

Install the plugin from PyPI:

```bash
pip install "livekit-agents[openai]~=1.2"

```

### Authentication

The Azure OpenAI TTS requires [authentication](https://learn.microsoft.com/en-us/azure/api-management/api-management-authenticate-authorize-azure-openai) using an API key or a managed identity.

Set the following environment variables in your `.env` file:

```shell
AZURE_OPENAI_API_KEY=<azure-openai-api-key>
AZURE_OPENAI_AD_TOKEN=<azure-openai-ad-token>
AZURE_OPENAI_ENDPOINT=<azure-openai-endpoint>

```

### Usage

Use Azure OpenAI STT within an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import openai

session = AgentSession(
  stt = openai.STT.with_azure(
    model="gpt-4o-transcribe",
  ),
  # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the [plugin reference](https://docs.livekit.io/reference/python/livekit/plugins/openai/index.html.md#livekit.plugins.openai.STT.with_azure).

- **`language`** _(string)_ (optional) - Default: `en`: Language code for the transcription.

- **`model`** _(STTModels | string)_ (optional) - Default: `gpt-4o-mini-transcribe`: ID of the model to use for speech-to-text.

- **`prompt`** _(string)_ (optional): Initial prompt to guide the transcription.

- **`azure_endpoint`** _(string)_ (optional) - Environment: `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint in the following format: `https://{your-resource-name}.openai.azure.com`.

- **`azure_deployment`** _(string)_ (optional): Name of your model deployment.

- **`api_version`** _(string)_ (optional) - Environment: `OPENAI_API_VERSION`: OpenAI REST API version used for the request.

- **`api_key`** _(string)_ (optional) - Environment: `AZURE_OPENAI_API_KEY`: Azure OpenAI API key.

- **`azure_ad_token`** _(string)_ (optional) - Environment: `AZURE_OPENAI_AD_TOKEN`: Azure Active Directory token.

- **`organization`** _(string)_ (optional) - Environment: `OPENAI_ORG_ID`: OpenAI organization ID.

- **`project`** _(string)_ (optional) - Environment: `OPENAI_PROJECT_ID`: OpenAI project ID.

## Additional resources

The following resources provide more information about using Azure OpenAI with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-openai/)**: The `livekit-plugins-openai` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/openai/index.html.md#livekit.plugins.openai.STT.with_azure)**: Reference for the Azure OpenAI STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-openai)**: View the source or contribute to the LiveKit Azure OpenAI plugin.

- **[Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/)**: Azure OpenAI documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Azure OpenAI.

- **[Azure ecosystem guide](https://docs.livekit.io/agents/integrations/azure.md)**: Overview of the entire Azure AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:07.472Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/azure-openai.md](https://docs.livekit.io/agents/integrations/stt/azure-openai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).