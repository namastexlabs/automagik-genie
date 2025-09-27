LiveKit Docs › Integration guides › Text-to-speech (TTS) › Overview

---

# Text-to-speech (TTS) integrations

> Guides for adding TTS integrations to your agents.

## Overview

Text-to-speech (TTS) models produce realtime synthetic speech from text input. In voice AI, this allows a text-based [LLM](https://docs.livekit.io/agents/integrations/llm.md) to speak its response to the user.

## Available providers

The agents framework includes plugins for the following TTS providers out-of-the-box. Choose a provider from the list for a step-by-step guide. You can also implement the [TTS node](https://docs.livekit.io/agents/build/nodes.md#tts_node) to provide custom behavior or an alternative provider.

All TTS providers support high quality, low-latency, and lifelike multilingual voice synthesis. Support for other features is noted in the following table.

| Provider | Plugin | Notes | Available in |
| -------- | ------ | ----- | ------------ |
| [Amazon Polly](https://docs.livekit.io/agents/integrations/tts/aws.md) | `aws` |  | Python |
| [Azure AI Speech](https://docs.livekit.io/agents/integrations/tts/azure.md) | `azure` |  | Python |
| [Azure OpenAI](https://docs.livekit.io/agents/integrations/tts/azure-openai.md) | `openai` |  | Python |
| [Baseten](https://docs.livekit.io/agents/integrations/tts/baseten.md) | `baseten` |  | Python |
| [Cartesia](https://docs.livekit.io/agents/integrations/tts/cartesia.md) | `cartesia` |  | Python, Nodejs |
| [Deepgram](https://docs.livekit.io/agents/integrations/tts/deepgram.md) | `deepgram` |  | Python |
| [ElevenLabs](https://docs.livekit.io/agents/integrations/tts/elevenlabs.md) | `elevenlabs` |  | Python, Nodejs |
| [Gemini](https://docs.livekit.io/agents/integrations/tts/gemini.md) | `google` |  | Python, Nodejs |
| [Google Cloud](https://docs.livekit.io/agents/integrations/tts/google.md) | `google` |  | Python |
| [Groq](https://docs.livekit.io/agents/integrations/tts/groq.md) | `groq` |  | Python |
| [Hume](https://docs.livekit.io/agents/integrations/tts/hume.md) | `hume` |  | Python |
| [Inworld](https://docs.livekit.io/agents/integrations/tts/inworld.md) | `inworld` |  | Python |
| [LMNT](https://docs.livekit.io/agents/integrations/tts/lmnt.md) | `lmnt` |  | Python |
| [Neuphonic](https://docs.livekit.io/agents/integrations/tts/neuphonic.md) | `neuphonic` |  | Python |
| [OpenAI](https://docs.livekit.io/agents/integrations/tts/openai.md) | `openai` |  | Python, Nodejs |
| [PlayHT](https://docs.livekit.io/agents/integrations/tts/playai.md) | `playai` |  | Python |
| [Resemble AI](https://docs.livekit.io/agents/integrations/tts/resemble.md) | `resemble` |  | Python |
| [Rime](https://docs.livekit.io/agents/integrations/tts/rime.md) | `rime` |  | Python |
| [Sarvam](https://docs.livekit.io/agents/integrations/tts/sarvam.md) | `sarvam` |  | Python |
| [Smallest AI](https://docs.livekit.io/agents/integrations/tts/smallestai.md) | `smallestai` |  | Python |
| [Speechify](https://docs.livekit.io/agents/integrations/tts/speechify.md) | `speechify` |  | Python |
| [Spitch](https://docs.livekit.io/agents/integrations/tts/spitch.md) | `spitch` |  | Python |

Have another provider in mind? LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/integrations.md#contribute).

## How to use

The following sections describe high-level usage only.

For more detailed information about installing and using plugins, see the [plugins overview](https://docs.livekit.io/agents/integrations.md#install).

### Usage in `AgentSession`

Construct an `AgentSession` or `Agent` with a `TTS` instance created by your desired plugin:

```python
from livekit.agents import AgentSession
from livekit.plugins import cartesia

session = AgentSession(
    tts=cartesia.TTS(model="sonic-english")
)

```

`AgentSession` automatically sends LLM responses to the TTS model, and also supports a `say` method for one-off responses.

### Standalone usage

You can also use a `TTS` instance in a standalone fashion by creating a stream. You can use `push_text` to add text to the stream, and then consume a stream of `SynthesizedAudio` as to publish as [realtime audio](https://docs.livekit.io/home/client/tracks.md) to another participant.

Here is an example of a standalone TTS app:

** Filename: `agent.py`**

```python
from livekit import agents, rtc
from livekit.agents.tts import SynthesizedAudio
from livekit.plugins import cartesia
from typing import AsyncIterable

async def entrypoint(ctx: agents.JobContext):
    text_stream: AsyncIterable[str] = ... # you need to provide a stream of text
    audio_source = rtc.AudioSource(44100, 1)

    track = rtc.LocalAudioTrack.create_audio_track("agent-audio", audio_source)
    await ctx.room.local_participant.publish_track(track)

    tts = cartesia.TTS(model="sonic-english")
    tts_stream = tts.stream()

    # create a task to consume and publish audio frames
    ctx.create_task(send_audio(tts_stream))

    # push text into the stream, TTS stream will emit audio frames along with events
    # indicating sentence (or segment) boundaries.
    async for text in text_stream:
        tts_stream.push_text(text)
    tts_stream.end_input()

    async def send_audio(audio_stream: AsyncIterable[SynthesizedAudio]):
        async for a in audio_stream:
            await audio_source.capture_frame(a.audio.frame)

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))

```

## Further reading

- **[Agent speech docs](https://docs.livekit.io/agents/build/audio.md)**: Explore the speech capabilities and features of LiveKit Agents.

- **[Pipeline nodes](https://docs.livekit.io/agents/build/nodes.md)**: Learn how to customize the behavior of your agent by overriding nodes in the voice pipeline.

---

This document was rendered at 2025-09-27T09:36:12.175Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts.md](https://docs.livekit.io/agents/integrations/tts.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).