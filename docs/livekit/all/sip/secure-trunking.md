LiveKit Docs › Features › Secure trunking

---

# Secure trunking

> How to enable secure trunking for LiveKit SIP.

LiveKit SIP supports secure trunking using Transport Layer Security (TLS) to encrypt signaling traffic, and Secure Real-time Transport (SRTP) to encrypt media traffic. Encryption ensures that an Internet Service Provider (ISP) or a eavesdropping attacker (man-in-the-middle) cannot listen in on the conversation.

> ℹ️ **SIP REFER is not supported when using TLS.**
> 
> Transferring calls with SIP REFER is not currently supported over TLS.

## Configure secure trunking for SIP calls

Setting up secure trunking requires multiple steps and includes enabling SRTP and TLS on your SIP trunking provider side, and enabling media encryption on your LiveKit trunks or on a per-call basis. The following sections provide instructions for enabling secure trunking with Twilio and Telnyx and setting up your LiveKit SIP trunks.

To secure calls you must complete all of the following steps:

1. Enable secure trunking with your SIP trunking provider.
2. Update your SIP URIs to use TLS for transport.
3. Enable media encryption for your LiveKit SIP trunks.

## Step 1: Enable secure trunking with your SIP trunking provider

Depending on your SIP trunking provider, you might need to explicitly enable secure trunking. The following instructions provide steps for Twilio and Telnyx. If you're using a different provider, check with them to see if you need to enable secure trunking.

### Enable secure trunking with Twilio and Telnyx

The following instructions assume you have already configured trunking with your SIP provider. If you haven't, see the [SIP trunk setup](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md) quickstart or select your provider-specific instructions from the navigation menu.

**Twilio**:

