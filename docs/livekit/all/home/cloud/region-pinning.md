LiveKit Docs › LiveKit Cloud › Region pinning

---

# Region pinning

> Learn how to isolate LiveKit traffic to a specific region.

## Overview

Region pinning restricts network traffic to a specific geographical region. Use this feature to comply with local telephony regulations or data residency requirements.

There are two options for restricting traffic to a specific region:

- **Protocol-based region pinning**

Signaling and transport protocols include region selection. Use this option with LiveKit realtime SDKs.
- **Region-based endpoint**

Clients connect to a region-specific endpoint. Use this option for telephony applications. To learn more, see [SIP cloud and region pinning](https://docs.livekit.io/sip/cloud.md).

## Protocol-based region pinning

In protocol-based region pinning, region selection information is embedded in the initial signaling and transport messages. When pinning is enabled, if the initial connection is routed to a server outside the allowed regions, the request is rejected. The client then retries the connection using a server in one of the pinned regions.

Region pinning is available for customers on the [Scale plan](https://livekit.io/pricing) or higher.

> 🔥 **Protocol-based region pinning only works with LiveKit realtime SDKs**
> 
> For SIP requests, the server rejects the connection and doesn't retry it. Use [region-based endpoints](https://docs.livekit.io/sip/cloud.md#region-based-endpoint) for SIP.

> ℹ️ **When to use protocol-based region pinning**
> 
> When connecting with LiveKit realtime SDKs or when regional data residency (for example, GDPR compliance) is required.

### Enabling protocol-based region pinning

LiveKit must enable region pinning for your project. To request region pinning, sign in to [LiveKit Cloud](https://cloud.livekit.io) and select the **Support** option in the menu.

## Considerations

When you enable region pinning, you turn off automatic failover to the nearest region in the case of an outage.

## Available regions

The following regions are available for region pinning:

| Region name | Region locations |
| `africa` | South Africa |
| `asia` | Japan, Singapore |
| `aus` | Australia |
| `eu` | France, Germany, Zurich |
| `il` | Israel |
| `india` | India, India South |
| `me` | Saudi Arabia, UAE |
| `sa` | Brazil |
| `uk` | UK |
| `us` | US Central, US East B, US West B |

> ℹ️ **Note**
> 
> This list of regions is subject to change. Last updated 2025-07-23.

---

This document was rendered at 2025-09-27T09:36:32.847Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud/region-pinning.md](https://docs.livekit.io/home/cloud/region-pinning.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).