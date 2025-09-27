LiveKit Docs › LiveKit Cloud › Overview

---

# LiveKit Cloud

> The fully-managed, globally distributed LiveKit deployment option.

LiveKit Cloud is a fully-managed, globally distributed mesh network of LiveKit servers that provides all the power of the open-source platform with none of the operational complexity. It allows you to focus on building your application while LiveKit handles deployment, scaling, and maintenance.

- **[Dashboard](https://cloud.livekit.io)**: Sign up for LiveKit Cloud to manage your projects, view analytics, and configure your LiveKit Cloud deployment.

- **[Pricing](https://livekit.io/pricing)**: View LiveKit Cloud pricing plans and choose the right option for your application's needs.

## Why Choose LiveKit Cloud?

- **Zero operational overhead**: No need to manage servers, scaling, or infrastructure.
- **Global edge network**: Users connect to the closest server for minimal latency.
- **Unlimited scale**: Support for rooms with unlimited participants through our mesh architecture.
- **Enterprise-grade reliability**: 99.99% uptime guarantee with redundant infrastructure.
- **Comprehensive analytics**: Monitor usage, performance, and quality metrics through the LiveKit Cloud dashboard.
- **Same APIs and SDKs**: Use the exact same code whether you're on LiveKit Cloud or self-hosted.

LiveKit Cloud runs the same open-source servers that you can find on GitHub. It provides the same APIs and supports all of the same SDKs. An open source user can migrate to LiveKit Cloud, and a LiveKit Cloud customer can switch to self-hosted at any moment. As far as your code is concerned, the only difference is the URL that it connects to.

For more details on LiveKit Cloud's architecture, see [LiveKit Cloud architecture](https://docs.livekit.io/home/cloud/architecture.md).

## Comparing LiveKit Cloud to self-hosted

When building with LiveKit, you can either self-host the open-source server or use the managed LiveKit Cloud service:

|  | Self-hosted | LiveKit Cloud |
| **Realtime features** | Full support | Full support |
| **Egress (recording, streaming)** | Full support | Full support |
| **Ingress (RTMP, WHIP, SRT ingest)** | Full support | Full support |
| **SIP (telephony integration)** | Full support | Full support |
| **Agents framework** | Full support | Full support |
| **Who manages it** | You | LiveKit |
| **Architecture** | Single-home SFU | Mesh SFU |
| **Connection model** | Users in the same room connect to the same server | Each user connects to the closest server |
| **Max users per room** | Up to ~3,000 | No limit |
| **Analytics & telemetry** | N/A | LiveKit Cloud dashboard |
| **Uptime guarantees** | N/A | 99.99% |

---

This document was rendered at 2025-09-27T09:36:30.865Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud.md](https://docs.livekit.io/home/cloud.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).