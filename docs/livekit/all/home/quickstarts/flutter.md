LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › Flutter

---

# Flutter quickstart

> Get started with LiveKit and Flutter

## Voice AI quickstart

To build your first voice AI app for Flutter, use the following quickstart and the starter app. Otherwise follow the getting started guide below.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Create a voice AI agent in less than 10 minutes.

- **[Flutter Voice Agent](https://github.com/livekit-examples/agent-starter-flutter)**: A cross-platform voice AI assistant app built with Flutter.

## Getting started guide

This guide covers the basic setup for a new Flutter app for iOS, Android, or web using LiveKit.

### Install LiveKit SDK

```bash
flutter pub add livekit_client

```

### Permissions and entitlements

You'll need to request camera and/or microphone permissions (depending on your use case). This must be done within your platform-specific code:

**iOS**:

Camera and microphone usage need to be declared in your `Info.plist` file.

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

Your application can still run a voice call when it is switched to the background if the background mode is enabled. Select the app target in Xcode, click the Capabilities tab, enable Background Modes, and check **Audio, AirPlay, and Picture in Picture**.

Your `Info.plist` should have the following entries:

```xml
<key>UIBackgroundModes</key>
<array>
<string>audio</string>
</array>

```

(LiveKit strongly recommends using Flutter 3.3.0+. If you are using Flutter 3.0.0 or below, please see [this note in the SDK README](https://github.com/livekit/client-sdk-flutter#notes).)

---

**Android**:

Permissions are configured in `AppManifest.xml`. In addition to camera and microphone, you may need to add networking and bluetooth permissions.

```xml
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />

```

---

**macOS**:

Add the following entries to your `macos/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>$(PRODUCT_NAME) uses your camera</string>
<key>NSMicrophoneUsageDescription</key>
<string>$(PRODUCT_NAME) uses your microphone</string>

```

You might also need the following entitlements, for both `DebugProfile.entitlements` and `Release.entitlements` (in `macos/Runner/`):

```xml
<key>com.apple.security.device.camera</key>
<true/>
<key>com.apple.security.device.microphone</key>
<true/>
<key>com.apple.security.device.audio-input</key>
<true/>
<key>com.apple.security.files.user-selected.read-only</key>
<true/>
<key>com.apple.security.network.client</key>
<true/>
<key>com.apple.security.network.server</key>
<true/>

```

---

**Windows**:

On Windows, [Visual Studio 2019](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=community&rel=16) is required (note that the link in Flutter docs may download VS 2022).

---

**Web**:

Add the following permissions to your `web/index.html` file:

```html
<meta name="permissions-policy" content="interest-cohort=(), microphone=*, camera=*">

```

### Connect to LiveKit

Add the following code to connect and publish audio/video to a room:

```dart
final roomOptions = RoomOptions(
  adaptiveStream: true,
  dynacast: true,
  // ... your room options
)

final room = Room();

await room.connect(url, token, roomOptions: roomOptions);
try {
  // video will fail when running in ios simulator
  await room.localParticipant.setCameraEnabled(true);
} catch (error) {
  print('Could not publish video, error: $error');
}

await room.localParticipant.setMicrophoneEnabled(true);

```

## Next steps

The following resources are useful for getting started with LiveKit on Android.

- **[Generating tokens](https://docs.livekit.io/home/server/generating-tokens.md)**: Guide to generating authentication tokens for your users.

- **[Realtime media](https://docs.livekit.io/home/client/tracks.md)**: Complete documentation for live video and audio tracks.

- **[Realtime data](https://docs.livekit.io/home/client/data.md)**: Send and receive realtime data between clients.

- **[Flutter SDK](https://github.com/livekit/client-sdk-flutter)**: LiveKit Flutter SDK on GitHub.

- **[Flutter components](https://github.com/livekit/components-flutter)**: LiveKit Flutter components on GitHub.

- **[Flutter SDK reference](https://docs.livekit.io/reference/client-sdk-flutter/index.html.md)**: LiveKit Flutter SDK reference docs.

---

This document was rendered at 2025-09-27T09:36:38.454Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/flutter.md](https://docs.livekit.io/home/quickstarts/flutter.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).