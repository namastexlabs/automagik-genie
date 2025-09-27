LiveKit Docs › Provider-specific guides › Telnyx

---

# Create and configure Telnyx SIP trunk

> Step-by-step instructions for creating inbound and outbound SIP trunks using Telnyx.

> ℹ️ **Note**
> 
> If you're using LiveKit Cloud as your SIP server and you're signed in, your SIP endpoint is automatically included in the code blocks where appropriate.

## Creating a Telnyx SIP trunk using the API

You can use `curl` command to make calls to the Telnyx API V2. The commands in the steps below use the example phone number, `+15105550100`. To use the Telnyx console, see [Creating a SIP trunk using the Telnyx UI](#creating-a-sip-trunk-using-the-telnyx-ui).

### Prerequisite

Purchase a [Telnyx phone number](https://telnyx.com/products/phone-numbers).

### Step 1: Create an environment variable for API key

If you don't have a key a Telnyx API V2 key, see the [Telnyx guide to create one](https://support.telnyx.com/en/articles/4305158-api-keys-and-how-to-use-them).

```shell
export TELNYX_API_KEY="<your_api_v2_key>"

```

### Step 2: Create an FQDN connection

The following inbound and outbound commands include the required configuration settings if you plan on using only an inbound or outbound trunk for your LiveKit telephony app. However, by default, an [FQDN connection](https://developers.telnyx.com/api/connections/create-fqdn-connection) creates both an inbound and outbound trunk.

1. Creating an FQDN connection. Depending on your use case, select **Inbound**, **Outbound**, or **Inbound and outbound** to accept calls, make calls, or both:

**Inbound**:

Set the caller's number format to `+E.164` for inbound calls (this identifies the caller's number with a leading `+`):

```shell
curl -L 'https://api.telnyx.com/v2/fqdn_connections' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY" \
-d '{
  "active": true,
  "anchorsite_override": "Latency",
  "connection_name": "My LiveKit trunk",
  "inbound": {
    "ani_number_format": "+E.164",
    "dnis_number_format": "+e164"
  }
}'

```

---

**Outbound**:

For outbound trunks, complete the following items:

- Create a voice profile for outbound calls.
- Configure credential authentication with a username and password.
1. Creating a [voice profile](https://developers.telnyx.com/api/outbound-voice-profiles/create-voice-profile):

```shell
curl -L 'https://api.telnyx.com/v2/outbound_voice_profiles' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY" \
-d '{
  "name": "My LiveKit outbound voice profile",
  "traffic_type": "conversational",
  "service_plan": "global"
}'

```
2. Creating an outbound FQDN connection:

```shell
curl -L 'https://api.telnyx.com/v2/fqdn_connections' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY" \
-d '{
  "active": true,
  "anchorsite_override": "Latency",
  "connection_name": "My LiveKit trunk",
  "user_name": "<username>",
  "password": "<password>",
  "outbound": {
    "outbound_voice_profile_id": "<voice_profile_id>"
  }
}'

```

---

**Inbound and Outbound**:

To configure an FQDN trunk for both inbound and outbound calls:

- Create a voice profile for outbound calls.
- Set the caller's number format to `+E.164`.
- Configure credential authentication with a username and password.
1. Create a [voice profile](https://developers.telnyx.com/api/outbound-voice-profiles/create-voice-profile)

```shell
curl -L 'https://api.telnyx.com/v2/outbound_voice_profiles' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY" \
-d '{
  "name": "My LiveKit outbound voice profile",
  "traffic_type": "conversational",
  "service_plan": "global"
}'

```
2. Create an inbound and outbound FQDN connection

```shell
curl -L 'https://api.telnyx.com/v2/fqdn_connections' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY" \
-d '{
  "active": true,
  "anchorsite_override": "Latency",
  "connection_name": "My LiveKit trunk",
  "user_name": "<username>",
  "password": "<password>",
  "inbound": {
    "ani_number_format": "+E.164",
    "dnis_number_format": "+e164"
  },
  "outbound": {
    "outbound_voice_profile_id": "<voice_profile_id>"
  }
}'

```
2. Copy the FQDN connection ID from the output:

```json
{
  "data": {
    "id":"<connection_id>",
    ...
  }
}

```
3. Create an FQDN with your [LiveKit SIP endpoint](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md#sip-endpoint) and your FQDN connection ID:

```shell
curl -L 'https://api.telnyx.com/v2/fqdns' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY" \
-d '{
  "connection_id": "<connection_id>",
  "fqdn": "%{sipHost}%",
  "port": 5060,
  "dns_record_type": "a"
}'

```

> ℹ️ **Region-based endpoints**
> 
> To restrict calls to a specific region, replace your global LiveKit SIP endpoint with a [region-based endpoint](https://docs.livekit.io/sip/cloud.md#region-pinning).

### Step 3: Associate phone number and trunk

1. Get the phone number ID for phone number `5105550100`:

```shell
curl -L -g 'https://api.telnyx.com/v2/phone_numbers?filter[phone_number]=5105550100' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY"

```

Copy the phone number ID from the output:

```json
{
  "meta": {
    "total_pages": 1,
    "total_results": 1,
    "page_number": 1,
    "page_size": 100
  },
  "data": [
    {
      "id": "<phone_number_id>",
      ...
    }
  ]
}

```
2. Add the FQDN connection to the phone number:

```shell
curl -L -X PATCH 'https://api.telnyx.com/v2/phone_numbers/<phone_number_id>' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-H "Authorization: Bearer $TELNYX_API_KEY" \
-d '{
  "id": "<phone_number_id>",
  "connection_id": "<connection_id>"
}'

```

## Creating a SIP trunk using the Telnyx UI

1. Sign in to the [Telnyx portal](https://portal.telnyx.com/).
2. [Purchase a phone number](https://portal.telnyx.com/#/numbers/buy-numbers).
3. Navigate to **Voice** » [**SIP Trunking**](https://portal.telnyx.com/#/voice/connections).
4. Create a SIP connection:- For inbound calls:

- Select [FQDN](https://developers.telnyx.com/docs/voice/sip-trunking/quickstart#option-3-fqdn-authentication) and save.
- Select **Add FQDN** and enter your [LiveKit SIP endpoint](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md#sip-endpoint) into the **FQDN** field.

For example, `vjnxecm0tjk.sip.livekit.cloud`.

> ℹ️ **Region-based endpoints**
> 
> To restrict calls to a specific region, replace your global LiveKit SIP endpoint with a [region-based endpoint](https://docs.livekit.io/sip/cloud.md#region-pinning).
- Select the **Inbound** tab. In the **Destination Number Format** field, select `+E.164`.
- In the **SIP Transport Protocol** field, select either **TCP** or **UDP**.
- In the **SIP Region** field, select your region.
- For outbound calls:

- Select the **Outbound** tab.
- In the **Outbound Voice Profile** field, select or create an outbound voice profile.
- Select the **Settings** tab
- Configure [FQDN Authentication](https://developers.telnyx.com/docs/voice/sip-trunking/quickstart#option-3-fqdn-authentication):- Select the **Settings** tab.
- In the **Authentication & Routing Configuration** section, select **Outbound Calls Authentication**.
- In the **Authentication Method** field, select **Credentials** and enter a username and password.
- Select the **Numbers** tab and assign the purchased number to the SIP trunk.

## Next steps

Head back to the main setup documentation to finish connecting your SIP trunk to LiveKit.

- **[SIP trunk setup](https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk.md#livekit-setup)**: Configure your Telnyx trunk in LiveKit.

---

This document was rendered at 2025-09-27T09:36:49.718Z.
For the latest version of this document, see [https://docs.livekit.io/sip/quickstarts/configuring-telnyx-trunk.md](https://docs.livekit.io/sip/quickstarts/configuring-telnyx-trunk.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).