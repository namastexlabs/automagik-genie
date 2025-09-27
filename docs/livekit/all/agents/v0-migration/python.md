LiveKit Docs › v0.x migration guides › Python

---

# Agents v0.x migration guide - Python

> Migrate your Python-based agents from version v0.x to 1.0.

## Overview

This guide provides an overview of the changes between Agents v0.x and Agents 1.0 for Python, released in April 2025. Agents running on v0.x continue to work in LiveKit Cloud, but this version of the framework is no longer receiving updates or support. Migrate your agents to 1.x to continue receiving the latest features and bug fixes.

## Unified agent interface

Agents 1.0 introduces `AgentSession`, a single, unified [agent orchestrator](https://docs.livekit.io/agents/build.md#agent-sessions) that serves as the foundation for all types of agents built using the framework.  With this change, the `VoicePipelineAgent` and `MultimodalAgent` classes have been deprecated and 0.x agents will need to be updated to use `AgentSession` in order to be compatible with 1.0 and later.

`AgentSession` contains a superset of the functionality of `VoicePipelineAgent` and `MultimodalAgent`, allowing you to switch between pipelined and speech-to-speech models without changing your core application logic.

> ℹ️ **Note**
> 
> The following code highlights the differences between Agents v0.x and Agents 1.0. For a full working example, see the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Version 0.x**:

```python
from livekit.agents import JobContext, llm
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import (
    cartesia,
    deepgram,
    google,
    silero,
)

async def entrypoint(ctx: JobContext):
    initial_ctx = llm.ChatContext().append(
        role="system",
        text="You are a helpful voice AI assistant.",
    )

    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=google.LLM(),
        tts=cartesia.TTS(),
    )

    await agent.start(room, participant)

    await agent.say("Hey, how can I help you today?", allow_interruptions=True)


```

---

**Version 1.0**:

```python
from livekit.agents import (
    AgentSession,
    Agent,
    llm,
    RoomInputOptions
)
from livekit.plugins import (
    elevenlabs,
    deepgram,
    google,
    openai,
    silero,
    noise_cancellation,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant.")


async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt=deepgram.STT(),
        llm=google.LLM(),
        tts=elevenlabs.TTS(),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )
    # if using realtime api, use the following
    #session = AgentSession(
    #    llm=openai.realtime.RealtimeModel(voice="echo"),
    #)

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Instruct the agent to speak first
    await session.generate_reply(instructions="say hello to the user")

```

## Customizing pipeline behavior

We’ve introduced more flexibility for developers to customize the behavior of agents built on 1.0 through the new concept of [pipeline nodes](https://docs.livekit.io/agents/build/nodes.md), which enable custom processing within the pipeline steps while also delegating to the default implementation of each node as needed.

Pipeline nodes replaces the `before_llm_cb` and `before_tts_cb` callbacks.

### before_llm_cb -> llm_node

`before_llm_cb` has been replaced by `llm_node`. This node can be used to modify the chat context before sending it to LLM, or integrate with custom LLM providers without having to create a plugin. As long as it returns AsyncIterable[llm.ChatChunk], the LLM node will forward the chunks to the next node in the pipeline.

**Version 0.x**:

```python
async def add_rag_context(assistant: VoicePipelineAgent, chat_ctx: llm.ChatContext):
    rag_context: str = retrieve(chat_ctx)
    chat_ctx.append(text=rag_context, role="system")

agent = VoicePipelineAgent(
    ...
    before_llm_cb=add_rag_context,
)

```

---

**Version 1.0**:

```python
class MyAgent(Agent):
    # override method from superclass to customize behavior
    async def llm_node(
        self,
        chat_ctx: llm.ChatContext,
        tools: list[llm.FunctionTool],
        model_settings: ModelSettings,
    ) -> AsyncIterable[llm.ChatChunk]::
        rag_context: str = retrieve(chat_ctx)
        chat_ctx.add_message(content=rag_context, role="system")

        # update the context for persistence
        # await self.update_chat_ctx(chat_ctx)

        return Agent.default.llm_node(self, chat_ctx, tools, model_settings)

```

### before_tts_cb -> tts_node

`before_tts_cb` has been replaced by `tts_node`. This node gives greater flexibility in customizing the TTS pipeline. It's possible to modify the text before synthesis, as well as the audio buffers after synthesis.

**Version 0.x**:

```python
def _before_tts_cb(agent: VoicePipelineAgent, text: str | AsyncIterable[str]):
    # The TTS is incorrectly pronouncing "LiveKit", so we'll replace it with MFA-style IPA
    # spelling for Cartesia
    return tokenize.utils.replace_words(
        text=text, replacements={"livekit": r"<<l|aj|v|cʰ|ɪ|t|>>"}
    )

agent = VoicePipelineAgent(
    ...
    before_tts_cb=_before_tts_cb,
)


```

---

**Version 1.0**:

```python
class MyAgent(Agent):
    async def tts_node(self, text: AsyncIterable[str], model_settings: ModelSettings):
        # use default implementation, but pre-process the text
        return Agent.default.tts_node(self, tokenize.utils.replace_words(text), model_settings)

```

## Tool definition and use

Agents 1.0 streamlines the way in which [tools](https://docs.livekit.io/agents/build/tools.md) are defined for use within your agents, making it easier to add and maintain agent tools.  When migrating from 0.x to 1.0, developers will need to make the following changes to existing use of functional calling within their agents in order to be compatible with versions 1.0 and later.

- The `@llm.ai_callable` decorator for function definition has been replaced with the new `@function_tool` decorator.
- If you define your functions within an `Agent` and use the `@function_tool` decorator, these tools are automatically accessible to the LLM. In this scenario, you no longer required to define your functions in a `llm.FunctionContext` class and pass them into the agent constructor.
- Argument types are now inferred from the function signature and docstring. Annotated types are no longer supported.
- Functions take in a `RunContext` object, which provides access to the current agent state.

**Version 0.x**:

```python
from livekit.agents import llm
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.agents.multimodal import MultimodalAgent

class AssistantFnc(llm.FunctionContext):
    @llm.ai_callable()
    async def get_weather(
        self,
        ...
    )
    ...

fnc_ctx = AssistantFnc()

pipeline_agent = VoicePipelineAgent(
    ...
    fnc_ctx=fnc_ctx,
)

multimodal_agent = MultimodalAgent(
    ...
    fnc_ctx=fnc_ctx,
)

```

---

**Version 1.0**:

```python
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent
from livekit.agents.events import RunContext

class MyAgent(Agent):
    @function_tool()
    async def get_weather(
        self,
        context: RunContext,
        location: str,
    ) -> dict[str, Any]:
        """Look up weather information for a given location.
        
        Args:
            location: The location to look up weather information for.
        """

        return {"weather": "sunny", "temperature_f": 70}

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

- **Agent handoff** – [transferring control](https://docs.livekit.io/agents/build/workflows.md#tool-handoff) to a new agent, which will have its own chat context.
- **Explicit update** - calling `agent.update_chat_ctx()` to modify the context directly.

## Transcriptions

Agents 1.0 brings some new changes to how [transcriptions](https://docs.livekit.io/agents/build/text.md#transcriptions) are handled:

- Transcriptions now use [text streams](https://docs.livekit.io/home/client/data/text-streams.md) with topic `lk.transcription`.
- The old `TranscriptionEvent` protocol is deprecated and will be removed in a future version.

## Accepting text input

Agents 1.0 introduces [improved support for text input](https://docs.livekit.io/agents/build/text.md#text-input). Previously, text had to be manually intercepted and injected into the agent via `ChatManager`.

In this version, agents automatically receive text input from a text stream on the `lk.chat` topic.

The `ChatManager` has been removed in Python SDK v1.0.

## State change events

### User state

`user_started_speaking` and `user_stopped_speaking` events are no longer emitted. They've been combined into a single `user_state_changed` event.

**Version 0.x**:

```python
@agent.on("user_started_speaking")
def on_user_started_speaking():
    print("User started speaking")

```

---

**Version 1.0**:

```python
@session.on("user_state_changed")
def on_user_state_changed(ev: UserStateChangedEvent):
    # userState could be "speaking", "listening", or "away"
    print(f"state change from {ev.old_state} to {ev.new_state}")

```

### Agent state

**Version 0.x**:

```python
@agent.on("agent_started_speaking")
def on_agent_started_speaking():
    # Log transcribed message from user
    print("Agent started speaking")

```

---

**Version 1.0**:

```python
@session.on("agent_state_changed")
def on_agent_state_changed(ev: AgentStateChangedEvent):
    # AgentState could be "initializing", "idle", "listening", "thinking", "speaking"
    # new_state is set as a participant attribute `lk.agent.state` to notify frontends
    print(f"state change from {ev.old_state} to {ev.new_state}")

```

## Other events

Agent events were overhauled in version 1.0. For details, see the [events](https://docs.livekit.io/agents/build/events.md) page.

## Removed features

- OpenAI Assistants API support has been removed in 1.0.

The beta integration with the Assistants API in the OpenAI LLM plugin has been deprecated. Its stateful model made it difficult to manage state consistently between the API and agent.

---

This document was rendered at 2025-09-27T09:36:23.151Z.
For the latest version of this document, see [https://docs.livekit.io/agents/v0-migration/python.md](https://docs.livekit.io/agents/v0-migration/python.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).