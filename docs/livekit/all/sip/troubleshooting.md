LiveKit Docs › Reference › Troubleshooting

---

# SIP troubleshooting guide

> Common issues and solutions for SIP.

The following sections cover some of the common issues and solutions for LiveKit SIP integrations.

## General issues

The following issues can apply to both incoming and outgoing calls.

### 403 Forbidden

This error indicates an authentication or permission errors, but can also be returned when regional requirements are not met (see [403 - Domestic Anchored Terms Not Met](#403-region-error)).

#### Solution

Verify the username and password you're using are correct. Check the credentials you configured with your SIP trunking provider and confirm they match the credentials you set on the SIP trunk.

### 403 - Domestic Anchored Terms Not Met

This error commonly occurs in regions where regulations require calls to remain within national borders. If a call is routed to another country, SIP providers return this error to indicate that the call violates domestic compliance requirements.

#### Solution

Use region pinning to restrict calls to a specific region. For inbound calls, use [region-based endpoints](https://docs.livekit.io/sip/cloud.md#inbound-calls). For outbound calls, specify the `destination_country` parameter when you create an [outbound trunk](https://docs.livekit.io/sip/trunk-outbound.md#region-pinning).

To learn more see [SIP cloud and region pinning](https://docs.livekit.io/sip/cloud.md).

### 404 - Not Found

This error can be returned for multiple reasons. This section covers some of the possible 404 errors that can occur.

| Error message | Cause |
| `twirp error unknown: object cannot be found` | Trunk ID references a trunk that doesn't exist or is inaccessible. |
| `The destination doesn't exist, or can't be found.` | Destination number might be invalid or not in service. |

#### Solution

Depending on the error, check one or all of the following list:

- Confirm the LiveKit SIP trunk exists and the trunk ID is correct.
- Verify the destination number is a valid phone number.

### Audio quality issues

Poor audio quality is often caused by network issues. If connectivity isn't the problem, other factors—such as background noise or echo picked up by the speaker—can affect audio quality.

#### Solution

Enable background noise cancellation (BVC) for your agent, along with client-side echo cancellation. Both are recommended for the optimal audio quality. To learn more, see [Noise cancellation](https://docs.livekit.io/home/cloud/noise-cancellation.md).

## Call transfer issues

These errors can occur while trying to transfer a call using the `TransferSIPParticipant` API.

### 408 - Request Timeout

This Twirp error occurs if the transfer is rejected by the remote endpoint and the system times out waiting for a successful response.

#### Solution

To troubleshoot, try the following steps:

1. Verify the SIP URI for the transfer destination. Check that the URI is properly formatted and reachable.
2. Verify the trunk you configured with your SIP trunking provider. Check that it has the appropriate permissions to transfer calls to the target destination.

> ℹ️ **Note**
> 
> If you're using Telnyx as your SIP provider, SIP REFER must be enabled for your account. If they've enabled it, but you're still unable to transfer calls, verify you can transfer calls outside of LiveKit using their [API](https://developers.telnyx.com/api/call-control/dial-call).

## Inbound calls

The following issues are specific to inbound calls.

### Call rings, but agent doesn't answer

This usually happens when the agent name is missing or incorrect in the dispatch rule. To ensure an agent answer incoming calls, you must explicitly set the agent name for the agent, and in the dispatch rule.

#### Solution

Make sure the agent name matches in both of the following places:

- When creating your agent: set `agent_name` in `WorkerOptions`. To learn more, see [Explicit agent dispatch](https://docs.livekit.io/agents/worker/agent-dispatch.md#explicit).
- When creating your dispatch rule: set `agent_name` in `RoomAgentDispatch`. For an example, see [Caller dispatch rule (individual)](https://docs.livekit.io/sip/dispatch-rule.md#caller-dispatch-rule-individual-).

To learn more, see [Agent dispatch](https://docs.livekit.io/agents/worker/agent-dispatch.md).

## Outbound calls

The following issues are specific to outbound calls.

### 503 - Service Unavailable

This error from your SIP trunking provider might be the result of a configuration issue with the `address` field for your outbound trunk.

For example, the SIP endpoint for Telnyx is `sip.telnyx.com`. If you include a subdomain in the `address` field (for example, `myproject.sip.telnyx.com`), this error occurs.

#### Solution

Check with your SIP trunking provider and verify you're using the correct SIP endpoint in the `address` field for your outbound trunk. To learn more, see [Create an outbound trunk](https://docs.livekit.io/sip/trunk-outbound.md#create).

---

This document was rendered at 2025-09-27T09:36:51.758Z.
For the latest version of this document, see [https://docs.livekit.io/sip/troubleshooting.md](https://docs.livekit.io/sip/troubleshooting.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).