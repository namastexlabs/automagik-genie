LiveKit Docs › Get Started › Authentication

---

# Authentication

> Learn how to authenticate your users to LiveKit sessions.

## Overview

For a LiveKit SDK to successfully connect to the server, it must pass an access token with the request.

This token encodes the identity of a participant, name of the room, capabilities and permissions. Access tokens are JWT-based and signed with your API secret to prevent forgery.

Access tokens also carry an expiration time, after which the server will reject connections with that token. Note: expiration time only impacts the initial connection, and not subsequent reconnects.

## Creating a token

**LiveKit CLI**:

```bash
lk token create \
  --api-key <KEY> \
  --api-secret <SECRET> \
  --identity <NAME> \
  --room <ROOM_NAME> \
  --join \
  --valid-for 1h

```

---

**Node.js**:

```typescript
import { AccessToken, VideoGrant } from 'livekit-server-sdk';

const roomName = 'name-of-room';
const participantName = 'user-name';

const at = new AccessToken('api-key', 'secret-key', {
  identity: participantName,
});

const videoGrant: VideoGrant = {
  room: roomName,
  roomJoin: true,
  canPublish: true,
  canSubscribe: true,
};

at.addGrant(videoGrant);

const token = await at.toJwt();
console.log('access token', token);

```

---

**Go**:

```go
import (
  "time"

  "github.com/livekit/protocol/auth"
)

func getJoinToken(apiKey, apiSecret, room, identity string) (string, error) {
  canPublish := true
  canSubscribe := true

  at := auth.NewAccessToken(apiKey, apiSecret)
  grant := &auth.VideoGrant{
    RoomJoin:     true,
    Room:         room,
    CanPublish:   &canPublish,
    CanSubscribe: &canSubscribe,
  }
  at.SetVideoGrant(grant).
     SetIdentity(identity).
     SetValidFor(time.Hour)

  return at.ToJWT()
}

```

---

**Ruby**:

```ruby
require 'livekit'

token = LiveKit::AccessToken.new(api_key: 'yourkey', api_secret: 'yoursecret')
token.identity = 'participant-identity'
token.name = 'participant-name'
token.video_grant=(LiveKit::VideoGrant.from_hash(roomJoin: true,
                                                 room: 'room-name'))

puts token.to_jwt

```

---

**Java**:

```java
import io.livekit.server.*;

public String createToken() {
  AccessToken token = new AccessToken("apiKey", "secret");
  token.setName("participant-name");
  token.setIdentity("participant-identity");
  token.setMetadata("metadata");
  token.addGrants(new RoomJoin(true), new Room("room-name"));

  return token.toJwt();
}

```

---

**Python**:

```python
from livekit import api
import os

token = api.AccessToken(os.getenv('LIVEKIT_API_KEY'), os.getenv('LIVEKIT_API_SECRET')) \
    .with_identity("identity") \
    .with_name("name") \
    .with_grants(api.VideoGrants(
        room_join=True,
        room="my-room",
    )).to_jwt()

```

---

**Rust**:

```rust
use livekit_api::access_token;
use std::env;

fn create_token() -> Result<String, AccessTokenError> {
   let api_key = env::var("LIVEKIT_API_KEY").expect("LIVEKIT_API_KEY is not set");
   let api_secret = env::var("LIVEKIT_API_SECRET").expect("LIVEKIT_API_SECRET is not set");

   let token = access_token::AccessToken::with_api_key(&api_key, &api_secret)
      .with_identity("identity")
      .with_name("name")
      .with_grants(access_token::VideoGrants {
         room_join: true,
         room: "my-room".to_string(),
         ..Default::default()
      })
      .to_jwt();
   return token
}

```

---

**Other**:

For other platforms, you can either implement token generation yourself or use the `lk` command.

