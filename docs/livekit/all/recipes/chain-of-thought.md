# Modifying LLM output before TTS

> How to modify LLM output before sending the text to TTS for vocalization.

In this recipe, build an agent that speaks chain-of-thought reasoning aloud while avoiding the vocalization of `<think>` and `</think>` tokens. The steps focus on cleaning up the text just before it's sent to the TTS engine so the agent sounds natural.

## Prerequisites

To complete this guide, you need to create an agent using the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

## Modifying LLM output before TTS

You can modify the LLM output by creating a custom Agent class and overriding the `llm_node` method. Here's how to implement an agent that removes `<think>` tags from the output:

```python
import logging
from pathlib import Path
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai, deepgram, silero

load_dotenv()

logger = logging.getLogger("replacing-llm-output")
logger.setLevel(logging.INFO)

class ChainOfThoughtAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
                You are a helpful agent that thinks through problems step by step.
                When reasoning through a complex question, wrap your thinking in <think></think> tags.
                After you've thought through the problem, provide your final answer.
            """,
            stt=deepgram.STT(),
            llm=openai.LLM.with_groq(model="deepseek-r1-distill-llama-70b"),
            tts=openai.TTS(),
            vad=silero.VAD.load()
        )
    
    async def on_enter(self):
        self.session.generate_reply()

    async def llm_node(
        self, chat_ctx, tools, model_settings=None
    ):
        async def process_stream():
            async with self.llm.chat(chat_ctx=chat_ctx, tools=tools, tool_choice=None) as stream:
                async for chunk in stream:
                    if chunk is None:
                        continue

                    content = getattr(chunk.delta, 'content', None) if hasattr(chunk, 'delta') else str(chunk)
                    if content is None:
                        yield chunk
                        continue

                    processed_content = content.replace("<think>", "").replace("</think>", "Okay, I'm ready to respond.")

                    if processed_content != content:
                        if hasattr(chunk, 'delta') and hasattr(chunk.delta, 'content'):
                            chunk.delta.content = processed_content
                        else:
                            chunk = processed_content

                    yield chunk

```

## Setting up the agent session

Create an entrypoint function to initialize and run the agent:

```python
async def entrypoint(ctx: JobContext):
    session = AgentSession()

    await session.start(
        agent=ChainOfThoughtAgent(),
        room=ctx.room
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

```

## How it works

1. The LLM generates text with chain-of-thought reasoning wrapped in `<think>...</think>` tags
2. The overridden `llm_node` method intercepts the LLM output stream
3. For each chunk of text:- The method checks if there's content to process
- It replaces `<think>` tags with empty string and `</think>` tags with "Okay, I'm ready to respond."
- The modified content is then passed on to the TTS engine
4. The TTS engine only speaks the processed text

This approach gives you fine-grained control over how the agent processes and speaks LLM responses, allowing for more sophisticated conversational behaviors.

---

This document was rendered at 2025-09-27T09:36:44.235Z.
For the latest version of this document, see [https://docs.livekit.io/recipes/chain-of-thought.md](https://docs.livekit.io/recipes/chain-of-thought.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).