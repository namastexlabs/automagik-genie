LiveKit Docs › Features › HD voice

---

# HD voice for SIP

> LiveKit SIP supports high fidelity calls by enabling HD voice.

Telephone calls have traditionally been routed through the Public Switched Telephone Network (PSTN), a technology for landlines dating back over a century. PSTN calls are limited to an 8kHz sample rate using a narrowband audio codec, resulting in audio that typically sounds muffled or lacks range.

Modern cell phones can use VoIP for calls when connected via Wi-Fi or mobile data. VoIP can leverage wideband audio codecs that transmit audio at a higher sample rate, resulting in much higher quality audio, often referred to as HD Voice.

LiveKit SIP supports wideband audio codecs such as G.722 out of the box, providing higher quality audio when used with HD Voice-capable SIP trunks or endpoints.

## Configuring Telnyx

Telnyx supports HD Voice for customers in the US. To enable HD Voice with Telnyx, ensure the following are configured in your Telnyx portal:

- `HD Voice feature` is enabled on the phone number you are trying to use (under Number -> Voice)
- `G.722` codec is enabled on your SIP Trunk (under SIP Connection -> Inbound)- We recommend leaving G.711U enabled for compatibility.

## Other Providers

Currently, Twilio does not support HD voice. If you find other providers that support HD voice, please let us know so we can update this guide.

---

This document was rendered at 2025-09-27T09:36:48.385Z.
For the latest version of this document, see [https://docs.livekit.io/sip/hd-voice.md](https://docs.livekit.io/sip/hd-voice.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).