Token signing is fairly straight forward, see [JS implementation](https://github.com/livekit/node-sdks/blob/main/packages/livekit-server-sdk/src/AccessToken.ts) as a reference.

LiveKit CLI is available at [https://github.com/livekit/livekit-cli](https://github.com/livekit/livekit-cli)

### Token example

Here's an example of the decoded body of a join token:

```json
{
  "exp": 1621657263,
  "iss": "APIMmxiL8rquKztZEoZJV9Fb",
  "sub": "myidentity",
  "nbf": 1619065263,
  "video": {
    "room": "myroom",
    "roomJoin": true
  },
  "metadata": ""
}

```

| field | description |
| exp | Expiration time of token |
| nbf | Start time that the token becomes valid |
| iss | API key used to issue this token |
| sub | Unique identity for the participant |
| metadata | Participant metadata |
| attributes | Participant attributes (key/value pairs of strings) |
| video | Video grant, including room permissions (see below) |
| sip | SIP grant |

## Video grant

Room permissions are specified in the `video` field of a decoded join token. It may contain one or more of the following properties:

| field | type | description |
| roomCreate | bool | Permission to create or delete rooms |
| roomList | bool | Permission to list available rooms |
| roomJoin | bool | Permission to join a room |
| roomAdmin | bool | Permission to moderate a room |
| roomRecord | bool | Permissions to use Egress service |
| ingressAdmin | bool | Permissions to use Ingress service |
| room | string | Name of the room, required if join or admin is set |
| canPublish | bool | Allow participant to publish tracks |
| canPublishData | bool | Allow participant to publish data to the room |
| canPublishSources | string[] | Requires `canPublish` to be true. When set, only listed source can be published. (camera, microphone, screen_share, screen_share_audio) |
| canSubscribe | bool | Allow participant to subscribe to tracks |
| canUpdateOwnMetadata | bool | Allow participant to update its own metadata |
| hidden | bool | Hide participant from others in the room |
| kind | string | Type of participant (standard, ingress, egress, sip, or agent). this field is typically set by LiveKit internals. |

### Example: subscribe-only token

To create a token where the participant can only subscribe, and not publish into the room, you would use the following grant:

```json
{
  ...
  "video": {
    "room": "myroom",
    "roomJoin": true,
    "canSubscribe": true,
    "canPublish": false,
    "canPublishData": false
  }
}

```

### Example: camera-only

Allow the participant to publish camera, but disallow other sources

```json
{
  ...
  "video": {
    "room": "myroom",
    "roomJoin": true,
    "canSubscribe": true,
    "canPublish": true,
    "canPublishSources": ["camera"]
  }
}

```

## SIP grant

In order to interact with the SIP service, permission must be granted in the `sip` field of the JWT. It may contain the following properties:

| field | type | description |
| admin | bool | Permission to manage SIP trunks and dispatch rules. |
| call | bool | Permission to make SIP calls via `CreateSIPParticipant`. |

### Creating a token with SIP grants

**Node.js**:

```typescript
import { AccessToken, SIPGrant, VideoGrant } from 'livekit-server-sdk';

const roomName = 'name-of-room';
const participantName = 'user-name';

const at = new AccessToken('api-key', 'secret-key', {
  identity: participantName,
});

const sipGrant: SIPGrant = { 
  admin: true,
  call: true,
};  

const videoGrant: VideoGrant = { 
  room: roomName,
  roomJoin: true,
};  

at.addGrant(sipGrant);
at.addGrant(videoGrant);

const token = await at.toJwt();
console.log('access token', token);

```

---

**Go**:

```go
import (
  "time"

  "github.com/livekit/protocol/auth"
)

func getJoinToken(apiKey, apiSecret, room, identity string) (string, error) {

  at := auth.NewAccessToken(apiKey, apiSecret)

  videoGrant := &auth.VideoGrant{
    RoomJoin:     true,
    Room:         room,
  }

  sipGrant := &auth.SIPGrant{
    Admin:     true,
    Call:      true,
  }

  at.SetSIPGrant(sipGrant).
    SetVideoGrant(videoGrant).
    SetIdentity(identity).
    SetValidFor(time.Hour)

  return at.ToJWT()
}

```

---

**Ruby**:

```ruby
require 'livekit'

token = LiveKit::AccessToken.new(api_key: 'yourkey', api_secret: 'yoursecret')
token.identity = 'participant-identity'
token.name = 'participant-name'

token.video_grant=(LiveKit::VideoGrant.from_hash(roomJoin: true,
                                                 room: 'room-name'))
token.sip_grant=(LiveKit::SIPGrant.from_hash(admin: true, call: true))

puts token.to_jwt

```

---

**Java**:

```java
import io.livekit.server.*;

public String createToken() {
  AccessToken token = new AccessToken("apiKey", "secret");

  // Fill in token information.
  token.setName("participant-name");
  token.setIdentity("participant-identity");
  token.setMetadata("metadata");
 
  // Add room and SIP privileges.
  token.addGrants(new RoomJoin(true), new RoomName("room-name"));
  token.addSIPGrants(new SIPAdmin(true), new SIPCall(true));
  
  return token.toJwt();
}

```

---

**Python**:

```python
from livekit import api
import os

token = api.AccessToken(os.getenv('LIVEKIT_API_KEY'),
                        os.getenv('LIVEKIT_API_SECRET')) \
    .with_identity("identity") \
    .with_name("name") \
    .with_grants(api.VideoGrants(
        room_join=True,
        room="my-room")) \
    .with_sip_grants(api.SIPGrants(
        admin=True,
        call=True)).to_jwt()

```

---

**Rust**:

```rust
use livekit_api::access_token;
use std::env;

fn create_token() -> Result<String, access_token::AccessTokenError> {
    let api_key = env::var("LIVEKIT_API_KEY").expect("LIVEKIT_API_KEY is not set");
    let api_secret = env::var("LIVEKIT_API_SECRET").expect("LIVEKIT_API_SECRET is not set");

    let token = access_token::AccessToken::with_api_key(&api_key, &api_secret)
        .with_identity("rust-bot")
        .with_name("Rust Bot")
        .with_grants(access_token::VideoGrants {
             room_join: true,
             room: "my-room".to_string(),
             ..Default::default()
        })  
        .with_sip_grants(access_token::SIPGrants {
            admin: true,
            call: true
        })  
        .to_jwt();
    return token
}

```

## Room configuration

You can create an access token for a user that includes room configuration options. When a room is created for a user, the room is created using the configuration stored in the token. For example, you can use this to [explicitly dispatch an agent](https://docs.livekit.io/agents/worker/agent-dispatch.md) when a user joins a room.

For the full list of `RoomConfiguration` fields, see [RoomConfiguration](https://docs.livekit.io/reference/server/server-apis.md#roomconfiguration).

### Creating a token with room configuration

**Node.js**:

For a full example of explicit agent dispatch, see the [example](https://github.com/livekit/node-sdks/blob/main/examples/agent-dispatch/index.ts) in GitHub.

```typescript
import { AccessToken, SIPGrant, VideoGrant } from 'livekit-server-sdk';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';

const roomName = 'name-of-room';
const participantName = 'user-name';
const agentName = 'my-agent';

const at = new AccessToken('api-key', 'secret-key', {
  identity: participantName,
});

const videoGrant: VideoGrant = { 
  room: roomName,
  roomJoin: true,
};  

at.addGrant(videoGrant);
at.roomConfig = new RoomConfiguration (
  agents: [
    new RoomAgentDispatch({
      agentName: "test-agent",
      metadata: "test-metadata"
    })
  ]
);

const token = await at.toJwt();
console.log('access token', token);

```

---

**Go**:

```go
import (
  "time"

  "github.com/livekit/protocol/auth"
  "github.com/livekit/protocol/livekit"
)

func getJoinToken(apiKey, apiSecret, room, identity string) (string, error) {

  at := auth.NewAccessToken(apiKey, apiSecret)

  videoGrant := &auth.VideoGrant{
    RoomJoin:     true,
    Room:         room,
  }

  roomConfig := &livekit.RoomConfiguration{
    Agents: []*livekit.RoomAgentDispatch{{
      AgentName: "test-agent",
      Metadata:  "test-metadata",
    }}, 
  }

  at.SetVideoGrant(videoGrant).
    SetRoomConfig(roomConfig).
    SetIdentity(identity).
    SetValidFor(time.Hour)

  return at.ToJWT()
}

```

---

**Ruby**:

```ruby
require 'livekit'

token = LiveKit::AccessToken.new(api_key: 'yourkey', api_secret: 'yoursecret')
token.identity = 'participant-identity'
token.name = 'participant-name'

token.video_grant=(LiveKit::VideoGrant.new(roomJoin: true,
                                           room: 'room-name'))
token.room_config=(LiveKit::Proto::RoomConfiguration.new(
    max_participants: 10
    agents: [LiveKit::Proto::RoomAgentDispatch.new(
      agent_name: "test-agent",
      metadata: "test-metadata",
    )]
  )
)

puts token.to_jwt

```

---

**Python**:

For a full example of explicit agent dispatch, see the [example](https://github.com/livekit/python-sdks/blob/main/examples/agent_dispatch.py) in GitHub.

```python
from livekit import api
import os

token = api.AccessToken(os.getenv('LIVEKIT_API_KEY'),
                        os.getenv('LIVEKIT_API_SECRET')) \
    .with_identity("identity") \
    .with_name("name") \
    .with_grants(api.VideoGrants(
        room_join=True,
        room="my-room")) \
        .with_room_config(
            api.RoomConfiguration(
                agents=[
                    api.RoomAgentDispatch(
                        agent_name="test-agent", metadata="test-metadata"
                    )
                ],
            ),
        ).to_jwt()

```

---

**Rust**:

```rust
use livekit_api::access_token;
use std::env;

fn create_token() -> Result<String, access_token::AccessTokenError> {
    let api_key = env::var("LIVEKIT_API_KEY").expect("LIVEKIT_API_KEY is not set");
    let api_secret = env::var("LIVEKIT_API_SECRET").expect("LIVEKIT_API_SECRET is not set");

    let token = access_token::AccessToken::with_api_key(&api_key, &api_secret)
        .with_identity("rust-bot")
        .with_name("Rust Bot")
        .with_grants(access_token::VideoGrants {
             room_join: true,
             room: "my-room".to_string(),
             ..Default::default()
        })
        .with_room_config(livekit::RoomConfiguration {
            agents: [livekit::AgentDispatch{
              name: "my-agent"
            }]  
        })  
        .to_jwt();
    return token
}

```

## Token refresh

LiveKit server proactively issues refreshed tokens to connected clients, ensuring they can reconnect if disconnected. These refreshed access tokens have a 10-minute expiration.

Additionally, tokens are refreshed when there are changes to a participant's name, permissions or metadata.

## Updating permissions

A participant's permissions can be updated at any time, even after they've already connected. This is useful in applications where the participant's role could change during the session, such as in a participatory livestream.

It's possible to issue a token with `canPublish: false` initially, and then updating it to `canPublish: true` during the session. Permissions can be changed with the [UpdateParticipant](https://docs.livekit.io/home/server/managing-participants.md#updating-permissions) server API.

---

This document was rendered at 2025-09-27T09:36:36.176Z.
For the latest version of this document, see [https://docs.livekit.io/home/get-started/authentication.md](https://docs.livekit.io/home/get-started/authentication.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).