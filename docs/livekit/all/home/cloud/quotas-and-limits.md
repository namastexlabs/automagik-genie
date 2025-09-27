LiveKit Docs › LiveKit Cloud › Quotas & limits

---

# Quotas and limits

> Guide to the quotas and limits for LiveKit Cloud plans.

## Overview

LiveKit Cloud offers metered usage, concurrency limits, and rate limits on a per-project basis. The following guide includes precise definitions and information about the reasons for these limits and how to change them.

## Metered resources

Most features of LiveKit Cloud are metered, meaning that you are charged based on the amount of resources you use. The following table shows the metered resources, their units, and the free quota included on the Build plan.

| Resource | Definition | Free quota |
| Agent session minutes | Active time that an agent [deployed](https://docs.livekit.io/agents/ops/deployment.md) to LiveKit Cloud is connected to a WebRTC or Telephony session. | 1,000 minutes |
| SIP participant minutes | Time that a single caller is connected to LiveKit Cloud via [SIP](https://docs.livekit.io/sip.md). | 1,000 minutes |
| WebRTC participant minutes | Time that a single user is connected to LiveKit Cloud via a [LiveKit SDK](https://docs.livekit.io/home/client/connect.md). | 5,000 |
| Downstream data transfer GB | The total data transferred out of LiveKit Cloud during a session, including [media tracks](https://docs.livekit.io/home/client/tracks.md) and [data packets](https://docs.livekit.io/home/client/data.md). | 50 GB |
| Transcode minutes | Time spent transcoding an incoming stream with the [Ingress service](https://docs.livekit.io/home/ingress/overview.md) or a composite stream with the [Egress service](https://docs.livekit.io/home/egress/overview.md). | 60 minutes |
| Track egress minutes | Time spent transcoding a single track with the [Egress service](https://docs.livekit.io/home/egress/track.md). | 60 minutes |

### Quotas

The free quota offered on the Build plan is shared across all of a user's projects. Creating additional projects does not increase the total available quota. After you exceed the free quota, requests fail until the quota resets. Quotas reset monthly.

Quotas for paid plans are applied per project. After you exceed the included quota, your project is billed incrementally based on resource usage according to the pricing on your plan. For current quotas and pricing, refer to the latest [pricing page](https://livekit.io/pricing).

## Concurrency limits

LiveKit Cloud places concurrency limits on a number of realtime services to ensure the stability of the network and to prevent abuse. This is similar to HTTP rate limiting, but for a continuous service with long-lived connections.

When these limits are reached, new connections of the same type fail.

The following table shows the limited connection types, and the default limits on the Build plan.

| Type | Definition | Free limit |
| Agent session | Actively connected agent sessions [running](https://docs.livekit.io/agents/ops/deployment.md) on LiveKit Cloud. | 5 sessions |
| Participant | Total number of connected agents and end-users across all [rooms](https://docs.livekit.io/home/get-started/api-primitives.md). | 100 participants |
| Ingress request | An active session of the [Ingress service](https://docs.livekit.io/home/ingress/overview.md) transcoding an incoming stream. | 2 requests |
| Egress request | An active session of the [Egress service](https://docs.livekit.io/home/egress/overview.md) recording a composite stream or single track. | 2 requests |

> ℹ️ **Agent cold starts**
> 
> Projects on the Build plan might have their deployed agents shut down after all active sessions end. The agent automatically starts again when a new session begins. This can cause up to 10-20s of delay before the agent joins the room.

You can view the current concurrency limits on your project at any time in the [LiveKit Cloud](https://cloud.livekit.io) dashboard by navigating to **Settings** and selecting the **Project** tab.

For concurrency limits on paid plans, refer to the latest [pricing](https://livekit.io/pricing).

### Requesting increases

Customers on the Scale plan can request an increase for specific limits in their [project settings](https://cloud.livekit.io/projects/p_/settings/project).

### Custom plans

LiveKit can work with you to ensure your project has the capacity it needs. [Contact the sales team](https://livekit.io/contact-sales?plan=Enterprise) with your project details.

## Egress time limits

The LiveKit Cloud [Egress service](https://docs.livekit.io/home/egress/overview.md) has time limits, which vary based on the output type. The following table shows the default limits for all plan types.

| Egress output | Time limit |
| File output (MP4, OGG, WebM) | 3 hours |
| HLS segments | 12 hours |
| HLS/RTMP streaming | 12 hours |
| Raw single stream (track) | 12 hours |

When these time limits are reached, any in-progress egress automatically ends with the status `LIMIT_REACHED`.

You can listen for this status change using the `egress_ended` [webhook](https://docs.livekit.io/home/server/webhooks.md).

## Media subscription limits

Each active participant can only subscribe to a limited number of individual media tracks at once. The following table shows the default limits for all plan types.

| Track type | Limit |
| Video | 100 |
| Audio | 100 |

For high volume video use cases, consider using pagination and [selective subscriptions](https://docs.livekit.io/home/client/receive.md#selective-subscription) to keep the number of subscriptions within these limits.

## API request rate limits

All projects have a 1000 requests per minute rate limit on API requests. The limit only applies to [Server API](https://docs.livekit.io/reference/server/server-apis.md) requests (for example, `RoomService` or `EgressService` API requests) and doesn't apply to SDK methods like joining a room or sending data packets.

LiveKit doesn't anticipate any project exceeding this rate limit. However, you can reach out to [support](mailto:support@livekit.io) to request an increase. Include the **Project URL** in your email. You can find your project URL in the LiveKit Cloud dashboard in your [Project Settings](https://cloud.livekit.io/projects/p_/settings/project) page.

---

This document was rendered at 2025-09-27T09:36:32.511Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud/quotas-and-limits.md](https://docs.livekit.io/home/cloud/quotas-and-limits.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).