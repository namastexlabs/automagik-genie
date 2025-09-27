LiveKit Docs › LiveKit SDKs › Connecting to LiveKit

---

# Connecting to LiveKit

> Learn how to connect with realtime SDKs.

## Overview

Your application will connect to LiveKit using the `Room` object, which is the base construct in LiveKit. Think of it like a conference call — multiple participants can join a room and share realtime audio, video, and data with each other.

Depending on your application, each participant might represent a user, an AI agent, a connected device, or some other program you've created. There is no limit on the number of participants in a room and each participant can publish audio, video, and data to the room.

## Installing the LiveKit SDK

LiveKit includes open-source SDKs for every major platform including JavaScript, Swift, Android, React Native, Flutter, and Unity.

LiveKit also has SDKs for realtime backend apps in Python, Node.js, Go, and Rust. These are designed to be used with the [Agents framework](https://docs.livekit.io/agents.md) for realtime AI applications.

**JavaScript**:

Install the LiveKit SDK and optional React Components library:

```shell
npm install livekit-client @livekit/components-react @livekit/components-styles --save

```

The SDK is also available using `yarn` or `pnpm`.

Check out the dedicated quickstarts for [React](https://docs.livekit.io/home/quickstarts/react.md) or [Next.js](https://docs.livekit.io/home/quickstarts/nextjs.md) if you're using one of those platforms.

---

**Swift**:

Add the Swift SDK and the optional Swift Components library to your project using Swift Package Manager. The package URLs are:

- [https://github.com/livekit/client-sdk-swift](https://github.com/livekit/client-sdk-swift)
- [https://github.com/livekit/components-swift](https://github.com/livekit/components-swift)

See [Adding package dependencies to your app](https://developer.apple.com/documentation/xcode/adding-package-dependencies-to-your-app) for more details.

You must also declare camera and microphone permissions, if needed in your `Info.plist` file:

```xml
<dict>
...
<key>NSCameraUsageDescription</key>
<string>$(PRODUCT_NAME) uses your camera</string>
<key>NSMicrophoneUsageDescription</key>
<string>$(PRODUCT_NAME) uses your microphone</string>
...
</dict>

```

For more details, see the [Swift quickstart](https://docs.livekit.io/home/quickstarts/swift.md).

---

**Android**:

The LiveKit SDK and components library are available as Maven packages.

```groovy
dependencies {
  implementation "io.livekit:livekit-android:2.+"
  implementation "io.livekit:livekit-android-compose-components:1.+"
}

```

See the [releases page](https://github.com/livekit/client-sdk-android/releases) for information on the latest version of the SDK.

You'll also need JitPack as one of your repositories. In your `settings.gradle` file:

```groovy
dependencyResolutionManagement {
    repositories {
        //...
        maven { url 'https://jitpack.io' }
    }
}

```

---

**React Native**:

Install the React Native SDK with NPM:

```shell
npm install @livekit/react-native @livekit/react-native-webrtc livekit-client

```

Check out the dedicated quickstart for [Expo](https://docs.livekit.io/home/quickstarts/expo.md) or [React Native](https://docs.livekit.io/home/quickstarts/react-native.md) for more details.

---

**Flutter**:

Install the latest version of the Flutter SDK and components library.

```shell
flutter pub add livekit_client livekit_components

```

You'll also need to declare camera and microphone permissions. See the [Flutter quickstart](https://docs.livekit.io/home/quickstarts/flutter.md) for more details.

If your SDK is not listed above, check out the full list of [platform-specific quickstarts](https://docs.livekit.io/home/quickstarts.md) and [SDK reference docs](https://docs.livekit.io/reference.md) for more details.

## Connecting to a room

Rooms are identified by their name, which can be any unique string. The room itself is created automatically when the first participant joins, and is closed when the last participant leaves.

You must use a participant identity when you connect to a room. This identity can be any string, but must be unique to each participant.

Connecting to a room always requires two parameters:

- `wsUrl`: The WebSocket URL of your LiveKit server.- LiveKit Cloud users can find theirs on the [Project Settings page](https://cloud.livekit.io/projects/p_/settings/project).
- Self-hosted users who followed [this guide](https://docs.livekit.io/home/self-hosting/local.md) can use `ws://localhost:7880` while developing.
- `token`: A unique [access token](https://docs.livekit.io/concepts/authentication.md) which each participant must use to connect.- The token encodes the room name, the participant's identity, and their permissions.
- For help generating tokens, see [this guide](https://docs.livekit.io/home/server/generating-tokens.md).

**JavaScript**:

```js
const room = new Room();
await room.connect(wsUrl, token);

```

---

**React**:

```js
<LiveKitRoom audio={true} video={true} token={token} serverUrl={wsUrl}>
  <!-- your components here -->
</LiveKitRoom>

```

---

**Swift**:

```swift
RoomScope(url: wsURL, token: token, connect: true, enableCamera: true) {
  // your components here
}

```

---

**Android**:

```kotlin
RoomScope(
  url = wsURL,
  token = token,
  audio = true,
  video = true,
  connect = true,
) {
  // your components here
}

```

---

**React Native**:

```js
<LiveKitRoom audio={true} video={true} token={token} serverUrl={wsUrl}>
  <!-- your components here -->
</LiveKitRoom>

```

---

**Flutter**:

```dart
final room = Room();
await room.connect(wsUrl, token);

```

Upon successful connection, the `Room` object will contain two key attributes: a `localParticipant` object, representing the current user, and `remoteParticipants`, an array of other participants in the room.

Once connected, you can [publish](https://docs.livekit.io/home/client/tracks/publish.md) and [subscribe](https://docs.livekit.io/home/client/tracks/subscribe.md) to realtime media tracks or [exchange data](https://docs.livekit.io/home/client/data.md) with other participants.

LiveKit also emits a number of events on the `Room` object, such as when new participants join or tracks are published. For details, see [Handling Events](https://docs.livekit.io/home/client/events.md).

## Disconnection

Call `Room.disconnect()` to leave the room. If you terminate the application without calling `disconnect()`, your participant disappears after 15 seconds.

> ℹ️ **Note**
> 
> On some platforms, including JavaScript and Swift, `Room.disconnect` is called automatically when the application exits.

### Automatic disconnection

Participants might get disconnected from a room due to server-initiated actions. This can happen if the room is closed using the [DeleteRoom](https://docs.livekit.io/home/server/managing-rooms.md#Delete-a-room) API or if a participant is removed with the [RemoveParticipant](https://docs.livekit.io/home/server/managing-participants.md#remove-a-participant) API.

In such cases, a `Disconnected` event is emitted, providing a reason for the disconnection. Common [disconnection reasons](https://github.com/livekit/protocol/blob/main/protobufs/livekit_models.proto#L333) include:

- DUPLICATE_IDENTITY: Disconnected because another participant with the same identity joined the room.
- ROOM_DELETED: The room was closed via the `DeleteRoom` API.
- PARTICIPANT_REMOVED: Removed from the room using the `RemoveParticipant` API.
- JOIN_FAILURE: Failure to connect to the room, possibly due to network issues.
- ROOM_CLOSED: The room was closed because all [Standard and Ingress participants](https://docs.livekit.io/home/get-started/api-primitives.md#types-of-participants) left.

## Connection reliability

LiveKit enables reliable connectivity in a wide variety of network conditions. It tries the following WebRTC connection types in descending order:

1. ICE over UDP: ideal connection type, used in majority of conditions
2. TURN with UDP (3478): used when ICE/UDP is unreachable
3. ICE over TCP: used when network disallows UDP (i.e. over VPN or corporate firewalls)
4. TURN with TLS: used when firewall only allows outbound TLS connections

**Cloud**:

LiveKit Cloud supports all of the above connection types. TURN servers with TLS are provided and maintained by LiveKit Cloud.

---

**Self-hosted**:

ICE over UDP and TCP works out of the box, while TURN requires additional configurations and your own SSL certificate.

### Network changes and reconnection

With WiFi and cellular networks, users may sometimes run into network changes that cause the connection to the server to be interrupted. This could include switching from WiFi to cellular or going through spots with poor connection.

When this happens, LiveKit will attempt to resume the connection automatically. It reconnects to the signaling WebSocket and initiates an [ICE restart](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Session_lifetime#ice_restart) for the WebRTC connection. This process usually results in minimal or no disruption for the user. However, if media delivery over the previous connection fails, users might notice a temporary pause in video, lasting a few seconds, until the new connection is established.

In scenarios where an ICE restart is not feasible or unsuccessful, LiveKit will execute a full reconnection. As full reconnections take more time and might be more disruptive, a `Reconnecting` event is triggered. This allows your application to respond, possibly by displaying a UI element, during the reconnection process.

This sequence goes like the following:

1. `ParticipantDisconnected` fired for other participants in the room
2. If there are tracks unpublished, you will receive `LocalTrackUnpublished` for them
3. Emits `Reconnecting`
4. Performs full reconnect
5. Emits `Reconnected`
6. For everyone currently in the room, you will receive `ParticipantConnected`
7. Local tracks are republished, emitting `LocalTrackPublished` events

In essence, the full reconnection sequence is identical to everyone else having left the room, and came back.

---

This document was rendered at 2025-09-27T09:36:25.700Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/connect.md](https://docs.livekit.io/home/client/connect.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).