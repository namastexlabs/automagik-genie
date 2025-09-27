LiveKit Docs › Integration guides › Speech-to-text (STT) › Clova

---

# CLOVA STT integration guide

> How to use the Clova STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[CLOVA Speech Recognition](https://guide.ncloud-docs.com/docs/en/csr-overview) is the NAVER Cloud Platform's service to convert human voice into text. You can use the open source CLOVA plugin for LiveKit Agents to build voice AI with fast, accurate transcription.

## Quick reference

This section provides a brief overview of the CLOVA STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[clova]~=1.2"

```

### Authentication

The CLOVA plugin requires the following keys, which may set as environment variables or passed to the constructor.

```shell
CLOVA_STT_SECRET_KEY=<your-api-key>
CLOVA_STT_INVOKE_URL=<your-invoke-url>

```

### Usage

Create a CLOVA STT to use within an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import clova

session = AgentSession(
    stt = clova.STT(
      word_boost=["LiveKit"],
    ),
    # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/clova/index.html.md#livekit.plugins.clova.STT) for a complete list of all available parameters.

- **`language`** _(ClovaSttLanguages)_ (optional) - Default: `en-US`: Speech recognition language. Clova supports English, Korean, Japanese, and Chinese. Valid values are `ko-KR`, `en-US`, `enko`, `ja`, `zh-cn`, `zh-tw`.

## Additional resources

The following resources provide more information about using CLOVA with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-clova/)**: The `livekit-plugins-clova` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/clova/index.html.md#livekit.plugins.clova.STT)**: Reference for the CLOVA STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-clova)**: View the source or contribute to the LiveKit CLOVA STT plugin.

- **[CLOVA docs](https://guide.ncloud-docs.com/docs/en/csr-overview)**: CLOVA's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and CLOVA.

---

This document was rendered at 2025-09-27T09:36:08.621Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/clova.md](https://docs.livekit.io/agents/integrations/stt/clova.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).