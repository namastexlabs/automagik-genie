LiveKit Docs › v0.x migration guides › Node.js

---

# Agents v0.x migration guide - Node.js

> Migrate your Node.js agents from version 0.x to 1.0.

## Overview

This guide provides an overview of the changes between Agents v0.x and Agents 1.0 for Node.js, released in August 2025. Agents running on v0.x continue to work in LiveKit Cloud, but this version of the framework is no longer receiving updates or support. Migrate your agents to 1.x to continue receiving the latest features and bug fixes.

## Unified agent interface

Agents 1.0 introduces `AgentSession`, a single, unified [agent orchestrator](https://docs.livekit.io/agents/build.md#agent-sessions) that serves as the foundation for all types of agents built using the framework.  With this change, the `VoicePipelineAgent` and `MultimodalAgent` classes have been deprecated and 0.x agents will need to be updated to use `AgentSession` in order to be compatible with 1.0 and later.

`AgentSession` contains a superset of the functionality of `VoicePipelineAgent` and `MultimodalAgent`, allowing you to switch between pipelined and speech-to-speech models without changing your core application logic.

**Version 0.x**:

```typescript
import {
  type JobContext,
  WorkerOptions,
  defineAgent,
  llm,
  pipeline,
} from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const vad = await silero.VAD.load() as silero.VAD;
    const initialContext = new llm.ChatContext().append({
      role: llm.ChatRole.SYSTEM,
      text: 'You are a helpful voice AI assistant.',
    });

    const agent = new pipeline.VoicePipelineAgent(
      vad,
      new deepgram.STT(),
      new openai.LLM(),
      new openai.TTS(),
      { chatCtx: initialContext, fncCtx, turnDetector: new livekit.turnDetector.EOUModel() },
    );
    
    await agent.start(ctx.room, participant);

    await agent.say('Hey, how can I help you today?', true);
  },
});

```

---

**Version 1.0**:

```typescript
import {
  type JobContext,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const agent = new voice.Agent({
      instructions:
        "You are a helpful voice AI assistant.",
    });

    const vad = await silero.VAD.load() as silero.VAD;

    const session = new voice.AgentSession({
      vad,
      stt: new deepgram.STT(),
      tts: new elevenlabs.TTS(),
      llm: new openai.LLM(),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });
    
    // if using realtime api, use the following
    // session = AgentSession({
    //   llm: new openai.realtime.RealtimeModel({ voice: "echo" })
    // })

    await session.start({
      room: ctx.room,
      agent,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    // Instruct the agent to speak first
    const handle = session.generateReply('say hello to the user');
    await handle.waitForPlayout();
  },
});

```

## Customizing pipeline behavior

Agents 1.0 introduces more flexibility for developers to customize the behavior of agents through the use of [pipeline nodes](https://docs.livekit.io/agents/build/nodes.md). Nodes enable custom processing within the pipeline steps, while also delegating to the default implementation of each node as needed.

Pipeline nodes replaces the `BeforeLLMCallback` and `BeforeTTSCallback` callbacks.

### BeforeLLMCallback -> llmNode

`BeforeLLMCallback` is replaced by `llmNode`. This [node](https://docs.livekit.io/agents/build/nodes.md#llm_node) can be used to modify the chat context before sending it to LLM, or integrate with custom LLM providers without having to create a plugin. As long as it returns `ReadableStream[llm.ChatChunk]`, the LLM node forwards the chunks to the next node in the pipeline.

**Version 0.x**:

```tsx
const addRagContext: BeforeLLMCallback = (agent, chatCtx) => {
  const ragContext: string = retrieve(chatCtx);
  chatCtx.append({ text: ragContext, role: llm.ChatRole.SYSTEM });
};

const agent = new VoicePipelineAgent(
  ...
  { 
    ...
    beforeLLMCallback: addRagContext 
  }
);

```

---

**Version 1.0**:

```tsx
class MyAgent extends voice.Agent {
  // override method from superclass to customize behavior
  async llmNode(
    chatCtx: llm.ChatContext,
    toolCtx: llm.ToolContext,
    modelSettings: voice.ModelSettings,
  ): Promise<ReadableStream<llm.ChatChunk | string> | null> {
    const ragContext: string = retrieve(chatCtx);
    chatCtx.addMessage({ content: ragContext, role: 'system' });

    return voice.Agent.default.llmNode(this, chatCtx, toolCtx, modelSettings);
  }
}

```

### BeforeTTSCallback -> ttsNode

`BeforeTTSCallback` is replaced by `ttsNode`. This [node](https://docs.livekit.io/agents/build/nodes.md#tts_node) gives greater flexibility in customizing the TTS pipeline. It's possible to modify the text before synthesis, as well as the audio buffers after synthesis.

**Version 0.x**:

```tsx
const beforeTtsCb: BeforeTTSCallback = (agent, source) => {
  // The TTS is incorrectly pronouncing "LiveKit", so we'll replace it
  if (typeof source === 'string') {
    return source.replace(/\bLiveKit\b/gi, 'Live Kit');
  }
  
  return (async function* () {
    for await (const chunk of source) {
      yield chunk.replace(/\bLiveKit\b/gi, 'Live Kit');
    }
  })();
};

const agent = new VoicePipelineAgent(
  ...
  { 
    ...
    beforeTTSCallback: beforeTtsCb 
  }
);

```

---

**Version 1.0**:

```tsx
class MyAgent extends voice.Agent {
  async ttsNode(
    text: ReadableStream<string>,
    modelSettings: voice.ModelSettings,
  ): Promise<ReadableStream<AudioFrame> | null> {
    const replaceWords = (text: ReadableStream<string>): ReadableStream<string> => {
      // ...
    };

    // use default implementation, but pre-process the text
    return voice.Agent.default.ttsNode(this, replaceWords(text), modelSettings);
  }
}

```

## Tool definition and use

Agents 1.0 streamlines the way in which [tools](https://docs.livekit.io/agents/build/tools.md) are defined for use within your agents, making it easier to add and maintain agent tools. When migrating from 0.x to 1.0, developers need to make the following changes to existing use of functional calling within their agents in order to be compatible with versions 1.0 and later.

- Instead of defining tools in a separate `FunctionContext` object that gets passed to the agent constructor, tools are now defined directly in the agent configuration using `llm.tool()`.
- The `execute` function now receives a second argument `{ ctx }` that provides access to the current agent state.
- Tools are automatically accessible to the LLM without needing to be explicitly passed in through the constructor.

**Version 0.x**:

```tsx
import { llm, pipeline } from '@livekit/agents';
import { z } from 'zod';

const fncCtx: llm.FunctionContext = {
  getWeather: {
    description: 'Get weather information for a location',
    parameters: z.object({
      location: z.string(),
    }),
    execute: async ({ location }) => {
      ...
      return `The weather in ${location} right now is Sunny.`;
    },
  },
};

const agent = new pipeline.VoicePipelineAgent(
  ...
  { 
    ...
    fncCtx,
  }
);

```

---

**Version 1.0**:

```tsx
import { llm, voice } from '@livekit/agents';
import { z } from 'zod';

const agent = new voice.Agent({
  instructions: "You are a helpful assistant.",
  tools: {
    getWeather: llm.tool({
      description: 'Look up weather information for a given location.',
      parameters: z.object({
        location: z.string().describe('The location to look up weather information for.'),
      }),
      execute: async ({ location }, { ctx }) => {
        return { weather: "sunny", temperatureF: 70 };
      },
    }),
  },
});

```

## Chat context

ChatContext has been overhauled in 1.0 to provide a more powerful and flexible API for managing chat history. It now accounts for differences between LLM providers—such as stateless and stateful APIs—while exposing a unified interface.

Chat history can now include three types of items:

- `ChatMessage`: a message associated with a role (e.g., user, assistant). Each message includes a list of `content` items, which can contain text, images, or audio.
- `FunctionCall`: a function call initiated by the LLM.
- `FunctionCallOutput`: the result returned from a function call.

### Updating chat context

In 0.x, updating the chat context required modifying chat_ctx.messages directly. This approach was error-prone and difficult to time correctly, especially with realtime APIs.

In v1.x, there are two supported ways to update the chat context:

- **Agent handoff** – [transferring control](https://docs.livekit.io/agents/build/workflows.md#tool-handoff) to a new agent, which has its own chat context.
- **Explicit update** - calling `agent.updateChatCtx()` to modify the context directly.

## Transcriptions

Agents 1.0 brings some new changes to how [transcriptions](https://docs.livekit.io/agents/build/text.md#transcriptions) are handled:

- Transcriptions now use [text streams](https://docs.livekit.io/home/client/data/text-streams.md) with topic `lk.transcription`.
- The old `TranscriptionEvent` protocol is deprecated and will be removed in a future version.

## Accepting text input

Agents 1.0 introduces [improved support for text input](https://docs.livekit.io/agents/build/text.md#text-input). Previously, text had to be manually intercepted and injected into the agent's chat context.

In this version, agents automatically receive text input from a text stream on the `lk.chat` topic.

## State change events

### User state

`user_started_speaking` and `user_stopped_speaking` events are no longer emitted. They've been combined into a single `user_state_changed` event.

**Version 0.x**:

```tsx
import { pipeline } from '@livekit/agents';

agent.on(pipeline.VPAEvent.USER_STARTED_SPEAKING, () => {
  console.log("User started speaking");
});

```

---

**Version 1.0**:

```tsx
session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => {
  // userState could be "speaking", "listening", or "away"
  console.log(`state change from ${ev.oldState} to ${ev.newState}`);
});

```

### Agent state

**Version 0.x**:

```tsx
import { pipeline } from '@livekit/agents';

agent.on(pipeline.VPAEvent.AGENT_STARTED_SPEAKING, () => {
  // Log transcribed message from user
  console.log("Agent started speaking");
});

```

---

**Version 1.0**:

```tsx
session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
  // AgentState could be "initializing", "idle", "listening", "thinking", "speaking"
  // newState is set as a participant attribute `lk.agent.state` to notify frontends
  console.log(`state change from ${ev.oldState} to ${ev.newState}`);
});

```

## Other events

Agent events were overhauled in version 1.0. For details, see the [events](https://docs.livekit.io/agents/build/events.md) page.

---

This document was rendered at 2025-09-27T09:36:22.873Z.
For the latest version of this document, see [https://docs.livekit.io/agents/v0-migration/node.md](https://docs.livekit.io/agents/v0-migration/node.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).