1. Sign in to the [Twilio Console](https://console.twilio.com/).
2. Select **Develop** tab → **Elastic SIP Trunking** → **Manage** → **Trunks**.
3. Select the trunk you want to edit.
4. On the **General Settings** page, under **Features**, enable **Secure Trunking**.
5. Save your changes.

---

**Telnyx**:

1. Sign in to the [Telnyx Portal](https://portal.telnyx.com/).
2. Select **Real-Time Communications** → **Voice** → **SIP Trunking**.
3. Select the trunk you want to edit.
4. Select the **Inbound** tab.
5. For **SIP transport protocol**, select **TLS**.
6. For **Encrypted media**, select **SRTP**.
7. Save your changes.

## Step 2: Update your SIP URIs to use TLS

The following instructions apply to inbound calls for Twilio or Telnyx. For other providers, set the origination URI to your SIP URI with `;transport=tls` appended to it. For example, if your SIP URI is:

`sip:bwwn08a2m4o.sip.livekit.cloud`

Set the origination URI to:

`sip:bwwn08a2m4o.sip.livekit.cloud;transport=tls`.

You can find your SIP URI on your LiveKit Cloud [project settings](https://cloud.livekit.io/projects/p_/settings) page.

If your provider doesn't support a SIP URI with URI parameters, you must enable TLS another way:

- Enable TLS in the trunk settings (required).
- If supported, set the port to `5061`, the default port for SIP over TLS.

> ℹ️ **TLS must be enabled**
> 
> Changing only the port number without enabling TLS is not enough. Some providers might treat port `5061` as a non-standard port for insecure UDP or TCP traffic.

Check your provider's documentation for exact steps.

For outbound calls, you must set the transport protocol to TLS in the outbound trunk settings in the following section.

**Twilio**:

1. Sign in to the [Twilio Console](https://console.twilio.com/).
2. Select the **Develop** tab → **Elastic SIP Trunking** → **Manage** → **Trunks**.
3. Select the trunk you want to edit → **Origination**.
4. Update the **Origination URI** to include `;transport=tls`.
5. Save your changes.

---

**Telnyx**:

1. Sign in to the [Telnyx Portal](https://portal.telnyx.com/).
2. Select **Real-Time Communications** → **Voice** → **SIP Trunking**.
3. Select the edit icon for your trunk → **Inbound settings**.
4. Select **Authentication and routing**.
5. In the **FQDN** section, select **Add FQDN**.
6. Add your SIP domain and port `5061` for TLS and save.
7. In the **Inbound calls routing** section, select the option you just added with port `5061`.
8. Save your changes.

## Step 3: Enable media encryption for your SIP trunks

Set the `media_encryption` parameter for your inbound or outbound trunks to either allow or require encryption. Valid values are as follows:

- `SIP_MEDIA_ENCRYPT_ALLOW`: Use media encryption if available.
- `SIP_MEDIA_ENCRYPT_REQUIRE`: Require media encryption.

By default, media encryption is turned off. To see all options, see the [API reference](https://docs.livekit.io/sip/api.md#sipmediaencryption).

### Create an inbound trunk

Create an inbound trunk with media encryption enabled. To edit a trunk instead, see [Edit an existing trunk](#edit-trunk).

1. Sign in to your [Telephony configuration](https://cloud.livekit.io/projects/p_/telephony/config) dashboard.
2. Select **Create new** → **Trunk**.
3. Select the **JSON editor** tab and copy and paste the following contents. Replace the phone number with the one purchased from your SIP trunking provider.

```json
{
    "name": "My trunk",
    "numbers": [
      "+15105550100"
    ],
    "krispEnabled": true,
    "mediaEncryption": "SIP_MEDIA_ENCRYPT_ALLOW"
}

```
4. Select **Create**.

### Create an outbound trunk

For outbound calls, create an outbound trunk with media encryption enabled and [transport](https://docs.livekit.io/sip/api.md#siptransport) protocol set to `SIP_TRANSPORT_TLS`. All calls made using this trunk use TLS and SRTP.

You can also enable media encryption on a [call-by-call basis](#per-call-encryption) by setting the `media_encryption` parameter in the `CreateSIPParticipant` request. However, you should still enable TLS for calls on the outbound trunk.

Use the following instructions to create a new wildcard outbound trunk with SRTP and TLSenabled. The wildcard allows all calls to be routed to the same trunk. To edit a trunk instead, see [Edit an existing trunk](#edit-trunk).

1. Sign in to your [Telephony configuration](https://cloud.livekit.io/projects/p_/telephony/config) dashboard.
2. Select **Create new** → **Trunk**.
3. Select the **JSON editor** → select **Outbound** for **Trunk direction**.
4. Copy and paste the following contents. Replace the SIP trunking provider endpoint, and username and password for authentication.

```json
{
"name": "My outbound trunk",
"address": "<sip-trunking-provider-endpoint>",
"transport": "SIP_TRANSPORT_TLS",
"numbers": [
   "*"
],
"authUsername": "<username>",
"authPassword": "<password>",
"mediaEncryption": "SIP_MEDIA_ENCRYPT_ALLOW"
}

```
5. Select **Create**.

### Edit an existing trunk

Edit an existing inbound or outbound trunk to enable media encryption using the LiveKit Cloud dashboard.

- Sign in to your [Telephony configuration](https://cloud.livekit.io/projects/p_/telephony/config) dashboard.
- Navigate to the **Inbound** or **Outbound** section on the page.
- Select the more menu (**⋮**) next to the trunk you want to edit → **Configure trunk**.
- For _outbound_ trunks, for **Transport** select **TLS**.
- Expand the **Optional settings** section. Select either **Media encryption enabled** or **Media encryption required**.
- Select **Update**.

### Enable media encryption per call

You can enable media encryption on a per-call basis by setting the `media_encryption` parameter in the `CreateSIPParticipant` request.

> ℹ️ **SRTP must be enabled**
> 
> You must also enable SRTP on the SIP trunking provider side. If you haven't already enabled this, see [Step 1: Enable secure trunking with your SIP trunking provider](#enable-secure-trunking).

1. Create a `sip-participant.json` file with the following participant details:

```json
{
  "sip_trunk_id": "<your-outbound-trunk-id>",
  "sip_call_to": "<phone-number-to-dial>",
  "room_name": "my-sip-room",
  "participant_identity": "sip-test",
  "participant_name": "Test Caller",
  "krisp_enabled": true,
  "wait_until_answered": true,
  "media_encryption": "SIP_MEDIA_ENCRYPT_ALLOW"
}

```
2. Create the SIP Participant using the CLI. After you run this command, a call is made to the `<phone-number-to-dial>` number from the number configured in your outbound trunk.

```shell
lk sip participant create sip-participant.json

```

---

This document was rendered at 2025-09-27T09:36:50.589Z.
For the latest version of this document, see [https://docs.livekit.io/sip/secure-trunking.md](https://docs.livekit.io/sip/secure-trunking.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).