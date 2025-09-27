# Building an Automated IVR Menu Caller

> Build an AI agent that can call phone numbers and navigate IVR menus by listening and sending DTMF codes.

In this recipe, build an AI agent that calls phone numbers and navigates automated IVR menus. The guide focuses on how the agent listens for menu options and sends DTMF codes at the right time.

## Prerequisites

To complete this guide, you need the following prerequisites:

- Create an agent using the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).
- Set up LiveKit SIP to make outgoing calls:

- [Create and configure a SIP trunk](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md) with your trunking provider.
- Create an [outbound trunk](https://docs.livekit.io/sip/trunk-outbound.md).

## Setting up the environment

First, import the necessary packages and set up the environment:

```python
from __future__ import annotations
import os
import time
import asyncio
import logging
from dataclasses import dataclass
from typing import Annotated, Optional

from dotenv import load_dotenv
from livekit import rtc, api
from livekit import agents
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent, AgentSession, RunContext
from livekit.plugins import openai, silero, cartesia, deepgram
from pydantic import Field

load_dotenv(dotenv_path=".env.local")

logger = logging.getLogger("my-worker")
logger.setLevel(logging.INFO)

```

## Creating a data model

Create a data class to store user data and state:

```python
@dataclass
class UserData:
    """Store user data for the navigator agent."""
    last_dtmf_press: float = 0
    task: Optional[str] = None

RunContext_T = RunContext[UserData]

```

## Implementing the Navigator Agent

Create a custom Agent class that extends the base `Agent` class:

```python
class NavigatorAgent(Agent):
    """Agent that navigates through phone IVR systems."""

    def __init__(self) -> None:
        """Initialize the navigator agent."""
        super().__init__(instructions="")

    async def on_enter(self) -> None:
        """Called when the agent is first activated."""
        logger.info("NavigatorAgent activated")

        # Get the task from userdata
        task = self.session.userdata.task
        if task:
            # Update the agent with task-specific instructions
            instructions = (
                f"""
                You are a person who is calling a phone number to accomplish a task.
                Speak from the perspective of the caller.
                Your goal as the caller is to: {task}.
                Listen carefully and pick the most appropriate option from the IVR menu.
                """
            )
            await self.update_instructions(instructions)

```

## Implementing DTMF functionality

Add a method to the agent class that sends DTMF codes with a cooldown to prevent rapid presses:

```python
    @function_tool()
    async def send_dtmf_code(
        self,
        code: Annotated[int, Field(description="The DTMF code to send to the phone number for the current step.")],
        context: RunContext_T
    ) -> None:
        """Called when you need to send a DTMF code to the phone number for the current step."""
        current_time = time.time()
        
        # Check if enough time has passed since last press (3 second cooldown)
        if current_time - context.userdata.last_dtmf_press < 3:
            logger.info("DTMF code rejected due to cooldown")
            return None
            
        logger.info(f"Sending DTMF code {code} to the phone number for the current step.")
        context.userdata.last_dtmf_press = current_time
        
        room = context.session.room

        await room.local_participant.publish_dtmf(
            code=code,
            digit=str(code)
        )
        await room.local_participant.publish_data(
            f"{code}",
            topic="dtmf_code"
        )
        return None

```

## Setting up the agent session

Create the entrypoint function to connect to LiveKit and handle participant connections:

```python
async def entrypoint(ctx: JobContext):
    """Main entry point for the navigator agent."""
    logger.info("starting entrypoint")
    logger.info(f"connecting to room {ctx.room.name}")

    # Connect to the room
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)

    # Setup participant connection handler
    @ctx.room.on("participant_connected")
    def on_participant_connected(participant: rtc.RemoteParticipant):
        logger.info(f"new participant joined {participant.identity}")
        if not "sip_" in participant.identity:
            return

        # Get the task from attributes
        task = participant._info.attributes.get("task")
        logger.info(f"task: {task}")

        # Initialize user data
        userdata = UserData(task=task)

        # Create and start the agent session
        session = AgentSession(
            userdata=userdata,
            stt=deepgram.STT(),
            llm=openai.LLM(base_url="https://api.deepseek.com/v1",
                          model="deepseek-chat",
                          api_key=os.getenv("DEEPSEEK_API_KEY")),
            tts=cartesia.TTS(),
            vad=silero.VAD.load(),
            min_endpointing_delay=0.75
        )

        # Start the navigator agent
        asyncio.create_task(
            session.start(
                room=ctx.room,
                agent=NavigatorAgent()
            )
        )

    # Wait for the first participant to connect
    await ctx.wait_for_participant()
    logger.info("Waiting for SIP participants to connect")

```

## Running the agent

Finally, add the main entry point to run the application:

```python
if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        ),
    )

```

## How it works

1. When a SIP participant connects, the agent checks for a "task" attribute that describes what the agent needs to accomplish
2. The agent is initialized with instructions to act as a human caller with a specific goal
3. The agent listens to the IVR system as it presents options
4. When the agent needs to select an option, it uses the `send_dtmf_code` function to send a DTMF tone
5. A cooldown mechanism prevents sending multiple DTMF codes too quickly
6. The agent continues to navigate through the IVR system until it accomplishes its task

This pattern can be extended to handle more complex IVR systems by adding additional tools or modifying the agent's instructions to handle different scenarios.

For a complete working example, see the [IVR agent repository](https://github.com/ShayneP/ivr-agent).

---

This document was rendered at 2025-09-27T09:36:45.877Z.
For the latest version of this document, see [https://docs.livekit.io/recipes/ivr-navigator.md](https://docs.livekit.io/recipes/ivr-navigator.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).