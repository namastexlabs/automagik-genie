LiveKit Docs › LiveKit CLI › App templates

---

# App templates

> Create and initialize an app from a convenient set of templates.

> ℹ️ **Note**
> 
> Before starting, make sure you have created a LiveKit Cloud account, [installed the LiveKit CLI](https://docs.livekit.io/home/cli.md), and have authenticated or manually configured your LiveKit Cloud project of choice.

The LiveKit CLI can help you bootstrap applications from a number of convenient template repositories, using your project credentials to set up required environment variables and other configuration automatically. To create an application from a template, run the following:

```shell
lk app create --template <template_name> my-app

```

Then follow the CLI prompts to finish your setup.

The `--template` flag may be omitted to see a list of all available templates, or can be chosen from a selection of our first-party templates:

| **Template Name** | **Language/Framework** | **Description** |
| [agent-starter-python](https://github.com/livekit-examples/agent-starter-python) | Python | A starter project for Python, featuring a simple voice agent implementation |
| [agent-starter-react](https://github.com/livekit-examples/agent-starter-react) | TypeScript/Next.js | A starter app for Next.js, featuring a flexible voice AI frontend |
| [agent-starter-android](https://github.com/livekit-examples/agent-starter-android) | Kotlin/Android | A starter project for Android, featuring a flexible voice AI frontend |
| [agent-starter-swift](https://github.com/livekit-examples/agent-starter-swift) | Swift | A starter project for Swift, featuring a flexible voice AI frontend |
| [agent-starter-flutter](https://github.com/livekit-examples/agent-starter-flutter) | Flutter | A starter project for Flutter, featuring a flexible voice AI frontend |
| [agent-starter-react-native](https://github.com/livekit-examples/agent-starter-react-native) | React Native/Expo | A starter project for Expo, featuring a flexible voice AI frontend |
| [agent-starter-embed](https://github.com/livekit-examples/agent-starter-embed) | TypeScript/Next.js | A starter project for a flexible voice AI that can be embedded in any website |
| [token-server](https://github.com/livekit-examples/token-server-node) | Node.js/TypeScript | A hosted token server to help you prototype your mobile applications faster |
| [meet](https://github.com/livekit-examples/meet) | TypeScript/Next.js | An open source video conferencing app built on LiveKit Components and Next.js |
| [multi-agent-python](https://github.com/livekit-examples/multi-agent-python) | Python | A team of writing coach agents demonstrating multi-agent workflows |
| [outbound-caller-python](https://github.com/livekit-examples/outbound-caller-python) | Python | An agent that makes outbound calls using LiveKit SIP |

> 💡 **Tip**
> 
> If you're looking to explore LiveKit's [Agents](https://docs.livekit.io/agents.md) framework, or want to prototype your app against a prebuilt frontend or token server, check out [Sandboxes](https://docs.livekit.io/home/cloud/sandbox.md).

For more information on templates, see the [LiveKit Template Index](https://github.com/livekit-examples/index?tab=readme-ov-file).

---

This document was rendered at 2025-09-27T09:36:25.131Z.
For the latest version of this document, see [https://docs.livekit.io/home/cli/templates.md](https://docs.livekit.io/home/cli/templates.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).