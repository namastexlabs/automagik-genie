LiveKit Docs › Integration guides › Overview

---

# LiveKit Agents integrations

> Guides for integrating supported AI providers into LiveKit Agents.

## Overview

LiveKit Agents includes support for a wide variety of AI providers, from the largest research companies to emerging startups.

The open source plugin interface makes it easy to adopt the best AI providers for your app, without needing customized code for each.

## Installing plugins

Each provider is available as a separate plugin package, included as an optional dependency on the base SDK for Python.

For example, to install the SDK with the Cartesia, Deepgram, and OpenAI plugins, run the following command:

```shell
pip install "livekit-agents[cartesia,deepgram,openai]~=1.2"

```

You may also install plugins as individual packages. For example, this is equivalent to the previous command:

** Filename: `Install plugins`**

```shell
pip install \
  "livekit-agents~=1.2" \
  "livekit-plugins-cartesia~=1.2" \
  "livekit-plugins-deepgram~=1.2" \
  "livekit-plugins-openai~=1.2"

```

** Filename: `Install plugins`**

```shell
pnpm add \
  "@livekit/agents@1.x" \
  "@livekit/agents-plugins-elevenlabs@1.x" \
  "@livekit/agents-plugins-deepgram@1.x" \
  "@livekit/agents-plugins-openai@1.x"

```

## Using plugins

The AgentSession class accepts plugins as arguments using a standard interface. Each plugin loads its own associated API key from environment variables. For instance, the following code creates an AgentSession that uses the OpenAI, Cartesia, and Deepgram plugins installed in the preceding section:

** Filename: `agent.py`**

```python
from livekit.plugins import openai, cartesia, deepgram

session = AgentSession(
    llm=openai.LLM(model="gpt-4o"),
    tts=cartesia.TTS(model="sonic-english"),
    stt=deepgram.STT(model="nova-2"),
)  

```

** Filename: `.env`**

```shell
OPENAI_API_KEY=<your-openai-api-key>
DEEPGRAM_API_KEY=<your-deepgram-api-key>
CARTESIA_API_KEY=<your-cartesia-api-key>

```

** Filename: `agent.ts`**

```typescript
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
   llm: new openai.LLM(),
   tts: new elevenlabs.TTS(),
   stt: new deepgram.STT(),
});

```

** Filename: `.env`**

```shell
OPENAI_API_KEY=<your-openai-api-key>
DEEPGRAM_API_KEY=<your-deepgram-api-key>
ELEVEN_API_KEY=<your-elevenlabs-api-key>

```

## OpenAI API compatibility

Many providers have standardized around the OpenAI API format for chat completions and more. The LiveKit Agents OpenAI plugin provides easy compatibility with many of these providers through special methods which load the correct API key from environment variables. For instance, to use Cerebras instead of OpenAI, you can use the following code:

** Filename: `agent.py`**

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_cerebras(model="llama-3.3-70b"),
    # ... stt, tts, etc ..
)  

```

** Filename: `.env`**

```shell
CEREBRAS_API_KEY=<your-cerebras-api-key>
# ... other api keys ...

```

** Filename: `agent.ts`**

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
   llm: openai.LLM.with_cerebras("llama-3.1-70b"),
   // ... stt, tts, etc ...
});

```

** Filename: `.env`**

```shell
CEREBRAS_API_KEY=<your-cerebras-api-key>
# ... other api keys ...

```

## Core plugins

The following are the core plugin types used in LiveKit Agents, to handle the primary voice AI tasks. Many providers are available for most functions.

- **[Realtime models](https://docs.livekit.io/agents/integrations/realtime.md)**: Plugins for multimodal speech-to-speech models like the OpenAI Realtime API.

- **[Large language models (LLM)](https://docs.livekit.io/agents/integrations/llm.md)**: Plugins for AI models from OpenAI, Anthropic, and more.

- **[Speech-to-text (STT)](https://docs.livekit.io/agents/integrations/stt.md)**: Plugins for speech-to-text solutions like Deepgram, Whisper, and more.

- **[Text-to-speech (TTS)](https://docs.livekit.io/agents/integrations/tts.md)**: Plugins for text-to-speech solutions like Cartesia, ElevenLabs, and more.

- **[Virtual Avatars](https://docs.livekit.io/agents/integrations/avatar.md)**: Plugins for virtual avatar solutions like Hedra, Tavus, and more.

## Additional plugins

LiveKit Agents also includes the following additional specialized plugins, which are recommended for most voice AI use cases. Each runs locally and requires no additional API keys.

- **[Silero VAD](https://docs.livekit.io/agents/build/turns/vad.md)**: Voice activity detection with Silero VAD.

- **[LiveKit turn detector](https://docs.livekit.io/agents/build/turns/turn-detector.md)**: A custom LiveKit model for improved end-of-turn detection.

- **[Enhanced noise cancellation](https://pypi.org/project/livekit-plugins-noise-cancellation/)**: LiveKit Cloud enhanced noise cancellation to improve voice AI performance.

## Build your own plugin

The LiveKit Agents plugin framework is extensible and community-driven. Your plugin can integrate with new providers or directly load models for local inference. LiveKit especially welcomes new TTS, STT, and LLM plugins.

To learn more, see the guidelines for contributions to the [Python](https://github.com/livekit/agents/blob/main/CONTRIBUTING.md) and [Node.js](https://github.com/livekit/agents-js/blob/main/CONTRIBUTING.md) SDKs.

---

This document was rendered at 2025-09-27T09:35:55.545Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations.md](https://docs.livekit.io/agents/integrations.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).