LiveKit Docs › Accepting calls › Inbound calls with Twilio Voice

---

# Inbound calls with Twilio Voice

> How to use LiveKit SIP with TwiML and Twilio conferencing.

## Inbound calls with Twilio programmable voice

Accept inbound calls using Twilio programmable voice. All you need is an inbound trunk and a dispatch rule created using the LiveKit CLI (or SDK) to accept calls and route callers to LiveKit rooms. The following steps guide you through the process.

> ℹ️ **Unsupported features**
> 
> This method doesn't support [SIP REFER](https://docs.livekit.io/sip/transfer-cold.md) or outbound calls. To use these features, switch to Elastic SIP Trunking. For details, see the [Configuring Twilio SIP trunks](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk.md) quickstart.

### Step 1. Purchase a phone number from Twilio

If you don't already have a phone number, see [How to Search for and Buy a Twilio Phone Number From Console](https://help.twilio.com/articles/223135247-How-to-Search-for-and-Buy-a-Twilio-Phone-Number-from-Console).

### Step 2. Set up a TwiML Bin

> ℹ️ **Other approaches**
> 
> This guide uses TwiML Bins, but you can also return TwiML via another mechanism, such as a webhook.

TwiML Bins are a simple way to test TwiML responses. Use a TwiML Bin to redirect an inbound call to LiveKit.

To create a TwiML Bin, follow these steps:

1. Navigate to your [TwiML Bins](https://console.twilio.com/us1/develop/twiml-bins/twiml-bins?frameUrl=/console/twiml-bins) page.
2. Create a TwiML Bin and add the following contents:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip username="<sip_trunk_username>" password="<sip_trunk_password>">
      sip:<your_phone_number>@%{sipHost}%
    </Sip>
  </Dial>
</Response>

```

### Step 3. Direct phone number to the TwiML Bin

Configure incoming calls to a specific phone number to use the TwiML Bin you just created:

1. Navigate to the [Manage numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming) page and select the purchased phone number.
2. In the **Voice Configuration** section, edit the **A call comes in** fields. After you select **TwiML Bin**. select the TwiML Bin created in the previous step.

### Step 4. Create a LiveKit inbound trunk

Use the LiveKit CLI to create an [inbound trunk](https://docs.livekit.io/sip/trunk-inbound.md) for the purchased phone number.

1. Create an `inbound-trunk.json` file with the following contents. Replace the phone number and add a `username` and `password` of your choosing:

```json
{
  "trunk": {
    "name": "My inbound trunk",
    "auth_username": "<sip_trunk_username>",
    "auth_password": "<sip_trunk_password>"
  }
}

```

> ℹ️ **Note**
> 
> Be sure to use the same username and password that's specified in the TwiML Bin.
2. Use the CLI to create an inbound trunk:

```bash
lk sip inbound create inbound-trunk.json

```

### Step 5. Create a dispatch rule to place each caller into their own room.

Use the LiveKit CLI to create a [dispatch rule](https://docs.livekit.io/sip/dispatch-rule.md) that places each caller into individual rooms named with the prefix `call`.

1. Create a `dispatch-rule.json` file with the following contents:

```json
{
  "dispatch_rule":
   {
     "rule": {
       "dispatchRuleIndividual": {
         "roomPrefix": "call-"
       }
     }
   }
}

```
2. Create the dispatch rule using the CLI:

```bash
lk sip dispatch create dispatch-rule.json

```

### Testing with an agent

Follow the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md) to create an agent that responds to incoming calls. Then call the phone number and your agent should pick up the call.

## Connecting to a Twilio phone conference

You can bridge Twilio conferencing to LiveKit via SIP, allowing you to add agents and other LiveKit clients to an existing Twilio conference. This requires the following setup:

- [Twilio conferencing](https://www.twilio.com/docs/voice/conference).
- LiveKit [inbound trunk](https://docs.livekit.io/sip/trunk-inbound.md).
- LiveKit [voice AI agent](https://docs.livekit.io/agents/start/voice-ai.md).

The example in this section uses [Node](https://nodejs.org) and the [Twilio Node SDK](https://www.twilio.com/docs/libraries).

### Step 1. Set Twilio environment variables

You can find these values in your [Twilio Console](https://console.twilio.com/):

```bash
export TWILIO_ACCOUNT_SID=<twilio_account_sid>
export TWILIO_AUTH_TOKEN=<twilio_auth_token>

```

### Step 2. Bridge a Twilio conference and LiveKit SIP

Create a `bridge.js` file and update the `twilioPhoneNumber`, `conferenceSid`, `sipHost`, and `from` field for the API call in the following code:

> ℹ️ **Note**
> 
> If you're signed in to [LiveKit Cloud](https://cloud.livekit.io), your sip host is filled in below.

```typescript
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilioClient = twilio(accountSid, authToken);

/**
 * Phone number bought from Twilio that is associated with a LiveKit trunk.
 * For example, +14155550100.
 * See https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk/
 */
const twilioPhoneNumber = '<sip_trunk_phone_number>';

/**
 * SIP host is available in your LiveKit Cloud project settings.
 * This is your project domain without the leading "sip:".
 */
const sipHost = '%{sipHost}%';

/**
 * The conference SID from Twilio that you want to add the agent to. You
 * likely want to obtain this from your conference status callback webhook handler.
 * The from field must contain the phone number, client identifier, or username
 * portion of the SIP address that made this call.
 * See https://www.twilio.com/docs/voice/api/conference-participant-resource#request-body-parameters
 */
const conferenceSid = '<twilio_conference_sid>';
await twilioClient.conferences(conferenceSid).participants.create({
    from: '<valid_from_value>',
    to: `sip:${twilioPhoneNumber}@${sipHost}`,
});

```

### Step 3.  Execute the file

When you run the file, it bridges the Twilio conference to a new LiveKit session using the previously configured dispatch rule. This allows you to automatically [dispatch an agent](https://docs.livekit.io/agents/worker/agent-dispatch.md) to the Twilio conference.

```bash
node bridge.js

```

---

This document was rendered at 2025-09-27T09:36:46.689Z.
For the latest version of this document, see [https://docs.livekit.io/sip/accepting-calls-twilio-voice.md](https://docs.livekit.io/sip/accepting-calls-twilio-voice.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).