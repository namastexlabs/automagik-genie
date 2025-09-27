LiveKit Docs › Integration guides › Large language models (LLM) › LangChain

---

# LangChain integration guide

> How to use LangGraph workflows with LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[LangChain](https://www.langchain.com/) is a framework for developing applications powered by large language models. The LiveKit LangChain plugin allows you to integrate existing LangGraph workflows as LLMs in your voice AI applications.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the LiveKit LangChain plugin from PyPI:

```bash
pip install "livekit-plugins-langchain~=1.1"

```

### Usage

Use LangGraph workflows within an `AgentSession` by wrapping them with the `LLMAdapter`. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from langgraph.graph import StateGraph
from livekit.agents import AgentSession, Agent
from livekit.plugins import langchain

# Define your LangGraph workflow
def create_workflow():
    workflow = StateGraph(...)
    # Add your nodes and edges
    return workflow.compile()

# Use the workflow as an LLM
session = AgentSession(
    llm=langchain.LLMAdapter(
        graph=create_workflow()
    ),
    # ... stt, tts, vad, turn_detection, etc.
)

```

The `LLMAdapter` automatically converts the LiveKit chat context to [LangChain messages](https://python.langchain.com/docs/concepts/messages/#langchain-messages). The mapping is as follows:

- `system` and `developer` messages to `SystemMessage`
- `user` messages to `HumanMessage`
- `assistant` messages to `AIMessage`

### Parameters

This section describes the available parameters for the `LLMAdapter`. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/langchain/index.html.md#livekit.plugins.langchain.LLMAdapter) for a complete list of all available parameters.

- **`graph`** _(PregelProtocol)_: The LangGraph workflow to use as an LLM. Must be a locally compiled graph. To learn more, see  [Graph Definitions](https://langchain-ai.github.io/langgraph/reference/graphs/).

- **`config`** _(RunnableConfig | None)_ (optional) - Default: `None`: Configuration options for the LangGraph workflow execution. This can include runtime configuration, callbacks, and other LangGraph-specific options. To learn more, see [RunnableConfig](https://python.langchain.com/docs/concepts/runnables/#runnableconfig).

## Additional resources

The following resources provide more information about using LangChain with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-langchain/)**: The `livekit-plugins-langchain` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/langchain/index.html.md#livekit.plugins.langchain.LLMAdapter)**: Reference for the LangChain LLM adapter.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-langchain)**: View the source or contribute to the LiveKit LangChain plugin.

- **[LangChain docs](https://python.langchain.com/docs/)**: LangChain documentation and tutorials.

- **[LangGraph docs](https://python.langchain.com/docs/langgraph)**: LangGraph documentation for building stateful workflows.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and LangChain.

---

This document was rendered at 2025-09-27T09:36:02.509Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/llm/langchain.md](https://docs.livekit.io/agents/integrations/llm/langchain.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).