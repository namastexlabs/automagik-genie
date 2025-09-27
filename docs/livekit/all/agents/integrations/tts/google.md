LiveKit Docs › Integration guides › Text-to-speech (TTS) › Google Cloud

---

# Google Cloud TTS integration guide

> How to use the Google Cloud TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Google Cloud TTS](https://cloud.google.com/text-to-speech) provides a wide voice selection and generates speech with humanlike intonation. With LiveKit's Google Cloud TTS integration and the Agents framework, you can build voice AI applications that sound realistic.

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

Use a Google Cloud TTS in an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import google

session = AgentSession(
  tts = google.TTS(
    gender="female",
    voice_name="en-US-Standard-H",
  ),
  # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/google/index.html.md#livekit.plugins.google.TTS) for a complete list of all available parameters.

- **`language`** _(SpeechLanguages | string)_ (optional) - Default: `en-US`: Specify output language. For a full list of languages, see [Supported voices and languages](https://cloud.google.com/text-to-speech/docs/voices).

- **`gender`** _(Gender | string)_ (optional) - Default: `neutral`: Voice gender. Valid values are `male`, `female`, and `neutral`.

- **`voice_name`** _(string)_ (optional): Name of the voice to use for speech. For a full list of voices, see [Supported voices and languages](https://cloud.google.com/text-to-speech/docs/voices).

- **`voice_cloning_key`** _(string)_ (optional): Voice cloning key to use a custom, cloned voice. This is a text string that represents your voice data. To learn more, see [Chirp 3: Instant custom voice](https://cloud.google.com/text-to-speech/docs/chirp3-instant-custom-voice).

- **`credentials_info`** _(array)_ (optional): Key-value pairs of authentication credential information.

- **`credentials_file`** _(string)_ (optional): Name of the JSON file that contains authentication credentials for Google Cloud.

## Customizing speech

Google Cloud TTS supports Speech Synthesis Markup Language (SSML) to customize pronunciation and speech. To learn more, see the [SSML reference](https://cloud.google.com/text-to-speech/docs/ssml).

## Additional resources

The following resources provide more information about using Google Cloud with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-google/)**: The `livekit-plugins-google` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/google/index.html.md#livekit.plugins.google.TTS)**: Reference for the Google Cloud TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-google)**: View the source or contribute to the LiveKit Google Cloud TTS plugin.

- **[Google Cloud docs](https://cloud.google.com/text-to-speech/docs)**: Google Cloud TTS docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Google Cloud TTS.

- **[Google ecosystem guide](https://docs.livekit.io/agents/integrations/google.md)**: Overview of the entire Google AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:14.668Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/google.md](https://docs.livekit.io/agents/integrations/tts/google.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).