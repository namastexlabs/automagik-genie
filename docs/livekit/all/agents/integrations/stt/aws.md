LiveKit Docs › Integration guides › Speech-to-text (STT) › Amazon Transcribe

---

# Amazon Transcribe STT integration guide

> How to use the Amazon Transcribe STT plugin for LiveKit Agents.

Available in:
- [ ] Node.js
- [x] Python

## Overview

[Amazon Transcribe](https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html) provides a streaming STT service with high accuracy, realtime transcription. You can use the open source Amazon Transcribe plugin for LiveKit Agents to build voice AI with fast, accurate transcription.

## Quick reference

This section provides a brief overview of the Amazon Transcribe STT plugin. For more information, see [Additional resources](#additional-resources).

### Installation

Install the plugin from PyPI:

```bash
pip install "livekit-agents[aws]~=1.2"

```

### Authentication

The Amazon Transcribe plugin requires an [AWS API key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html).

Set the following environment variables in your `.env` file:

```shell
AWS_ACCESS_KEY_ID=<aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<aws-secret-access-key>
AWS_DEFAULT_REGION=<aws-deployment-region>

```

### Usage

Use Amazon Transcribe STT in an `AgentSession` or as a standalone transcription service. For example, you can use this STT in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

```python
from livekit.plugins import aws

session = AgentSession(
   stt = aws.STT(
      session_id="my-session-id",
      language="en-US",
      vocabulary_name="my-vocabulary",
      vocab_filter_name="my-vocab-filter",
      vocab_filter_method="mask",
   ),
   # ... llm, tts, etc.
)

```

### Parameters

This section describes some of the available parameters. See the [plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/aws/index.html.md#livekit.plugins.aws.STT) for a complete list of all available parameters.

- **`speech_region`** _(string)_ (optional) - Default: `us-east-1` - Environment: `AWS_DEFAULT_REGION`: The region of the AWS deployment. Required if the environment variable isn't set.

- **`language`** _(string)_ (optional) - Default: `en-US`: The language of the audio. For a full list of supported languages, see the [Supported languages](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html) page.

- **`vocabulary_name`** _(string)_ (optional) - Default: `None`: Name of the custom vocabulary you want to use when processing your transcription. To learn more, see [Custom vocabularies](https://docs.aws.amazon.com/transcribe/latest/dg/custom-vocabulary.html).

- **`session_id`** _(string)_ (optional): Name for your transcription session. If left empty, Amazon Transcribe generates an ID and returns it in the response.

- **`vocab_filter_name`** _(string)_ (optional) - Default: `None`: Name of the custom vocabulary filter that you want to use when processing your transcription. To learn more, see [Using custom vocabulary filters to delete, mask, or flag words](https://docs.aws.amazon.com/transcribe/latest/dg/vocabulary-filtering.html).

- **`vocab_filter_method`** _(string)_ (optional) - Default: `None`: Display method for the vocabulary filter. To learn more, see [Using custom vocabulary filters to delete, mask, or flag words](https://docs.aws.amazon.com/transcribe/latest/dg/vocabulary-filtering.html).

## Additional resources

The following resources provide more information about using Amazon Transcribe with LiveKit Agents.

- **[Python package](https://pypi.org/project/livekit-plugins-aws/)**: The `livekit-plugins-aws` package on PyPI.

- **[Plugin reference](https://docs.livekit.io/reference/python/v1/livekit/plugins/aws/index.html.md#livekit.plugins.aws.STT)**: Reference for the Amazon Transcribe STT plugin.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-aws)**: View the source or contribute to the LiveKit Amazon Transcribe STT plugin.

- **[AWS docs](https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html)**: Amazon Transcribe's full docs site.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Amazon Transcribe.

---

This document was rendered at 2025-09-27T09:36:07.204Z.
For the latest version of this document, see [https://docs.livekit.io/agents/integrations/stt/aws.md](https://docs.livekit.io/agents/integrations/stt/aws.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).