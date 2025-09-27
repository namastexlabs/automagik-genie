LiveKit Docs › Integration guides › Realtime models › Amazon Nova Sonic

---

# Amazon Nova Sonic integration guide

> How to use the Amazon Nova Sonic model with LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

Amazon [Nova Sonic](https://aws.amazon.com/ai/generative-ai/nova/speech/) is a state of the art speech-to-speech model with a bidirectional audio streaming API. Nova Sonic processes and responds to realtime speech as it occurs, enabling natural, human-like conversational experiences. LiveKit's AWS plugin includes support for Nova Sonic on AWS Bedrock, allowing you to use this model to create true realtime conversational agents.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the AWS plugin from PyPI with the `realtime` extra:

```bash
pip install "livekit-plugins-aws[realtime]"


```

### Authentication

The AWS plugin requires AWS credentials. Set the following environment variables in your `.env` file:

```shell
AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>

```

### Usage

Use the Nova Sonic API within an `AgentSession`. For example, you can use it in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import aws

session = AgentSession(
    llm=aws.realtime.RealtimeModel(),
)


```

### Parameters

This section describes some of the available parameters. For a complete reference of all available parameters, see the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/aws/experimental/realtime/index.html.md).

- **`voice`** _(string)_ (optional): Name of the Nova Sonic API voice. For a full list, see [Voices](https://docs.aws.amazon.com/nova/latest/userguide/available-voices.html).

- **`region`** _(string)_ (optional): AWS region of the Bedrock runtime endpoint.

## Turn detection

The Nova Sonic API includes built-in VAD-based turn detection, which is currently the only supported turn detection method.

## Additional resources

The following resources provide more information about using Nova Sonic with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-aws/)**: The `livekit-plugins-aws` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/aws/experimental/realtime/index.html.md)**: Reference for the Nova Sonic integration.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-aws/livekit/plugins/aws/)**: View the source or contribute to the LiveKit AWS plugin.

- **[Nova Sonic docs](https://docs.aws.amazon.com/nova/latest/userguide/speech.html)**: Nova Sonic API documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Amazon Nova Sonic.

- **[AWS AI ecosystem guide](https://docs.livekit.io/agents/integrations/aws.md)**: Overview of the entire AWS AI and LiveKit Agents integration.

---

This document was rendered at 2025-09-27T09:36:06.082Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/realtime/nova-sonic.md](https://docs.livekit.io/agents/integrations/realtime/nova-sonic.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).