LiveKit Docs › LiveKit SDKs › Realtime media › End-to-end encryption

---

# End-to-end encryption

> Secure your realtime media tracks with E2EE.

## Overview

LiveKit includes built-in support for end-to-end encryption (E2EE) on realtime audio and video tracks. With E2EE enabled, media data remains fully encrypted from sender to receiver, ensuring that no intermediaries (including LiveKit servers) can access or modify the content. This feature is:

- Available for both self-hosted and LiveKit Cloud customers at no additional cost.
- Ideal for regulated industries and security-critical applications.
- Designed to provide an additional layer of protection beyond standard transport encryption.

> ℹ️ **Security**
> 
> Security is our highest priority. Learn more about [our comprehensive approach to security](https://livekit.io/security).

## How E2EE works

E2EE is enabled at the room level and automatically applied to all media tracks from all participants in that room. You must enable it within the LiveKit SDK for each participant. In many cases you can use a built-in key provider with a single shared key for the whole room. If you require unique keys for each participant, or key rotation during the lifetime of a single room, you can implement your own key provider.

## Key distribution

It is your responsibility to securely generate, store, and distribute encryption keys to your application at runtime. LiveKit does not (and cannot) store or transport encryption keys for you.

If using a shared key, you would typically generate it on your server at the same time that you create a room and distribute it securely to participants alongside their access token for the room. When using unique keys per participant, you may need a more sophisticated method for distributing keys as new participants join the room. Remember that the key is needed for both encryption and decryption, so even when using per-participant keys, you must ensure that all participants have all keys.

## Limitations

All LiveKit network traffic is encrypted using TLS, but full end-to-end encryption applies only to media tracks and is not applied to realtime data, text, API calls, or other signaling.

## Implementation guide

These examples show how to use the built-in key provider with a shared key. If you need to use a custom key provider, see the section below.

**JavaScript**:

```typescript
// 1. Initialize the external key provider
const keyProvider = new ExternalE2EEKeyProvider();

// 2. Configure room options
const roomOptions: RoomOptions = {
  e2ee: {
    keyProvider: keyProvider,
    // Required for web implementations
    worker: new Worker(new URL('livekit-client/e2ee-worker', import.meta.url)),
  },
};

// 3. Create and configure the room
const room = new Room(roomOptions);

// 4. Set your externally distributed encryption key
await keyProvider.setKey(yourSecureKey);

// 5. Enable E2EE for all local tracks
await room.setE2EEEnabled(true);

// 6. Connect to the room
await room.connect(url, token);

```

#### Example implementation

For a production-ready implementation, refer to our [Meet example app](https://github.com/livekit-examples/meet) which demonstrates E2EE in a production-grade application using the `ExternalE2EEKeyProvider`.

---

**iOS**:

```swift
// 1. Initialize the key provider with options
let keyProvider = BaseKeyProvider(isSharedKey: true, sharedKey: "yourSecureKey")

// 2. Configure room options with E2EE
let roomOptions = RoomOptions(e2eeOptions: E2EEOptions(keyProvider: keyProvider))

// 3. Create the room
let room = Room(roomOptions: roomOptions)

// 4. Connect to the room
try await room.connect(url: url, token: token)

```

---

**Android**:

```kotlin
// 1. Initialize the key provider
val keyProvider = BaseKeyProvider()

// 2. Configure room options
val roomOptions = RoomOptions(
    e2eeOptions = E2EEOptions(
        keyProvider = keyProvider
    )
)
// 3. Create and configure the room
val room = LiveKit.create(context, options = roomOptions)

// 4. Set your externally distributed encryption key
keyProvider.setSharedKey(yourSecureKey)

// 5. Connect to the room
room.connect(url, token)

```

#### Example implementation

Our main [Android sample app](https://github.com/livekit/client-sdk-android/tree/main/sample-app) includes an example implementation of E2EE using the built-in key provider.

---

**Flutter**:

```dart
// 1. Initialize the key provider
final keyProvider = await BaseKeyProvider.create();

// 2. Configure room options
final roomOptions = RoomOptions(
  e2eeOptions: E2EEOptions(
    keyProvider: keyProvider,
  ),
);

// 3. Create and configure the room
final room = Room(options: roomOptions);

// 4. Set your externally distributed encryption key
await keyProvider.setSharedKey(yourSecureKey);

// 5. Connect to the room
await room.connect(url, token);

```

#### Example implementation

The Flutter SDK includes a [complete multi-platform example implementation](https://github.com/livekit/client-sdk-flutter/tree/main/example) with E2EE support using a shared key.

---

**React Native**:

```jsx
// 1. Use the hook to create an RNE2EEManager 
//    with your externally distributed shared key
// (Note: if you need a custom key provider, then you'll need 
//        to create the key provider and `RNE2EEManager` directly)
const { e2eeManager } = useRNE2EEManager({
  sharedKey: yourSecureKey,
});

// 2. Provide the e2eeManager in your room options
const roomOptions = {
  e2ee: {
    e2eeManager,
  },
};

// 3. Pass the room options when creating your room
<LiveKitRoom
  serverUrl={url}
  token={token}
  connect={true}
  options={roomOptions}
  audio={true}
  video={true}
>
</LiveKitRoom>

```

#### Example implementation

The React Native SDK includes a complete [example app](https://github.com/livekit/client-sdk-react-native/tree/main/example) which demonstrates how to use the `useRNE2EEManager` hook and a shared key.

---

**Python**:

```python
# 1. Initialize key provider options with a shared key
e2ee_options = rtc.E2EEOptions()
e2ee_options.key_provider_options.shared_key = YOUR_SHARED_KEY

# 2. Configure room options with E2EE
room_options = RoomOptions(
    auto_subscribe=True,
    e2ee=e2ee_options
)

# 3. Create and connect to the room
room = Room()
await room.connect(url, token, options=room_options)

```

#### Example implementation

The Python SDK includes a [simple example app](https://github.com/livekit/python-sdks/blob/main/examples/e2ee.py) using E2EE with a shared key.

---

**Node.js**:

```javascript
// 1. Initialize the key provider with options
const keyProviderOptions = {
  sharedKey: yourSecureKey, // Your externally distributed encryption key
};

// 2. Configure E2EE options
const e2eeOptions = {
  keyProviderOptions,
};

// 3. Create and configure the room
const room = new Room();

// 4. Connect to the room with E2EE enabled
await room.connect(url, token, {
    e2ee: e2eeOptions,
  }
);

```

## Using a custom key provider

If your application requires key rotation during the lifetime of a single room or unique keys per participant (such as when implementing the [MEGOLM](https://gitlab.matrix.org/matrix-org/olm/blob/master/docs/megolm.html) or [MLS](https://messaginglayersecurity.rocks/mls-architecture/draft-ietf-mls-architecture.html) protocol), you'll need to implement your own key provider.  The full details of that are beyond the scope of this guide, but a brief outline for the JS SDK is provided below (the process is similar in the other SDKs as well):

1. Extend the `BaseKeyProvider` class.
2. Call `onSetEncryptionKey` with each key/identity pair
3. Set appropriate ratcheting options (`ratchetSalt`, `ratchetWindowSize`, `failureTolerance`, `keyringSize`).
4. Implement the `onKeyRatcheted` method to handle key updates.
5. Call `ratchetKey()` when key rotation is needed.
6. Pass your custom key provider in the room options, in place of the built-in key provider.

---

This document was rendered at 2025-09-27T09:36:29.195Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/tracks/encryption.md](https://docs.livekit.io/home/client/tracks/encryption.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).