LiveKit Docs › Server APIs › Webhooks

---

# Webhooks

> Configure LiveKit to notify your server when room events take place.

## Overview

LiveKit can be configured to notify your server when room events take place. This can be helpful for your backend to know when a room has finished, or when a participant leaves.

With Cloud, webhooks can be configured in the Settings section of your project's dashboard.

When self-hosting, webhooks can be enabled by setting the `webhook` section in your config.

For Egress, extra webhooks can also be [configured inside Egress requests](https://docs.livekit.io/home/egress/api.md#WebhookConfig).

```yaml
webhook:
  # The API key to use in order to sign the message
  # This must match one of the keys LiveKit is configured with
  api_key: 'api-key-to-sign-with'
  urls:
    - 'https://yourhost'

```

## Receiving webhooks

Webhook requests are HTTP POST requests sent to URLs that you specify in your config or LiveKit Cloud dashboard. A `WebhookEvent` is encoded as JSON and sent in the body of the request.

The `Content-Type` header of the request is set to `application/webhook+json`. Please ensure your webserver is configured to receive payloads with this content type.

In order to ensure webhook requests are coming from LiveKit, these requests have an `Authorization` header containing a signed JWT token. The token includes a sha256 hash of the payload.

LiveKit's server SDKs provide webhook receiver libraries which should help with validation and decoding of the payload.

**Node.js**:

```typescript
import { WebhookReceiver } from 'livekit-server-sdk';

const receiver = new WebhookReceiver('apikey', 'apisecret');

// In order to use the validator, WebhookReceiver must have access to the raw
// POSTed string (instead of a parsed JSON object). If you are using express
// middleware, ensure that `express.raw` is used for the webhook endpoint
// app.use(express.raw({type: 'application/webhook+json'}));

app.post('/webhook-endpoint', async (req, res) => {
  // Event is a WebhookEvent object
  const event = await receiver.receive(req.body, req.get('Authorization'));
});

```

---

**Go**:

```go
import (
  "github.com/livekit/protocol/auth"
  "github.com/livekit/protocol/livekit"
  "github.com/livekit/protocol/webhook"
)

func ServeHTTP(w http.ResponseWriter, r *http.Request) {
  authProvider := auth.NewSimpleKeyProvider(
    apiKey, apiSecret,
  )
  // Event is a livekit.WebhookEvent{} object
  event, err := webhook.ReceiveWebhookEvent(r, authProvider)
  if err != nil {
    // Could not validate, handle error
    return
  }
  // Consume WebhookEvent
}

```

---

**Java**:

```java
import io.livekit.server.*;

WebhookReceiver webhookReceiver = new WebhookReceiver("apiKey", "secret");

// postBody is the raw POSTed string.
// authHeader is the value of the "Authorization" header in the request.
LivekitWebhook.WebhookEvent event = webhookReceiver.receive(postBody, authHeader);

// Consume WebhookEvent

```

## Delivery and retries

Webhooks are HTTP requests initiated by LiveKit and sent to your backend. Due to the protocol's push-based nature, there are no guarantees around delivery.

LiveKit aims to mitigate transient failures by retrying a webhook request multiple times. Each message will undergo several delivery attempts before being abandoned. If multiple events are queued for delivery, LiveKit will properly sequence them; only delivering newer events after older ones have been delivered or abandoned.

## Events

In addition to the fields below, all webhook events will include the following fields:

- `id` - a UUID identifying the event
- `createdAt` - UNIX timestamp in seconds

### Room Started

```typescript
interface WebhookEvent {
  event: 'room_started';
  room: Room;
}

```

### Room Finished

```typescript
interface WebhookEvent {
  event: 'room_finished';
  room: Room;
}

```

### Participant Joined

```typescript
interface WebhookEvent {
  event: 'participant_joined';
  room: Room;
  participant: ParticipantInfo;
}

```

### Participant Left

```typescript
interface WebhookEvent {
  event: 'participant_left';
  room: Room;
  participant: ParticipantInfo;
}

```

### Participant Connection Aborted

```typescript
interface WebhookEvent {
  event: 'participant_connection_aborted';
  room: Room;
  participant: ParticipantInfo;
}

```

### Track Published

In the Room and Participant objects, only sid, identity, and name are sent.

```typescript
interface WebhookEvent {
  event: 'track_published';
  room: Room;
  participant: ParticipantInfo;
  track: TrackInfo;
}

```

### Track Unpublished

In the Room and Participant objects, only sid, identity, and name are sent.

```typescript
interface WebhookEvent {
  event: 'track_unpublished';
  room: Room;
  participant: ParticipantInfo;
  track: TrackInfo;
}

```

### Egress Started

```typescript
interface WebhookEvent {
  event: 'egress_started';
  egressInfo: EgressInfo;
}

```

### Egress Updated

```typescript
interface WebhookEvent {
  event: 'egress_updated';
  egressInfo: EgressInfo;
}

```

### Egress Ended

```typescript
interface WebhookEvent {
  event: 'egress_ended';
  egressInfo: EgressInfo;
}

```

### Ingress Started

```typescript
interface WebhookEvent {
  event: 'ingress_started';
  ingressInfo: IngressInfo;
}

```

### Ingress Ended

```typescript
interface WebhookEvent {
  event: 'ingress_ended';
  ingressInfo: IngressInfo;
}

```

---

This document was rendered at 2025-09-27T09:36:43.968Z.
For the latest version of this document, see [https://docs.livekit.io/home/server/webhooks.md](https://docs.livekit.io/home/server/webhooks.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).