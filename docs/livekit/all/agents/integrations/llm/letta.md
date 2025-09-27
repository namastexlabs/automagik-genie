LiveKit Docs › Integration guides › Large language models (LLM) › Letta

---

# Letta LLM integration guide

> How to use a Letta agent for your LLM with LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Letta](https://docs.letta.com/overview) enables you to build and deploy stateful AI agents that maintain memory and context across long-running conversations. You can build sophisticated voice AI applications using a Letta agent as the LLM in your STT-LLM-TTS pipeline.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the OpenAI plugin to add Letta support:

```bash
pip install "livekit-agents[openai]~=1.2"

```

### Authentication

If your Letta server requires authentication, you need to provide an API key. Set the following environment variable in your `.env` file:

`LETTA_API_KEY`

### Usage

Use Letta LLM within an `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import openai

session = AgentSession(
    llm=openai.LLM.with_letta(
        agent_id="<agent-id>",
    ),
    # ... tts, stt, vad, turn_detection, etc.
)

```

### Parameters

This section describes some of the parameters for the `with_letta` method. For a complete list of all available parameters, see the [plugin documentation](https://docs.livekit.io/reference/python/v1/livekit/plugins/openai/index.html.md#livekit.plugins.openai.LLM.with_letta).

- **`agent_id`** _(string)_: Letta [agent ID](https://docs.letta.com/guides/ade/settings#agent-identity). Must begin with `agent-`.

- **`base_url`** _(string)_ (optional) - Default: `https://api.letta.com/v1/voice-beta`: URL of the Letta server. For example, your [self-hosted server](https://docs.letta.com/guides/selfhosting) or [Letta Cloud](https://docs.letta.com/guides/cloud/overview).

## Additional resources

The following links provide more information about the Letta LLM plugin.

- **[Python package](https://pypi.org/project/livekit-plugins-openai/)**: The `livekit-plugins-openai` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/openai/index.html.md#livekit.plugins.openai.LLM.with_letta)**: Reference for the Letta LLM plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-openai)**: View the source or contribute to the LiveKit OpenAI LLM plugin.

- **[Letta docs](https://docs.letta.com/)**: Letta documentation.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Letta.

---

This document was rendered at 2025-09-27T09:36:02.773Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/letta.md](https://docs.livekit.io/agents/integrations/llm/letta.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).