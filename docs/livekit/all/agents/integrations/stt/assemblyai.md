LiveKit Docs › Integration guides › Speech-to-text (STT) › AssemblyAI

---

# AssemblyAI integration guide

> How to use the AssemblyAI STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[AssemblyAI](https://www.assemblyai.com/docs/speech-to-text/streaming) provides a streaming STT service with high accuracy, realtime transcription. You can use the open source AssemblyAI plugin for LiveKit Agents to build voice AI with fast, accurate transcription.

## Quick reference

This section provides a brief overview of the AssemblyAI STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[assemblyai]~=1.2"

```

### Authentication

The AssemblyAI plugin requires an [AssemblyAI API key](https://www.assemblyai.com/docs/api-reference/overview#authorization).

Set `ASSEMBLYAI_API_KEY` in your `.env` file.

### Usage

Use AssemblyAI STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import assemblyai

session = AgentSession(
    stt = assemblyai.STT(),
    # ... vad, llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/assemblyai/stt.html.md) for a complete list of all available parameters.

- **`format_turns`** _(bool)_ (optional) - Default: `True`: Whether to return formatted final transcripts. If enabled, formatted final transcripts are emitted shortly following an end-of-turn detection.

- **`end_of_turn_confidence_threshold`** _(float)_ (optional) - Default: `0.7`: The confidence threshold to use when determining if the end of a turn has been reached.

- **`min_end_of_turn_silence_when_confident`** _(int)_ (optional) - Default: `160`: The minimum duration of silence required to detect end of turn when confident.

- **`max_turn_silence`** _(int)_ (optional) - Default: `2400`: The maximum duration of silence allowed in a turn before end of turn is triggered.

## Turn detection

AssemblyAI includes a custom phrase endpointing model that uses both audio and linguistic information to detect turn boundaries. To use this model for [turn detection](https://docs.livekit.io/agents/build/turns.md), set `turn_detection="stt"` in the `AgentSession` constructor. You should also provide a VAD plugin for responsive interruption handling.

```python
session = AgentSession(
    turn_detection="stt",
    stt=assemblyai.STT(
      end_of_turn_confidence_threshold=0.7,
      min_end_of_turn_silence_when_confident=160,
      max_turn_silence=2400,
    ),
    vad=silero.VAD.load(), # Recommended for responsive interruption handling
    # ... llm, tts, etc.
)

```

## Additional resources

The following resources provide more information about using AssemblyAI with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-assemblyai/)**: The `livekit-plugins-assemblyai` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/assemblyai/stt.html.md)**: Reference for the AssemblyAI STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-assemblyai)**: View the source or contribute to the LiveKit AssemblyAI STT plugin.

- **[AssemblyAI docs](https://www.assemblyai.com/docs/speech-to-text/universal-streaming)**: AssemblyAI's full docs for the Universal Streaming API.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and AssemblyAI.

- **[AssemblyAI LiveKit guide](https://www.assemblyai.com/docs/integrations/livekit)**: Guide to using AssemblyAI Universal Streaming STT with LiveKit.

---

This document was rendered at 2025-09-27T09:36:06.925Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/assemblyai.md](https://docs.livekit.io/agents/integrations/stt/assemblyai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).