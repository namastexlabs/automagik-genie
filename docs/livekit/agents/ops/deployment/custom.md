LiveKit Docs › Deployment & operations › Custom deployments

---

# Deploying to custom environments

> Guide to running LiveKit Agents in a custom environment.

## Overview

LiveKit agents are ready to deploy to any container orchestration system such as Kubernetes. The framework uses a worker pool model and job dispatch is automatically balanced by LiveKit server across available workers. The workers themselves spawn a new sub-process for each job, and that job is where your code and agent participant run.

## Project setup

Deploying to a production environment generally requires a simple `Dockerfile` that builds and runs an agent worker, and a deployment platform that scales your worker pool based on load.

The following starter projects each include a working Dockerfile and CI configuration.

- **[Python Voice Agent](https://github.com/livekit-examples/agent-starter-python)**: A production-ready voice AI starter project for Python.

- **[Node.js Voice Agent](https://github.com/livekit-examples/agent-starter-node)**: A production-ready voice AI starter project for Node.js.

## Where to deploy

LiveKit Agents can be deployed almost anywhere. The LiveKit team and community have found the following deployment platforms to be the easiest and most cost-effective to use.

- **[LiveKit Cloud](https://docs.livekit.io/agents/ops/deployment.md)**: Run your agent on the same network and infrastructure that serves LiveKit Cloud, with builds, deployment, and scaling handled for you.

- **[Kubernetes](https://github.com/livekit-examples/agent-deployment/tree/main/kubernetes)**: Sample configuration for deploying and autoscaling LiveKit Agents on Kubernetes.

- **[Render](https://github.com/livekit-examples/agent-deployment/tree/main/render)**: Sample configuration for deploying and autoscaling LiveKit Agents on Render.

- **[More deployment examples](https://github.com/livekit-examples/agent-deployment)**: Example `Dockerfile` and configuration files for a variety of deployment platforms.

## Networking

Workers use a WebSocket connection to register with LiveKit server and accept incoming jobs. This means that workers do not need to expose any inbound hosts or ports to the public internet.

You may optionally expose a private health check endpoint for monitoring, but this is not required for normal operation. The default health check server listens on `http://0.0.0.0:8081/`.

## Environment variables

It is best to configure your worker with environment variables for secrets like API keys. In addition to the LiveKit variables, you are likely to need additional keys for external services your agent depends on.

For instance, an agent built with the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md) needs the following keys at a minimum:

** Filename: `.env`**

```shell
DEEPGRAM_API_KEY=<Your Deepgram API Key>
OPENAI_API_KEY=<Your OpenAI API Key>
CARTESIA_API_KEY=<Your Cartesia API Key>
LIVEKIT_API_KEY=%{apiKey}%
LIVEKIT_API_SECRET=%{apiSecret}%
LIVEKIT_URL=%{wsURL}%

```

> ❗ **Project environments**
> 
> It's recommended to use a separate LiveKit instance for staging, production, and development environments. This ensures you can continue working on your agent locally without accidentally processing real user traffic.
> 
> In LiveKit Cloud, make a separate project for each environment. Each has a unique URL, API key, and secret.
> 
> For self-hosted LiveKit server, use a separate deployment for staging and production and a local server for development.

## Storage

Worker and job processes have no particular storage requirements beyond the size of the Docker image itself (typically <1GB). 10GB of ephemeral storage should be more than enough to account for this and any temporary storage needs your app has.

## Memory and CPU

Memory and CPU requirements vary significantly based on the specific details of your app. For instance, agents that use [enhanced noise cancellation](https://docs.livekit.io/cloud/noise-cancellation.md) or the [LiveKit turn detector](https://docs.livekit.io/agents/build/turns/turn-detector.md) require more CPU and memory than those that don't. In some cases, the memory requirements might exceed the amount available on a cloud provider's free tier.

LiveKit recommends 4 cores and 8GB per worker as a starting rule for most voice AI apps. This worker can handle 10-25 concurrent jobs, depending on the components in use.

> ℹ️ **Real world load test results**
> 
> LiveKit ran a load test to evaluate the memory and CPU requirements of a typical voice-to-voice app.
> 
> - 30 agents each placed in their own LiveKit Cloud room.
> - 30 simulated user participants, one in each room.
> - Each simulated participant published looping speech audio to the agents.
> - Each agent subscribed to the incoming audio of the user and ran the Silero VAD plugin.
> - Each agent published their own audio (simple looping sine wave).
> - One additional user participant with a corresponding voice AI agent to ensure subjective quality of service.
> 
> This test ran all agents on a single 4-Core, 8GB machine. This machine reached peak usage of:
> 
> - CPU: ~3.8 cores utilized
> - Memory: ~2.8GB used

## Rollout

Workers stop accepting jobs upon `SIGINT` or `SIGTERM`. Any job still running on the worker continues to run to completion. It's important that you configure a large enough grace period such that your jobs can finish without interrupting the user experience.

Voice AI apps might require a 10+ minute grace period to allow for conversations to finish.

Different deployment platforms have different ways of setting this grace period. In Kubernetes, it's the `terminationGracePeriodSeconds` field in the pod spec.

Consult your deployment platform's documentation for more information.

## Load balancing

LiveKit server includes a built-in balanced job distribution system. This system peforms round-robin distribution with a single-assignment principle that ensures each job is assigned to only one worker. If a worker fails to accept the job within a predetermined timeout period, the job is sent to another available worker instead.

LiveKit Cloud additionally exercises geographic affinity to prioritize matching users and workers that are geographically closest to each other. This ensures the lowest possible latency between users and agents.

## Worker availability

Worker availability is defined by the `load_fnc` and `load_threshold` parameters in the `WorkerOptions` configuration. The `load_fnc` must return a value between 0 and 1, indicating how busy the worker is. `load_threshold` is the load value above which the worker stops accepting new jobs.

The default `load_fnc` is overall CPU utilization, and the default `load_threshold` is `0.7`.

In a custom deployment, you can override `load_fnc` and `load_threshold` to match the scaling behavior of your environment and application.

## Autoscaling

To handle variable traffic patterns, add an autoscaling strategy to your deployment platform. Your autoscaler should use the same underlying metrics as your `load_fnc` (the default is CPU utilization) but should scale up at a _lower_ threshold than your worker's `load_threshold`. This ensures continuity of service by adding new workers before existing ones go out of service. For example, if your `load_threshold` is `0.7`, you should scale up at `0.5`.

Since voice agents are typically long running tasks (relative to typical web requests), rapid increases in load are more likely to be sustained. In technical terms: spikes are less spikey. For your autoscaling configuration, you should consider _reducing_ cooldown/stabilization periods when scaling up. When scaling down, consider _increasing_ cooldown/stabilization periods because workers take time to drain.

For example, if deploying on Kubernetes using a Horizontal Pod Autoscaler, see [stabilizationWindowSeconds](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#default-behavior).

## LiveKit Cloud dashboard

You can use LiveKit Cloud for media transport even if your agents are deployed to a custom environment.  In this case, the LiveKit Cloud dashboard will show general information your self-deployed agents, including session count, the current load, and a list of running workers.

## Job crashes

Job crashes are written to worker logs for monitoring. If a job process crashes, it doesn't affect the worker or other jobs. If the worker crashes, all child jobs are terminated.

---

This document was rendered at 2025-09-27T09:36:20.603Z.
For the latest version of this document, see [https://docs.livekit.io/agents/ops/deployment/custom.md](https://docs.livekit.io/agents/ops/deployment/custom.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).