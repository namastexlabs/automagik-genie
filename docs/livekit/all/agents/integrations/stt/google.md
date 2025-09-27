LiveKit Docs › Integration guides › Speech-to-text (STT) › Google Cloud

---

# Google Cloud STT integration guide

> How to use the Google Cloud STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Google Cloud](https://cloud.google.com/) provides a streaming [STT service](https://cloud.google.com/speech-to-text) with support for over 125 languages and access to the foundational model `chirp`, which provides improved recognition and transcription for spoken languages and accents. You can use the open source Google Cloud plugin for LiveKit Agents to build voice AI with fast, accurate transcription.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[google]~=1.2"

```

### Authentication

Google Cloud credentials must be provided by one of the following methods:

- Passed in the `credentials_info` dictionary.
- Saved in the `credentials_file` JSON file (`GOOGLE_APPLICATION_CREDENTIALS` environment variable).
- Application Default Credentials. To learn more, see [How Application Default Credentials works](https://cloud.google.com/docs/authentication/application-default-credentials)

### Usage

Use a Google Cloud STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import google

session = AgentSession(
  stt = google.STT(
    model="chirp",
    spoken_punctuation=False,
  ),
  # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/google/index.html.md#livekit.plugins.google.STT) for a complete list of all available parameters.

- **`languages`** _(LanguageCode)_ (optional) - Default: `en-US`: Specify input languages. For a full list of supported languages, see [Speech-to-text supported languages](https://cloud.google.com/speech-to-text/docs/speech-to-text-supported-languages).

- **`spoken_punctuation`** _(boolean)_ (optional) - Default: `True`: Replace spoken punctuation with punctuation characters in text.

- **`model`** _(SpeechModels | string)_ (optional) - Default: `long`: Model to use for speech-to-text. To learn more, see [Select a transcription model](https://cloud.google.com/speech-to-text/docs/transcription-model).

- **`credentials_info`** _(array)_ (optional): Key-value pairs of authentication credential information.

- **`credentials_file`** _(string)_ (optional): Name of the JSON file that contains authentication credentials for Google Cloud.

## Additional resources

The following resources provide more information about using Google Cloud with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-google/)**: The `livekit-plugins-google` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/google/index.html.md#livekit.plugins.google.STT)**: Reference for the Google Cloud STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-google)**: View the source or contribute to the LiveKit Google Cloud STT plugin.

- **[Google Cloud docs](https://cloud.google.com/speech-to-text/docs)**: Google Cloud STT docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Google Cloud STT.

- **[Google ecosystem guide](https://docs.livekit.io/agents/integrations/google.md)**: Overview of the entire Google AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:09.740Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/google.md](https://docs.livekit.io/agents/integrations/stt/google.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).