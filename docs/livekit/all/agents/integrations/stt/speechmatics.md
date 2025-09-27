LiveKit Docs › Integration guides › Speech-to-text (STT) › Speechmatics

---

# Speechmatics STT integration guide

> How to use the Speechmatics STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Speechmatics](https://www.speechmatics.com/) provides enterprise-grade speech-to-text APIs. Their advanced speech models deliver highly accurate transcriptions across diverse languages, dialects, and accents. You can use the LiveKit Speechmatics plugin with the Agents framework to build voice AI agents that provide reliable, realtime transcriptions.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[speechmatics]~=1.2"

```

### Authentication

The Speechmatics plugin requires an [API key](https://docs.speechmatics.com/introduction/authentication).

Set `SPEECHMATICS_API_KEY` in your `.env` file.

### Usage

Use Speechmatics STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import speechmatics

session = AgentSession(
   stt = speechmatics.STT(),
   # ... llm, tts, etc.
)

```

### Speaker diarization

You can enable [speaker diarization](https://docs.speechmatics.com/features/diarization#speaker-diarization) to identify individual speakers and their speech. When enabled, the transcription output can include this information through the `speaker_id` and `text` attributes.

See the following for example configurations and outputs:

- `<{speaker_id}>{text}</{speaker_id}>`: `<S1>Hello</S1>`.
- `[Speaker {speaker_id}] {text}`: `[Speaker S1] Hello`.

```python
stt = speechmatics.STT(
   enable_diarization=True,
   speaker_active_format="<{speaker_id}>{text}</{speaker_id}>",
)

```

Inform the LLM of the format for speaker identification by including it in your agent instructions. For a an example, see the following:

- **[Speechmatics STT speaker diarization](https://github.com/livekit/agents/blob/main/examples/voice_agents/speaker_id_multi_speaker.py)**: An example of using Speechmatics to identify speakers in a multi-speaker conversation.

### Parameters

This section describes the key parameters for the Speechmatics STT plugin. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/speechmatics/index.html.md#livekit.plugins.speechmatics.STT) for a complete list of all available parameters.

- **`operating_point`** _(string)_ (optional) - Default: `enhanced`: Operating point to use for the transcription. This parameter balances accuracy, speed, and resource usage. To learn more, see [Operating points](https://docs.speechmatics.com/speech-to-text/#operating-points).

- **`language`** _(string)_ (optional) - Default: `en`: ISO 639-1 language code. All languages are global, meaning that regardless of which language you select, the system can recognize different dialects and accents. To see the full list, see [Supported Languages](https://docs.speechmatics.com/introduction/supported-languages).

- **`enable_partials`** _(bool)_ (optional) - Default: `true`: Enable partial transcripts. Partial transcripts allow you to receive preliminary transcriptions and update as more context is available until the higher-accuracy [final transcript](https://docs.speechmatics.com/rt-api-ref#addtranscript) is returned. Partials are returned faster but without any post-processing such as formatting. When enabled, the STT service emits `INTERIM_TRANSCRIPT` events.

- **`enable_diarization`** _(bool)_ (optional) - Default: `false`: Enable speaker diarization. When enabled, spoken words are attributed to unique speakers. You can use the `speaker_sensitivity` parameter to adjust the sensitivity of diarization. To learn more, see [Diarization](https://docs.speechmatics.com/speech-to-text/features/diarization).

- **`max_delay`** _(number)_ (optional) - Default: `1.0`: The maximum delay in seconds between the end of a spoken word and returning the final transcript results. Lower values can have an impact on accuracy.

- **`end_of_utterance_silence_trigger`** _(float)_ (optional) - Default: `0.5`: The maximum delay in seconds of silence after the end of turn before the STT service returns the final transcript.

- **`end_of_utterance_mode`** _(EndOfUtteranceMode)_ (optional) - Default: `EndOfUtteranceMode.FIXED`: The delay mode to use for triggering end of turn. Valid values are:

- `EndOfUtteranceMode.FIXED`: Delay is fixed to the value of `end_of_utterance_silence_trigger`.
- `EndOfUtteranceMode.ADAPTIVE`: Delay can be adjusted by the content of what the most recent speaker has said, including rate of speech and speaking patterns (for example, pauses).
- `EndOfUtteranceMode.NONE`: Disables end of turn detection and uses a fallback timer.
To use LiveKit's [end of turn detector model](https://docs.livekit.io/agents/build/turns.md#turn-detector-model), set this parameter to `EndOfUtteranceMode.NONE`.

- **`speaker_active_format`** _(string)_ (optional): Formatter for speaker identification in transcription output. The following attributes are available:

- `{speaker_id}`: The ID of the speaker.
- `{text}`: The text spoken by the speaker.
By default, if speaker diarization is enabled and this parameter is not set, the transcription output is _not_ formatted for speaker identification.

The system instructions for the language model might need to include any necessary instructions to handle the formatting. To learn more, see [Speaker diarization](#speaker-diarization).

- **`diarization_sensitivity`** _(float)_ (optional) - Default: `0.5`: Sensitivity of speaker detection. Valid values are between `0` and `1`. Higher values increase sensitivity and can help when two or more speakers have similar voices. To learn more, see [Speaker sensitivity](https://docs.speechmatics.com/speech-to-text/features/diarization#speaker-sensitivity).

The `enable_diarization` parameter must be set to `True` for this parameter to take effect.

- **`prefer_current_speaker`** _(bool)_ (optional) - Default: `false`: When speaker diarization is enabled and this is set to `True`, it reduces the likelihood of switching between similar sounding speakers. To learn more, see [Prefer current speaker](https://docs.speechmatics.com/speech-to-text/features/diarization#prefer-current-speaker).

## Additional resources

The following resources provide more information about using Speechmatics with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-speechmatics/)**: The `livekit-plugins-speechmatics` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/speechmatics/index.html.md#livekit.plugins.speechmatics.STT)**: Reference for the Speechmatics STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-speechmatics)**: View the source or contribute to the LiveKit Speechmatics STT plugin.

- **[Speechmatics docs](https://docs.speechmatics.com/introduction/)**: Speechmatics STT docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Speechmatics STT.

---

This document was rendered at 2025-09-27T09:36:11.578Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/speechmatics.md](https://docs.livekit.io/agents/integrations/stt/speechmatics.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).