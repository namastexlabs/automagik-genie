LiveKit Docs › LiveKit CLI › Getting started

---

# LiveKit CLI Setup

> Install the LiveKit CLI and test your setup using an example frontend application.

## Install LiveKit CLI

**macOS**:

Install the LiveKit CLI with [Homebrew](https://brew.sh/):

```text
brew install livekit-cli

```

---

**Linux**:

```text
curl -sSL https://get.livekit.io/cli | bash

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**Windows**:

```text
winget install LiveKit.LiveKitCLI

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**From Source**:

This repo uses [Git LFS](https://git-lfs.github.com/) for embedded video resources. Please ensure git-lfs is installed on your machine before proceeding.

```text
git clone github.com/livekit/livekit-cli
make install

```

`lk` is LiveKit's suite of CLI utilities. It lets you conveniently access server APIs, create tokens, and generate test traffic all from your command line. For more details, refer to the docs in the `livekit-cli` [GitHub repo](https://github.com/livekit/livekit-cli#usage).

## Add a project

You must link a LiveKit project to the LiveKit CLI to use it. This can be a project with LiveKit Cloud or a self-hosted LiveKit server instance.

To link a LiveKit Cloud project, run the following command then follow the instructions in your browser to authenticate.

```shell
lk cloud auth

```

To add a different project, see the [Project management](https://docs.livekit.io/home/cli/projects.md) guide.

> 💡 **Tip**
> 
> If you're looking to explore LiveKit's [Agents](https://docs.livekit.io/agents.md) framework, or want to prototype your app against a prebuilt frontend or token server, check out [Sandboxes](https://docs.livekit.io/home/cloud/sandbox.md).

## Generate access token

A participant creating or joining a LiveKit [room](https://docs.livekit.io/home/concepts/api-primitives.md) needs an [access token](https://docs.livekit.io/home/concepts/authentication.md) to do so. For now, let’s generate one via CLI:

**Localhost**:

```shell
lk token create \
  --api-key devkey --api-secret secret \
  --join --room test_room --identity test_user \
  --valid-for 24h

```

> 💡 **Tip**
> 
> Make sure you're running LiveKit server locally in [dev mode](https://docs.livekit.io/home/self-hosting/local.md#dev-mode).

---

**Cloud**:

```shell
lk token create \
  --api-key <PROJECT_KEY> --api-secret <PROJECT_SECRET> \
  --join --room test_room --identity test_user \
  --valid-for 24h

```

Alternatively, you can [generate tokens from your project's dashboard](https://cloud.livekit.io/projects/p_/settings/keys).

## Test with LiveKit Meet

> 💡 **Tip**
> 
> If you're testing a LiveKit Cloud instance, you can find your `Project URL` (it starts with `wss://`) in the project settings.

Use a sample app, [LiveKit Meet](https://meet.livekit.io), to preview your new LiveKit instance. Enter the token you [previously generated](#generate-access-token) in the "Custom" tab. Once connected, your microphone and camera will be streamed in realtime to your new LiveKit instance (and any other participant who connects to the same room)!

If interested, here's the [full source](https://github.com/livekit-examples/meet) for this example app.

### Simulating another publisher

One way to test a multi-user session is by [generating](#generate-access-token) a second token (ensure `--identity` is unique), opening our example app in another [browser tab](https://meet.livekit.io) and connecting to the same room.

Another way is to use the CLI as a simulated participant and publish a prerecorded video to the room. Here's how:

**Localhost**:

```shell
lk room join \
  --url ws://localhost:7880 \
  --api-key devkey --api-secret secret \
  --publish-demo --identity bot_user \
  my_first_room

```

---

**Cloud**:

```shell
lk room join \
  --url <PROJECT_SECURE_WEBSOCKET_ADDRESS> \
  --api-key <PROJECT_API_KEY> --api-secret <PROJECT_SECRET_KEY> \
  --publish-demo --identity bot_user \
  my_first_room

```

This command publishes a looped demo video to `my-first-room`. Due to how the file was encoded, expect a short delay before your browser has sufficient data to render frames.

---

This document was rendered at 2025-09-27T09:36:24.587Z.
For the latest version of this document, see [https://docs.livekit.io/home/cli.md](https://docs.livekit.io/home/cli.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).