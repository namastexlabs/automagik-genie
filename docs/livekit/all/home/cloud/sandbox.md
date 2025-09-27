LiveKit Docs › LiveKit Cloud › Sandbox

---

# Sandbox

> Rapidly prototype your apps and share them with others, cutting out the boilerplate.

## Overview

[LiveKit Sandboxes](https://cloud.livekit.io/projects/p_/sandbox) are hosted components that help you prototype your ideas without having to copy and paste code or manage deployments. They're integrated with our CLI, and ready to work with your LiveKit account out of the box. You can use a sandbox to:

- Build and customize an AI voice assistant you can share with others, without building and deploying a frontend.
- Prototype a mobile or web app without having to set up and deploy a backend server with a token endpoint.
- Set up video conferencing rooms with a single click, and share the link with friends and colleagues.

## Getting started

Once you've created a LiveKit Cloud account, you can head to the [Sandboxes](https://cloud.livekit.io/projects/p_/sandbox) page to create a new sandbox, choosing from one of our templates.

1. Create a LiveKit Cloud account and [Install the LiveKit CLI](https://docs.livekit.io/home/cli.md).
2. If you're setting up the CLI for the first time, authenticate with your LiveKit Cloud account:

```bash
lk cloud auth

```
3. Navigate to the [Sandboxes](https://cloud.livekit.io/projects/p_/sandbox) page to create a new sandbox, choosing from one of our templates.
4. Some templates (for example, [Next.js Voice Agent](https://github.com/livekit-examples/agent-starter-react)) require you to run some code on your local machine. This might be an AI agent, a web server, or some other component depending on that template's use case. If present, follow the instructions under the `Code` tab to clone and set up the component:

```bash
lk app create \
    --template <template-name> \
    --sandbox <my-sandbox-id>

```

## Moving to production

When you're ready to move on from the prototyping stage and own the code yourself, every sandbox app can be cloned to your local machine, ready for customization. The quickest way to do this is via the [LiveKit CLI](https://docs.livekit.io/home/cli.md):

```bash
lk app create --template <template-name>

```

You'll notice this is similar to the process for cloning agents and other local templates. That's because all sandboxes, and many other templates at [github.com/livekit-examples](https://github.com/livekit-examples), are simple git repositories with a few conventions around environment variables and make them ready to work with your LiveKit account and the CLI.

## Community templates

If you're interested in creating and sharing your own templates with the larger community of LiveKit users, check out the [Template Index](https://github.com/livekit-examples/index) repository for more information on contributing.

---

This document was rendered at 2025-09-27T09:36:33.125Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud/sandbox.md](https://docs.livekit.io/home/cloud/sandbox.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).