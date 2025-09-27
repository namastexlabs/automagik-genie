LiveKit Docs › Provider-specific guides › Plivo

---

# Create and configure a Plivo SIP trunk

> Step-by-step instructions for creating inbound and outbound SIP trunks using Plivo.

Use the following steps to configure inbound and outbound SIP trunks using [Plivo](https://plivo.com).

## Creating a SIP trunk using the Plivo Console

Create a Plivo SIP trunk for incoming or outgoing calls, or both, using the following steps.

### Prerequisites

[A phone number to make/receive calls](https://support.plivo.com/hc/en-us/articles/360041397412-How-can-I-rent-a-phone-number).

### Create a SIP trunk

1. Sign in to the [Plivo Console](https://console.plivo.com/).
2. Navigate to [Zentrunk Dashboard](https://console.plivo.com/zentrunk/dashboard/).
3. Create a SIP connection:

**Inbound**:

1. Select **Create New Inbound Trunk** and provide a descriptive name for your trunk.
2. Under **Trunk Authentication**, click **Add New URI**.
3. Enter your [LiveKit SIP endpoint](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md#sip-endpoint). For example, `vjnxecm0tjk.sip.livekit.cloud`

> ℹ️ **Region-based endpoints**
> 
> To restrict calls to a specific region, replace your global LiveKit SIP endpoint with a [region-based endpoint](https://docs.livekit.io/sip/cloud.md#region-pinning).
4. Select **Create Trunk** to complete your inbound trunk creation.
5. Navigate to the [**Phone Numbers Dashboard**](https://console.plivo.com/active-phone-numbers/) and select the number to route to your inbound trunk.
6. Under **Number Configuration**, set **Trunk** to your newly created inbound trunk and select **Update** to save.

---

**Outbound**:

1. Select **Create New Outbound Trunk** and provide a descriptive name for your trunk.
2. Under **Trunk Authentication**, click **Add New Credentials List**.
3. Add a username and password to use to authenticate your outbound calls and has been configured in your [LiveKit outbound trunk](https://docs.livekit.io/sip/trunk-outbound.md).
4. Select **Create Credentials List**.
5. Save your credentials list and select **Create Trunk** to complete your outbound trunk configuration.

## Next steps

Head back to the main setup documentation to finish connecting your SIP trunk to LiveKit.

- **[SIP trunk setup](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md#livekit-setup)**: Configure your Plivo trunk in LiveKit.

---

This document was rendered at 2025-09-27T09:36:49.184Z.
For the latest version of this document, see [https://docs.livekit.io/sip/quickstarts/configuring-plivo-trunk.md](https://docs.livekit.io/sip/quickstarts/configuring-plivo-trunk.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).