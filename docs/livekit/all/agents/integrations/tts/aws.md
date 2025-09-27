LiveKit Docs › Integration guides › Text-to-speech (TTS) › Amazon Polly

---

# Amazon Polly TTS integration guide

> How to use the Amazon Polly TTS plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Amazon Polly](https://aws.amazon.com/polly/) is an AI voice generator that provides high-quality, natural-sounding human voices in multiple languages. With LiveKit's Amazon Polly integration and the Agents framework, you can build voice AI applications that sound realistic.

## Quick reference

This section includes a basic usage example and some reference material. For links to more detailed documentation, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[aws]~=1.2"

```

### Authentication

The Amazon Polly plugin requires an [AWS API key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html).

Set the following environment variables in your `.env` file:

```shell
AWS_ACCESS_KEY_ID=<aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<aws-secret-access-key>
AWS_DEFAULT_REGION=<aws-deployment-region>

```

### Usage

Use an Amazon Polly TTS within an `AgentSession` or as a standalone speech generator. For example, you can use this TTS in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import aws

session = AgentSession(
   tts=aws.TTS(
      voice="Ruth",
      speech_engine="generative",
      language="en-US",
   ),
   # ... llm, stt, etc.
)

```

### Parameters

This section describes some of the parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/aws/tts.html.md) for a complete list of all available parameters.

- **`voice`** _(TTSModels)_ (optional) - Default: `Ruth`: Voice to use for the synthesis. For a full list, see [Available voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html).

- **`language`** _(TTSLanguages | str)_ (optional): Language code for the Synthesize Speech request. This is only necessary if using a bilingual voice, such as Aditi, which can be used for either Indian English (en-IN) or Hindi (hi-IN). To learn more, see [Languages in Amazon Polly](https://docs.aws.amazon.com/polly/latest/dg/supported-languages.html).

- **`speech_engine`** _(TTSSpeechEngine)_ (optional) - Default: `generative`: The voice engine to use for the synthesis. Valid values are `standard`, `neural`, `long-form`, and `generative`. To learn more, see [Amazon Polly voice engines](https://docs.aws.amazon.com/polly/latest/dg/voice-engines-polly.html).

- **`text_type`** _(TTSTextType)_ (optional) - Default: `text`: The type of text to synthesize. Valid values are `text` or `ssml`. Use `ssml` to synthesize speech from SSML-enchanced text. To learn more, see [Controlling speech and pronunciation](#pronunciation).

## Controlling speech and pronunciation

Amazon Polly supports Speech Synthesis Markup Language (SSML) for customizing generated speech. To learn more, see [Generating speech from SSML documents](https://docs.aws.amazon.com/polly/latest/dg/ssml.html) and [Supported SSML tags](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html).

## Additional resources

The following resources provide more information about using Amazon Polly with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-aws/)**: The `livekit-plugins-aws` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/aws/index.html.md#livekit.plugins.aws.TTS)**: Reference for the Amazon Polly TTS plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-aws)**: View the source or contribute to the LiveKit Amazon Polly TTS plugin.

- **[AWS docs](https://docs.aws.amazon.com/polly/latest/dg/what-is.html)**: Amazon Polly's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Amazon Polly.

---

This document was rendered at 2025-09-27T09:36:12.443Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/tts/aws.md](https://docs.livekit.io/agents/integrations/tts/aws.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).