LiveKit Docs › Partner spotlight › AWS › Overview

---

# AWS AI and LiveKit

> An overview of the AWS AI integrations with LiveKit Agents.

## AWS AI ecosystem support

Amazon's [AWS AI](https://aws.amazon.com/ai/) is a comprehensive collection of production-ready AI services, which integrate with LiveKit in the following ways:

- **Amazon Bedrock**: Access to foundation models from leading AI companies.
- **Amazon Polly**: Text-to-speech service with lifelike voices.
- **Amazon Transcribe**: Speech-to-text service with high accuracy.
- **Amazon Nova Sonic**: Realtime, speech-to-speech model that uses a bidirectional streaming API for streaming events.

The LiveKit Agents AWS plugin supports these services for building voice AI applications.

## Getting started

Use the voice AI quickstart to build a voice AI app with AWS services. Select a pipeline model type and add the following components to use AWS AI services:

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Build your first voice AI app with AWS AI services.

Install the AWS plugin:

```bash
pip install "livekit-agents[aws]~=1.2"

```

Add your AWS credentials to your `.env` file:

** Filename: `.env`**

```shell
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
AWS_REGION=<your-aws-region>

```

Use the AWS services in your application:

** Filename: `agent.py`**

```python
from livekit.plugins import aws

# ...

# in your entrypoint function
session = AgentSession(
    llm=aws.LLM(
        model="anthropic.claude-3-5-sonnet-20240620-v1:0",
    ),
    tts=aws.TTS(
        voice="Ruth",
        speech_engine="generative",
        language="en-US",
    ),
    stt=aws.STT(
        session_id="my-session-id",
        language="en-US",
    ),
    # ... vad, turn_detection, etc.
)

```

Or use Amazon Nova Sonic, a state of the art speech-to-speech model:

```bash
pip install "livekit-agents-aws[realtime]~=1.2"

```

** Filename: `agent.py`**

```python
from livekit.plugins import aws

# ...

# in your entrypoint function
session = AgentSession(
    llm=aws.realtime.RealtimeModel()
)

```

## AWS plugin documentation

- **[Amazon Bedrock LLM](https://docs.livekit.io/agents/integrations/llm/aws.md)**: LiveKit Agents docs for Amazon Bedrock LLM.

- **[Amazon Polly TTS](https://docs.livekit.io/agents/integrations/tts/aws.md)**: LiveKit Agents docs for Amazon Polly TTS.

- **[Amazon Transcribe STT](https://docs.livekit.io/agents/integrations/stt/aws.md)**: LiveKit Agents docs for Amazon Transcribe STT.

- **[Amazon Nova Sonic](https://docs.livekit.io/agents/integrations/realtime/nova-sonic.md)**: LiveKit Agents docs for the Amazon Nova Sonic speech-to-speech model.

---

This document was rendered at 2025-09-27T09:35:57.844Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/aws.md](https://docs.livekit.io/agents/integrations/aws.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).