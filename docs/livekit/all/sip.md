LiveKit Docs › Getting started › Overview

---

# SIP overview

> Connect LiveKit to a telephone system using Session Initiation Protocol (SIP).

## Introduction

LiveKit SIP bridges the gap between traditional telephony and modern digital communication. It enables seamless interaction between traditional phone systems and LiveKit rooms. You can use LiveKit SIP to accept calls and make calls. When you add LiveKit Agents, you can use an AI voice agent to handle your inbound and outbound calls.

## Concepts

LiveKit SIP extends the [core primitives](https://docs.livekit.io/home/get-started/api-primitives.md)—participant, room, and track—to include two additional concepts specific to SIP: trunks and dispatch rules. These concepts are represented by objects created through the [API](https://docs.livekit.io/sip/api.md) and control how calls are handled.

### SIP participant

Each caller, callee, and AI voice agent that participates in a call is a LiveKit participant. A SIP participant is like any other participant and can be managed using the [participant APIs](https://docs.livekit.io/home/server/managing-participants.md). They have the same [attributes and metadata](https://docs.livekit.io/home/client/data/participant-attributes.md) as any other participant, and have additional [SIP specific attributes](https://docs.livekit.io/sip/sip-participant.md).

For inbound calls, a SIP participant is automatically created for each caller. To make an outbound call, you create a SIP participant using the [`CreateSIPParticipant`](https://docs.livekit.io/sip/api.md#createsipparticipant) API to make the call.

### Trunks

LiveKit SIP trunks bridge your SIP provider and LiveKit. To use LiveKit, you must configure a SIP trunk with your telephony provider. The setup depends on your use case—whether you're handling incoming calls, making outgoing calls, or both.

- [Inbound trunks](https://docs.livekit.io/sip/trunk-inbound.md) handle incoming calls and can be restricted to specific IP addresses or phone numbers.
- [Outbound trunks](https://docs.livekit.io/sip/trunk-outbound.md) are used to place outgoing calls.

Trunks can be region restricted to meet local telephony regulations.

> ℹ️ **Note**
> 
> The same SIP provider trunk can be associated with both an inbound and an outbound trunk in LiveKit. You only need to create an inbound or outbound trunk _once_.

### Dispatch rules

[Dispatch Rules](https://docs.livekit.io/sip/dispatch-rule.md) are associated with a specific trunk and control how inbound calls are dispatched to LiveKit rooms. All callers can be placed in the same room or different rooms based on the dispatch rules. Multiple dispatch rules can be associated with the same trunk as long as each rule has a different pin.

Dispatch rules can also be used to add custom participant attributes to [SIP participants](https://docs.livekit.io/sip/sip-participant.md).

## Service architecture

LiveKit SIP relies on the following services:

- SIP trunking provider for your phone number. LiveKit SIP supports most SIP providers out of the box.
- LiveKit server (part of LiveKit Cloud) for API requests, managing and verifying SIP trunks and dispatch rules, and creating participants and rooms for calls.
- LiveKit SIP (part of LiveKit Cloud) to respond to SIP requests, mediate trunk authentication, and match dispatch rules.

If you use LiveKit Cloud, LiveKit SIP is ready to use with your project without any additional configuration. If you're self hosting LiveKit, the SIP service needs to be deployed separately. To learn more about self hosting, see [SIP server](https://docs.livekit.io/home/self-hosting/sip-server.md).

![undefined]()

## Using LiveKit SIP

The LiveKit SIP SDK is available in multiple languages. To learn more, see [SIP API](https://docs.livekit.io/sip/api.md).

LiveKit SIP has been tested with the following SIP providers:

> ℹ️ **Note**
> 
> LiveKit SIP is designed to work with all SIP providers. However, compatibility testing is limited to the providers below.

| [Twilio](https://www.twilio.com/) | [Telnyx](https://telnyx.com/) | [Exotel](https://exotel.com) | [Plivo](https://www.plivo.com) | [Wavix](https://wavix.com/resources/guides/livekit) |

## SIP features

LiveKit SIP supports the following functionality.

| Feature | Description |
| DTMF | You can configure DTMF when making outbound calls by adding them to the `CreateSIPParticipant` request. To learn more, see [Making a call with extension codes (DTMF)](https://docs.livekit.io/sip/outbound-calls.md#dtmf). |
| SIP REFER | You can transfer calls using the `TransferSIPParticipant` API. Calls can be transferred to any valid telephone number or SIP URI. To learn more, see [Cold transfer](https://docs.livekit.io/sip/transfer-cold.md) and [Warm transfer](https://docs.livekit.io/sip/transfer-warm.md). |
| SIP headers | You can map custom `X-*` SIP headers to participant attributes. For example, custom headers can be used to route calls to different workflows. To learn more, see [Custom attributes](https://docs.livekit.io/sip/sip-participant.md#custom-attributes). |
| Noise cancellation | You can enable noise cancellation for callers and callees using Krisp. To learn more, see [Noise cancellation for calls](#noise-cancellation-for-calls). |
| Region pinning | You can restrict incoming and outgoing calls to a specific region to comply with local telephony regulations. To learn more, see [Region pinning for SIP](https://docs.livekit.io/sip/cloud.md#region-pinning). |
| Secure trunking | You can enable encryption for signaling traffic and media using TLS and SRTP for SIP calls. To learn more, see [Secure trunking](https://docs.livekit.io/sip/secure-trunking.md). |

### Supported protocols

LiveKit SIP supports the following protocols:

| Protocol | Description |
| TCP, UDP, TLS | Transport protocols for SIP signaling. |
| RTP, SRTP | Network protocols for delivering audio and video media. |

### Noise cancellation for calls

[Krisp](https://krisp.ai) noise cancellation uses AI models to identify and remove background noise in realtime. This improves the quality of calls that occur in noisy environments. For LiveKit SIP applications that use agents, noise cancellation improves the quality and clarity of user speech for turn detection, transcriptions, and recordings.

For incoming calls, see the [inbound trunks documentation](https://docs.livekit.io/sip/trunk-inbound.md) for the `krisp_enabled` attribute. For outgoing calls, see the [`CreateSIPParticipant`](https://docs.livekit.io/sip/api.md#createsipparticipant) documentation for the `krisp_enabled` attribute used during [outbound call creation](https://docs.livekit.io/sip/outbound-calls.md).

## Next steps

See the following guides to get started with LiveKit SIP:

- **[SIP trunk setup](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md)**: Purchase a phone number and configure your SIP trunking provider for LiveKit SIP.

- **[Accepting inbound calls](https://docs.livekit.io/sip/accepting-calls.md)**: Learn how to accept inbound calls with LiveKit SIP.

- **[Making outbound calls](https://docs.livekit.io/sip/making-calls.md)**: Learn how to make outbound calls with LiveKit SIP.

- **[Voice AI telephony guide](https://docs.livekit.io/agents/start/telephony.md)**: Create an AI agent integrated with telephony.

---

This document was rendered at 2025-09-27T09:36:46.416Z.
For the latest version of this document, see [https://docs.livekit.io/sip.md](https://docs.livekit.io/sip.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).