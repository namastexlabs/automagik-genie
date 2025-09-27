LiveKit Docs › Provider-specific guides › Wavix

---

# Using Wavix to accept and make calls

> Step-by-step instructions for configuring inbound and outbound calls using Wavix and LiveKit.

## Prerequisites

The following are required to complete the steps in this guide:

- A [Wavix account](https://app.wavix.com) account.
- A [purchased phone number](https://wavix.com) from Wavix.
- A project on [LiveKit Cloud](https://cloud.livekit.io/).

## Accepting inbound calls

Complete the following steps to accept inbound calls with Wavix and LiveKit.

### Step 1: Configure inbound call routing in Wavix

To receive calls with Wavix and LiveKit, you need to set up inbound call routing.

For this step, you need your LiveKit [SIP endpoint](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md#sip-endpoint). This is your LiveKit SIP URI without the `sip:` prefix. You can find your SIP URI on your [Project settings](https://cloud.livekit.io/projects/p_/settings/project) page.

1. Sign in to your [Wavix account](https://app.wavix.com).
2. Select **Numbers & trunks** → **My numbers**.
3. Select the more (**⋮**) menu and choose **Edit number**.
4. For **Destination** → **Configure inbound call routing**, select **SIP URI**.

Enter the destination in the format: `[did]@[LiveKit SIP endpoint]`, for example: `[did]@vjnxecm0tjk.sip.livekit.cloud`.

> ℹ️ **Note**
> 
> The `[did]` placeholder in the destination string is automatically replaced with your Wavix phone number.
5. Select **Save**.

### Step 2: Create an inbound trunk in LiveKit

An [inbound trunk](https://docs.livekit.io/sip/trunk-inbound.md) allows you to accept incoming phone calls to your Wavix phone number. To create an inbound trunk in LiveKit, use the following steps:

1. Sign in to [LiveKit Cloud](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select the **+Create new** button → **Trunk**.
4. For **Trunk direction**, select **Inbound**.
5. Enter a comma-separated list of Wavix numbers to associate with the trunk.
6. Select **Create**.

### Step 3: Create a dispatch rule in LiveKit

In addition to an inbound trunk, you need a [dispatch rule](https://docs.livekit.io/sip/dispatch-rule.md) to determine how callers are dispatched to LiveKit rooms.

Create a dispatch rule using the following steps:

1. Navigate to the **Telephony** → **Configuration** page.
2. Select the **+Create new** button → **Dispatch rule**.
3. Complete the **Rule name** and **Room name** fields.
4. Select **Match trunks** and select the inbound trunk you created in the previous step.

> ℹ️ **Additional options**
> 
> - Selecting trunks to match a dispatch rule is optional. By default, a dispatch rule applies to all inbound calls for your LiveKit project.
> - The default **Rule type** is **Direct**. This means all callers are placed in the same room. For alternative rule types, see [SIP dispatch rule](https://docs.livekit.io/sip/dispatch-rule.md).

### Test inbound calls

After you complete the setup steps, start a voice AI agent and call your Wavix phone number. Your agent should answer the call. If you don't have an agent, see the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md) to create one.

## Making outbound calls

Complete the following steps to make outbound calls using LiveKit and Wavix.

### Step 1: Create a SIP trunk in Wavix

Create a Wavix SIP trunk for outgoing calls, using the following steps.

1. Sign in to your [Wavix account](https://app.wavix.com).
2. Navigate to **Numbers & Trunks** → **Trunks**.
3. Select the **Create new** button.
4. Enter a **SIP trunk name**.
5. In the **Caller ID** section, select one of the phone numbers you purchased.
6. Under **Authentication Method**, select **Digest** and complete the **Password** fields.
7. Select **Next**.
8. Optionally, configure additional limits:- **Max outbound call duration**
- **Max number of simultaneous calls via the SIP trunk**
- **Max call cost**
9. Select **Save**.

After the SIP trunk is successfully created, it appears in your account's SIP trunks list. Note the 5-digit SIP trunk ID that is generated automatically. Your SIP trunk ID is needed for the next step when you create an outbound trunk in LiveKit.

### Step 2: Configure outbound calls

For outbound calls, you need to create an outbound trunk in LiveKit using the Wavix SIP trunk credentials:

1. Sign in to [LiveKit Cloud](https://cloud.livekit.io/).
2. Select **Telephony** → [**Configuration**](https://cloud.livekit.io/projects/p_/telephony/config).
3. Select the **+ Create new** button → **Trunk**.
4. For **Trunk direction**, select **Outbound**.
5. Configure the outbound trunk with the following settings:- **Address**: Use the Wavix SIP gateway (e.g., `<country-code>.wavix.net`)
- **Numbers**: Enter your Wavix phone number.
- Select **Optional settings** and complete the following fields:- **Username**: Your 5-digit SIP trunk ID from Wavix.
- **Password**: The SIP trunk password you set in Wavix.
- Select **Create**.

> 💡 **Tip**
> 
> Choose the primary gateway closest to your location. A full list of Wavix regional gateways is available at the bottom of your [Wavix trunks page](https://app.wavix.com/trunks).

## Transfer calls

Wavix supports cold call transfers using the SIP REFER command. To transfer a call, you need two Wavix numbers—one for the incoming call and one to transfer calls to.

To transfer an active LiveKit call, use the `TransferSIPParticipant` server API. The following is a Node.js example. To learn more and for additional examples, see [Call forwarding](https://docs.livekit.io/sip/transfer-cold.md).

```typescript
import { SipClient } from 'livekit-server-sdk';

async function transferParticipant(participant) {
  console.log("transfer participant initiated");

  const sipTransferOptions = {
    playDialtone: false
  };

  const sipClient = new SipClient(process.env.LIVEKIT_URL,
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET);

  const transferTo = "sip:+19495550100@us.wavix.net";

  await sipClient.transferSipParticipant('open-room', participant.identity,
    transferTo, sipTransferOptions);
  console.log('transfer participant');
}

```

Replace the `transferTo` value with your Wavix number using the format: `sip:+[YOUR_WAVIX_NUMBER]@[WAVIX_SIP_GATEWAY]`.

## Enable call encryption

You can choose to encrypt call media for enhanced security. Contact Wavix support to enable encryption for your Wavix numbers or trunks. After enabling encryption, see [Secure trunking](https://docs.livekit.io/sip/secure-trunking.md) to configure encryption for LiveKit trunks.

## Troubleshooting outbound calls

The following tables lists common issues with outbound calls.

| Issue | Cause |
| 603 Declined response | This might occur when calling a destination with a per-minute rate higher than the Max call rate set for your account. Contact Wavix support to request a change to your max call rate. |
| Registration issues | Check the registration status of your SIP trunk. |
| Wrong number format | Make sure you dial the full international number ([E.164](https://www.itu.int/rec/t-rec-e.164) format): For example, `+19085550100` (US), `+44946001218` (UK). Strip prefixes like `0`, `00`, or `011` before the dialed number. |

For additional troubleshooting help, see the [SIP troubleshooting guide](https://docs.livekit.io/sip/troubleshooting.md).

## Next steps

The following guides provide next steps for building your telephony app.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: A quickstart guide to build a voice AI agent to answer incoming calls.

- **[Agents telephony integration](https://docs.livekit.io/agents/start/telephony.md)**: Learn how to receive and make calls with a voice AI agent.

- **[Call forwarding using SIP REFER](https://docs.livekit.io/sip/transfer-cold.md)**: Forward calls to another number or SIP endpoint with SIP REFER.

- **[Agent-assisted warm transfer](https://docs.livekit.io/sip/transfer-warm.md)**: A guide for transferring calls using a voice AI agent to provide context.

---

This document was rendered at 2025-09-27T09:36:50.324Z.
For the latest version of this document, see [https://docs.livekit.io/sip/quickstarts/configuring-wavix-trunk.md](https://docs.livekit.io/sip/quickstarts/configuring-wavix-trunk.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).