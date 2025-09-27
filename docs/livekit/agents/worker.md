LiveKit Docs › Worker lifecycle › Overview

---

# Worker lifecycle

> How the worker coordinates with LiveKit server to manage agent jobs.

## Overview

When you start your app with `python agent.py dev`, it registers as a **worker** with the LiveKit server. The server manages dispatching programmatic participants to rooms by sending requests to available workers.

A [programmatic participant](#programmatic-participants) is any code that joins a LiveKit room as a participant—this includes AI agents, media processors, or custom logic that processes realtime streams. This topic describes the worker lifecycle for AI agents, but the same lifecycle applies to all programmatic participants.

## Lifecycle

When a user connects to a [room](https://docs.livekit.io/home/get-started/api-primitives.md#room), a worker fulfills the request to dispatch an agent to the room. An overview of the worker lifecycle is as follows:

1. **Worker registration**: Your agent code registers itself as a "worker" with LiveKit server, then waits on standby for requests.
2. **Job request**: When a user connects to a room, LiveKit server sends a request to an available worker. A worker accepts and starts a new process to handle the job. This is also known as [agent dispatch](https://docs.livekit.io/agents/worker/agent-dispatch.md).
3. **Job**: The job initiated by your `entrypoint` function. This is the bulk of the code and logic you write. To learn more, see [Job lifecycle](https://docs.livekit.io/agents/worker/job.md).
4. **LiveKit session close**: By default, a room is automatically closed when the last non-agent participant leaves. Any remaining agents disconnect. You can also [end the session](https://docs.livekit.io/agents/worker/job.md#ending-the-session) manually.

The following diagram shows the worker lifecycle:

![Diagram describing the functionality of agent workers](/images/agents/agents-jobs-overview.svg)

Some additional features of workers include the following:

- Workers automatically exchange availability and capacity information with the LiveKit server, enabling load balancing of incoming requests.
- Each worker can run multiple jobs simultaneously, running each in its own process for isolation. If one crashes, it won't affect others running on the same worker.
- When you deploy updates, workers gracefully drain active LiveKit sessions before shutting down, ensuring sessions aren't interrupted.

## Programmatic participants

The Agents framework isn't limited to AI agents. You can use it to deploy any code that needs to process realtime media and data streams. Some examples of what these participants can do include the following:

- **Process audio streams**: Analyze audio for patterns, quality metrics, or content detection.
- **Handle video processing**: Apply computer vision, video effects, or content moderation.
- **Manage data flows**: Aggregate, transform, or route realtime data between participants.
- **Provide services**: Act as bridges to external APIs, databases, or other systems.

The framework provides the same production-ready infrastructure for all types of programmatic participants, including automatic scaling and load balancing. To learn more, see [Processing raw media tracks](https://docs.livekit.io/home/client/tracks/raw-tracks.md).

## Worker options

You can change the permissions, dispatch rules, add prewarm functions, and more through [WorkerOptions](https://docs.livekit.io/agents/worker/options.md).

---

This document was rendered at 2025-09-27T09:36:23.443Z.
For the latest version of this document, see [https://docs.livekit.io/agents/worker.md](https://docs.livekit.io/agents/worker.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).