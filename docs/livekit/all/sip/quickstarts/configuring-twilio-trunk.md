LiveKit Docs › Provider-specific guides › Twilio

---

# Create and configure a Twilio SIP trunk

> Step-by-step instructions for creating inbound and outbound SIP trunks using Twilio.

> ℹ️ **Note**
> 
> If you're using LiveKit Cloud as your SIP server and you're signed in, your SIP URI is automatically included in the code blocks where appropriate.

Use the following steps to configure inbound and outbound SIP trunks using [Twilio](https://twilio.com).

## Creating a SIP trunk for inbound and outbound calls

Create a Twilio SIP trunk for incoming or outgoing calls, or both, using the following steps. To use the Twilio console, see [Configure a SIP trunk using the Twilio UI](#configure-a-sip-trunk-using-the-twilio-ui).

> ℹ️ **Note**
> 
> For inbound calls, you can use TwiML for Programmable Voice instead of setting up Elastic SIP Trunking. To learn more, see [Inbound calls with Twilio Voice](https://docs.livekit.io/sip/accepting-calls-twilio-voice.md).

### Prerequisites

- [Purchase phone number](https://help.twilio.com/articles/223135247-How-to-Search-for-and-Buy-a-Twilio-Phone-Number-from-Console).
- [Install the Twilio CLI](https://www.twilio.com/docs/twilio-cli/getting-started/install).
- Create a [Twilio profile](https://www.twilio.com/docs/twilio-cli/general-usage/profiles) to use the CLI.

### Step 1. Create a SIP trunk

The domain name for your SIP trunk  must end in `pstn.twilio.com`. For example to create a trunk named `My test trunk` with the domain name `my-test-trunk.pstn.twilio.com`, run the following command:

```shell
twilio api trunking v1 trunks create \
--friendly-name "My test trunk" \
--domain-name "my-test-trunk.pstn.twilio.com"

```

The output includes the trunk SID. Copy it for use in the following steps.

### Step 2: Configure your trunk

Configure the trunk for inbound calls or outbound calls or both. To create a SIP trunk for both inbound and outbound calls, follow the steps in both tabs:

**Inbound**:

For inbound trunks, configure an [origination URI](https://www.twilio.com/docs/sip-trunking#origination). If you're using LiveKit Cloud and are signed in, your SIP URI is automatically included in the following command:

```shell
 twilio api trunking v1 trunks origination-urls create \
 --trunk-sid <twilio_trunk_sid> \
 --friendly-name "LiveKit SIP URI" \
 --sip-url "sip:%{sipHost}%" \
 --weight 1 --priority 1 --enabled

```

> ℹ️ **Region-based endpoints**
> 
> To restrict calls to a specific region, replace your global LiveKit SIP endpoint with a [region-based endpoint](https://docs.livekit.io/sip/cloud.md#region-pinning).

---

**Outbound**:

For outbound trunks, configure username and password authentication using a credentials list. Complete the following steps using the Twilio console.

**Step 1: Create a credential list**

1. Sign in to the [Twilio console](https://console.twilio.com).
2. Select **Voice** » **Credential lists**.
3. Create a new credential list with the username and password of your choice.

**Step 2: Associate the credential list with your SIP trunk**

1. Select **Elastic SIP Trunking** » **Manage** » **Trunks** and select the outbound trunk created in the previous steps.
2. Select **Termination** » **Authentication** » **Credential Lists** and select the credential list you just created.
3. Select **Save**.

### Step 3: Associate phone number and trunk

The Twilio trunk SID and phone number SID are included in the output of previous steps. If you didn't copy the SIDs, you can list them using the following commands:

- To list phone numbers: `twilio phone-numbers list`
- To list trunks: `twilio api trunking v1 trunks list`

```shell
twilio api trunking v1 trunks phone-numbers create \
--trunk-sid <twilio_trunk_sid> \
--phone-number-sid <twilio_phone_number_sid>

```

## Configure a SIP trunk using the Twilio UI

1. Sign in to the [Twilio console](https://console.twilio.com/).
2. [Purchase a phone number](https://help.twilio.com/articles/223135247-How-to-Search-for-and-Buy-a-Twilio-Phone-Number-from-Console).
3. [Create SIP Trunk](https://www.twilio.com/docs/sip-trunking#create-a-trunk) on Twilio:

- Select **Elastic SIP Trunking** » **Manage** » **Trunks**.
- Create a SIP trunk.
> 💡 **Tip**
> 
> Using your Twilio API key, you can skip the next two steps by using [this snippet](https://gist.github.com/ShayneP/51eabe243f9e7126929ea7e9db1dc683) to set your origination and termination URLs automatically.
4. For inbound calls:

- Navigate to **Voice** » **Manage** » **Origination connection policy**, and create an **Origination Connection Policy**
- Select the policy you just created and set the [Origination SIP URI](https://www.twilio.com/docs/sip-trunking#origination) to your LiveKit SIP URI (available on your [**Project settings**](https://cloud.livekit.io/projects/p_/settings/project) page). For example, `sip:vjnxecm0tjk.sip.livekit.cloud`.

> ℹ️ **Region-based endpoints**
> 
> To restrict calls to a specific region, replace your global LiveKit SIP endpoint with a [region-based endpoint](https://docs.livekit.io/sip/cloud.md#region-pinning).
5. For outbound calls, configure termination and authentication:

- Navigate to **Elastic SIP Trunking** » **Manage** » **Trunks**.
- Copy the [Termination SIP URI](https://www.twilio.com/docs/sip-trunking#termination-uri) to use when you create an [outbound trunk](https://docs.livekit.io/sip/trunk-outbound.md) for LiveKit.
- Configure [Authentication](https://www.twilio.com/docs/sip-trunking#authentication):

1. Select **Elastic SIP Trunking** » **Manage** » **Credential lists** and create a new credential list with a username and password of your choice.
2. Associate your trunk with the credential list:

- Select **Elastic SIP Trunking** » **Manage** » **Trunks** and select the outbound trunk created in the previous steps.
- Select **Termination** » *_Authentication_ » **Credential Lists** and select the credential list you just created.

## Next steps

Head back to the main setup documentation to finish connecting your SIP trunk to LiveKit.

- **[SIP trunk setup](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md#livekit-setup)**: Configure your Twilio trunk in LiveKit.

---

This document was rendered at 2025-09-27T09:36:50.028Z.
For the latest version of this document, see [https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk.md](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).