LiveKit Docs › Integration guides › Speech-to-text (STT) › Overview

---

# Speech-to-text (STT) integrations

> Guides for adding STT integrations to your agents.

## Overview

Speech-to-text (STT) models process incoming audio and convert it to text in realtime. In voice AI, this text is then processed by an [LLM](https://docs.livekit.io/agents/integrations/llm.md) to generate a response which is turn turned backed to speech using a [TTS](https://docs.livekit.io/agents/integrations/tts.md) model.

## Available providers

The agents framework includes plugins for the following STT providers out-of-the-box. Choose a provider from the list for a step-by-step guide. You can also implement the [STT node](https://docs.livekit.io/agents/build/nodes.md#stt_node) to provide custom behavior or an alternative provider.

All STT providers support low-latency multilingual transcription. Support for other features is noted in the following table.

| Provider | Plugin | Notes | Available in |
| -------- | ------ | ----- | ------------ |
| [AssemblyAI](https://docs.livekit.io/agents/integrations/stt/assemblyai.md) | `assemblyai` |  | Python |
| [Amazon Transcribe](https://docs.livekit.io/agents/integrations/stt/aws.md) | `aws` |  | Python |
| [Azure AI Speech](https://docs.livekit.io/agents/integrations/stt/azure.md) | `azure` |  | Python |
| [Azure OpenAI](https://docs.livekit.io/agents/integrations/stt/azure-openai.md) | `openai` |  | Python |
| [Baseten](https://docs.livekit.io/agents/integrations/stt/baseten.md) | `baseten` |  | Python |
| [Cartesia](https://docs.livekit.io/agents/integrations/stt/cartesia.md) | `cartesia` |  | Python |
| [Clova](https://docs.livekit.io/agents/integrations/stt/clova.md) | `clova` |  | Python |
| [Deepgram](https://docs.livekit.io/agents/integrations/stt/deepgram.md) | `deepgram` |  | Python, Nodejs |
| [fal](https://docs.livekit.io/agents/integrations/stt/fal.md) | `fal` |  | Python |
| [Gladia](https://docs.livekit.io/agents/integrations/stt/gladia.md) | `gladia` |  | Python |
| [Google Cloud](https://docs.livekit.io/agents/integrations/stt/google.md) | `google` |  | Python |
| [Groq](https://docs.livekit.io/agents/integrations/stt/groq.md) | `groq` |  | Python, Nodejs |
| [Mistral AI](https://docs.livekit.io/agents/integrations/stt/mistralai.md) | `mistralai` |  | Python |
| [OpenAI](https://docs.livekit.io/agents/integrations/stt/openai.md) | `openai` |  | Python, Nodejs |
| [Sarvam](https://docs.livekit.io/agents/integrations/stt/sarvam.md) | `sarvam` |  | Python |
| [Soniox](https://docs.livekit.io/agents/integrations/stt/soniox.md) | `soniox` |  | Python |
| [Speechmatics](https://docs.livekit.io/agents/integrations/stt/speechmatics.md) | `speechmatics` |  | Python |
| [Spitch](https://docs.livekit.io/agents/integrations/stt/spitch.md) | `spitch` |  | Python |

Have another provider in mind? LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/integrations.md#contribute).

## How to use

The following sections describe high-level usage only.

For more detailed information about installing and using plugins, see the [plugins overview](https://docs.livekit.io/agents/integrations.md#install).

### Usage in `AgentSession`

Construct an `AgentSession` or `Agent` with an `STT` instance created by your desired plugin:

```python
from livekit.agents import AgentSession
from livekit.plugins import deepgram

session = AgentSession(
    stt=deepgram.STT(model="nova-2")
)

```

`AgentSession` automatically integrates with VAD to detect user turns and know when to start and stop STT.

### Standalone usage

You can also use an `STT` instance in a standalone fashion by creating a stream. You can use `push_frame` to add [realtime audio frames](https://docs.livekit.io/home/client/tracks.md) to the stream, and then consume a stream of `SpeechEvent` as output.

Here is an example of a standalone STT app:

** Filename: `agent.py`**

```python
import asyncio

from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents.stt import SpeechEventType, SpeechEvent
from typing import AsyncIterable
from livekit.plugins import (
    deepgram,
)

load_dotenv()

async def entrypoint(ctx: agents.JobContext):
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.RemoteTrack):
        print(f"Subscribed to track: {track.name}")

        asyncio.create_task(process_track(track))

    async def process_track(track: rtc.RemoteTrack):
        stt = deepgram.STT(model="nova-2")
        stt_stream = stt.stream()
        audio_stream = rtc.AudioStream(track)

        async with asyncio.TaskGroup() as tg:
            # Create task for processing STT stream
            stt_task = tg.create_task(process_stt_stream(stt_stream))

            # Process audio stream
            async for audio_event in audio_stream:
                stt_stream.push_frame(audio_event.frame)

            # Indicates the end of the audio stream
            stt_stream.end_input()

            # Wait for STT processing to complete
            await stt_task

    async def process_stt_stream(stream: AsyncIterable[SpeechEvent]):
        try:
            async for event in stream:
                if event.type == SpeechEventType.FINAL_TRANSCRIPT:
                    print(f"Final transcript: {event.alternatives[0].text}")
                elif event.type == SpeechEventType.INTERIM_TRANSCRIPT:
                    print(f"Interim transcript: {event.alternatives[0].text}")
                elif event.type == SpeechEventType.START_OF_SPEECH:
                    print("Start of speech")
                elif event.type == SpeechEventType.END_OF_SPEECH:
                    print("End of speech")
        finally:
            await stream.aclose()


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))


```

#### VAD and StreamAdapter

Some STT providers or models, such as [Whisper](https://github.com/openai/whisper) don't support streaming input. In these cases, your app must determine when a chunk of audio represents a complete segment of speech. You can do this using VAD together with the `StreamAdapter` class.

The following example modifies the previous example to use VAD and `StreamAdapter` to buffer user speech until VAD detects the end of speech:

```python
from livekit import agents, rtc
from livekit.plugins import openai, silero

async def process_track(ctx: agents.JobContext, track: rtc.Track):
  whisper_stt = openai.STT()
  vad = silero.VAD.load(
    min_speech_duration=0.1,
    min_silence_duration=0.5,
  )
  vad_stream = vad.stream()
  # StreamAdapter will buffer audio until VAD emits END_SPEAKING event
  stt = agents.stt.StreamAdapter(whisper_stt, vad_stream)
  stt_stream = stt.stream()
  ...

```

## Further reading

- **[Text and transcriptions](https://docs.livekit.io/agents/build/text.md)**: Integrate realtime text features into your agent.

- **[Pipeline nodes](https://docs.livekit.io/agents/build/nodes.md)**: Learn how to customize the behavior of your agent by overriding nodes in the voice pipeline.

---

This document was rendered at 2025-09-27T09:36:06.643Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt.md](https://docs.livekit.io/agents/integrations/stt.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).