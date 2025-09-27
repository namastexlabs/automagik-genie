LiveKit Docs › LiveKit Cloud › Architecture

---

# LiveKit Cloud Architecture

> LiveKit Cloud gives you the flexibility of LiveKit's WebRTC stack, combined with global, CDN-scale infrastructure offering 99.99% uptime.

## Built with LiveKit SFU

[LiveKit Cloud](https://livekit.io/cloud) builds on our open-source [SFU](https://github.com/livekit/livekit). This means it supports the exact same SDKs and APIs as the open-source [stack](https://github.com/livekit).

Maintaining compatibility with LiveKit's Open Source stack (OSS) is important to us. We didn't want any developer locked into using LiveKit Cloud, or needing to integrate a different set of features, APIs or SDKs for their applications to work with it. Our design goal: a developer should be able to switch between LiveKit Cloud or self-hosted without changing a line of code.

## Distributed Mesh Architecture

In contrast to traditional [WebRTC architectures](https://docs.livekit.io/reference/internals/livekit-sfu.md), LiveKit Cloud runs multiple SFU instances in a mesh formation. We've developed capabilities for media servers to discover and connect to one another, in order to relay media between servers. This key capability allows us to bypass the single-server limitation that exists in traditional SFU and MCU architectures.

### Multi-home

![Cloud multi-home architecture](/images/cloud/architecture-multi-home.svg)

With a multi-home architecture, participants no longer need to connect to the same server. When participants from different regions join the same meeting, they'll each connect to the SFU closest to them, minimizing latency and transmission loss between the participant and SFU.

Each SFU instance establishes connections to other instances over optimized inter-data center networks. Inter-data center networks often run close to internet backbones, delivering high throughput with a minimal number of network hops.

### No SPOF

Anything that can fail, will. LiveKit Cloud is designed to anticipate (and recover from) failures in every software and hardware component.

Layers of redundancy are built into the system. A media server failure is recovered from by moving impacted participants to another instance. We isolate shared infrastructure, like our message bus, to individual data centers.

When an entire data center fails, customer traffic is automatically migrated to the next closest data center. LiveKit's SDKs will perform a "session migration": moving existing WebRTC sessions to a different media server without service interruption for your users.

### Globally distributed

To serve end users around the world, our infrastructure runs across multiple cloud vendors and data centers, delivering under 100ms of latency in each region. Today, we have data centers in the following regions:

- North America (US East, US Central, US West)
- South America (Brazil)
- Oceania (Australia)
- East Asia (Japan)
- Southeast Asia (Singapore)
- South Asia (India)
- Middle East (Israel, Saudi Arabia, UAE)
- Africa (South Africa)
- Europe (France, Germany, UK)

### Designed to scale

When you need to support many viewers on a media track, such as in a livestream, LiveKit Cloud dynamically manages that capacity by forming a distribution mesh, similar to a CDN. This process occurs automatically as your session scales, with no special configurations required. Every LiveKit Cloud project scales seamlessly to accommodate millions of concurrent users in any session.

![Scaling for livestreaming](/images/cloud/architecture-scale.svg)

For a deeper look into the design decisions we've made for LiveKit Cloud, you can [read more](https://blog.livekit.io/scaling-webrtc-with-distributed-mesh/) on our blog.

---

This document was rendered at 2025-09-27T09:36:31.434Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud/architecture.md](https://docs.livekit.io/home/cloud/architecture.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).