# Company directory phone assistant

> Build a phone assistant that can transfer calls to different departments using SIP REFER.

In this recipe, build a phone assistant that transfers callers to different departments via SIP REFER. This guide focuses on how to set up DTMF handling and how to manage the actual call transfers to Billing, Technical Support, or Customer Service.

## Prerequisites

To complete this guide, you need the following prerequisites:

- Create an agent using the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).
- Set up LiveKit SIP to [accept inbound calls](https://docs.livekit.io/sip/accepting-calls.md#setup-for-accepting-calls)

## Setting up the environment

First, create an environment file with the necessary credentials and phone numbers:

```python
# Initialize environment variables
# The .env.local file should look like:
#   OPENAI_API_KEY=your-key-here
#   BILLING_PHONE_NUMBER=+12345678901
#   TECH_SUPPORT_PHONE_NUMBER=+12345678901
#   CUSTOMER_SERVICE_PHONE_NUMBER=+12345678901
#   LIVEKIT_URL=wss://your-url-goes-here.livekit.cloud
#   LIVEKIT_API_KEY=your-key-here
#   LIVEKIT_API_SECRET=your-secret-here
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env.local")

```

## Implementing the phone assistant

Create a custom Agent class that extends the base `Agent` class:

```python
from __future__ import annotations
import asyncio
import logging
import os
from dataclasses import dataclass
from typing import Annotated, Optional

from livekit import rtc, api
from livekit.agents import JobContext, WorkerOptions
from livekit.agents.llm import function_tool
from livekit.agents.voice import Agent, AgentSession, RunContext
from livekit.protocol import sip as proto_sip
from livekit.plugins import openai, silero
from pydantic import Field

logger = logging.getLogger("phone-assistant")
logger.setLevel(logging.INFO)

@dataclass
class UserData:
    """Store user data and state for the phone assistant."""
    selected_department: Optional[str] = None
    livekit_api: Optional[api.LiveKitAPI] = None
    ctx: Optional[JobContext] = None

RunContext_T = RunContext[UserData]

class PhoneAssistant(Agent):
    """
    A voice-enabled phone assistant that handles voice interactions.
    You can transfer the call to a department based on the DTMF digit pressed by the user.
    """

    def __init__(self) -> None:
        """
        Initialize the PhoneAssistant with customized instructions.
        """
        instructions = (
            "You are a friendly assistant providing support. "
            "Please inform users they can:\n"
            "- Press 1 for Billing\n"
            "- Press 2 for Technical Support\n"
            "- Press 3 for Customer Service"
        )
        super().__init__(instructions=instructions)

    async def on_enter(self) -> None:
        """Called when the agent is first activated."""
        logger.info("PhoneAssistant activated")

        greeting = (
            "Hi, thanks for calling Vandelay Industries — global leader in fine latex goods! "
            "You can press 1 for Billing, 2 for Technical Support, "
            "or 3 for Customer Service. You can also just talk to me, since I'm a LiveKit agent."
        )
        await self.session.generate_reply(user_input=greeting)

```

## Implementing transfer functionality

Add methods to handle transfers for different departments:

```python
    @function_tool()
    async def transfer_to_billing(self, context: RunContext_T) -> str:
        """Transfer the call to the billing department."""
        room = context.userdata.ctx.room
        identity = room.local_participant.identity
        transfer_number = f"tel:{os.getenv('BILLING_PHONE_NUMBER')}"
        dept_name = "Billing"
        context.userdata.selected_department = dept_name
        await self._handle_transfer(identity, transfer_number, dept_name)
        return f"Transferring to {dept_name} department."

    @function_tool()
    async def transfer_to_tech_support(self, context: RunContext_T) -> str:
        """Transfer the call to the technical support department."""
        room = context.userdata.ctx.room
        identity = room.local_participant.identity
        transfer_number = f"tel:{os.getenv('TECH_SUPPORT_PHONE_NUMBER')}"
        dept_name = "Tech Support"
        context.userdata.selected_department = dept_name
        await self._handle_transfer(identity, transfer_number, dept_name)
        return f"Transferring to {dept_name} department."

    @function_tool()
    async def transfer_to_customer_service(self, context: RunContext_T) -> str:
        """Transfer the call to the customer service department."""
        room = context.userdata.ctx.room
        identity = room.local_participant.identity
        transfer_number = f"tel:{os.getenv('CUSTOMER_SERVICE_PHONE_NUMBER')}"
        dept_name = "Customer Service"
        context.userdata.selected_department = dept_name
        await self._handle_transfer(identity, transfer_number, dept_name)
        return f"Transferring to {dept_name} department."

    async def _handle_transfer(self, identity: str, transfer_number: str, department: str) -> None:
        """
        Handle the transfer process with department-specific messaging.

        Args:
            identity (str): The participant's identity
            transfer_number (str): The number to transfer to
            department (str): The name of the department
        """
        await self.session.generate_reply(user_input=f"Transferring you to our {department} department in a moment. Please hold.")
        await asyncio.sleep(6)
        await self.transfer_call(identity, transfer_number)

```

## Handling SIP call transfers

Implement the actual call transfer logic using SIP REFER:

```python
    async def transfer_call(self, participant_identity: str, transfer_to: str) -> None:
        """
        Transfer the SIP call to another number.

        Args:
            participant_identity (str): The identity of the participant.
            transfer_to (str): The phone number to transfer the call to.
        """
        logger.info(f"Transferring call for participant {participant_identity} to {transfer_to}")

        try:
            userdata = self.session.userdata
            if not userdata.livekit_api:
                livekit_url = os.getenv('LIVEKIT_URL')
                api_key = os.getenv('LIVEKIT_API_KEY')
                api_secret = os.getenv('LIVEKIT_API_SECRET')
                userdata.livekit_api = api.LiveKitAPI(
                    url=livekit_url,
                    api_key=api_key,
                    api_secret=api_secret
                )

            transfer_request = proto_sip.TransferSIPParticipantRequest(
                participant_identity=participant_identity,
                room_name=userdata.ctx.room.name,
                transfer_to=transfer_to,
                play_dialtone=True
            )

            await userdata.livekit_api.sip.transfer_sip_participant(transfer_request)

        except Exception as e:
            logger.error(f"Failed to transfer call: {e}", exc_info=True)
            await self.session.generate_reply(user_input="I'm sorry, I couldn't transfer your call. Is there something else I can help with?")

```

## Setting up DTMF handling

Set up handlers to listen for DTMF tones and act on them:

```python
def setup_dtmf_handlers(room: rtc.Room, phone_assistant: PhoneAssistant):
    """
    Setup DTMF event handlers for the room.

    Args:
        room: The LiveKit room
        phone_assistant: The phone assistant agent
    """

    async def _async_handle_dtmf(dtmf_event: rtc.SipDTMF):
        """Asynchronous logic for handling DTMF tones."""
        await phone_assistant.session.interrupt()
        logger.info("Interrupted agent due to DTMF")

        code = dtmf_event.code
        digit = dtmf_event.digit
        identity = dtmf_event.participant.identity

        department_numbers = {
            "1": ("BILLING_PHONE_NUMBER", "Billing"),
            "2": ("TECH_SUPPORT_PHONE_NUMBER", "Tech Support"),
            "3": ("CUSTOMER_SERVICE_PHONE_NUMBER", "Customer Service")
        }

        if digit in department_numbers:
            env_var, dept_name = department_numbers[digit]
            transfer_number = f"tel:{os.getenv(env_var)}"
            userdata = phone_assistant.session.userdata
            userdata.selected_department = dept_name
            await phone_assistant._handle_transfer(identity, transfer_number, dept_name)
        else:
            await phone_assistant.session.generate_reply(user_input="I'm sorry, please choose one of the options I mentioned earlier.")

    @room.on("sip_dtmf_received")
    def handle_dtmf(dtmf_event: rtc.SipDTMF):
        """
        Synchronous handler for DTMF signals that schedules the async logic.

        Args:
            dtmf_event (rtc.SipDTMF): The DTMF event data.
        """
        asyncio.create_task(_async_handle_dtmf(dtmf_event))

```

## Starting the agent

Finally, implement the entrypoint to start the agent:

```python
async def entrypoint(ctx: JobContext) -> None:
    """
    The main entry point for the phone assistant application.

    Args:
        ctx (JobContext): The context for the job.
    """
    userdata = UserData(ctx=ctx)

    session = AgentSession(
        userdata=userdata,
        llm=openai.realtime.RealtimeModel(voice="sage"),
        vad=silero.VAD.load(),
        max_tool_steps=3
    )

    phone_assistant = PhoneAssistant()

    setup_dtmf_handlers(ctx.room, phone_assistant)

    await session.start(
        room=ctx.room,
        agent=phone_assistant
    )

    disconnect_event = asyncio.Event()

    @ctx.room.on("disconnected")
    def on_room_disconnect(*args):
        disconnect_event.set()

    try:
        await disconnect_event.wait()
    finally:
        if userdata.livekit_api:
            await userdata.livekit_api.aclose()
            userdata.livekit_api = None


if __name__ == "__main__":
    from livekit.agents import cli
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

```

## How it works

1. When a call is received, the agent answers and provides instructions to the caller.
2. The caller can press 1, 2, or 3 to select a department:- 1 for Billing
- 2 for Technical Support
- 3 for Customer Service
3. When a DTMF tone is detected, the agent:- Interrupts the current conversation
- Notifies the caller they are being transferred
- Initiates a SIP REFER to transfer the call to the selected department
4. If the caller presses a different key, they are prompted to select a valid option.

The agent also supports regular voice conversations, so callers can ask questions directly before being transferred!

For the complete code, see the [phone assistant repository](https://github.com/livekit-examples/phone-assistant).

---

This document was rendered at 2025-09-27T09:36:45.602Z.
For the latest version of this document, see [https://docs.livekit.io/recipes/company-directory.md](https://docs.livekit.io/recipes/company-directory.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).