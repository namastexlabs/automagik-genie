LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › Swift

---

# Swift quickstart

> Get started with LiveKit on iOS using SwiftUI

## Voice AI quickstart

To build your first voice AI app for SwiftUI, use the following quickstart and the starter app. Otherwise follow the getting started guide below.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Create a voice AI agent in less than 10 minutes.

- **[SwiftUI Voice Agent](https://github.com/livekit-examples/agent-starter-swift)**: A native iOS, macOS, and visionOS voice AI assistant built in SwiftUI.

## Getting started guide

This guide uses the Swift Components library for the easiest way to get started on iOS.

LiveKit also supports macOS, tvOS, and visionOS. More documentation for the core Swift SDK is [on GitHub](https://github.com/livekit/client-sdk-swift).

Otherwise follow this guide to build your first LiveKit app with SwiftUI.

### SDK installation

**Xcode**:

Go to _Project Settings_ > _Package Dependencies_.

Add a new package and enter the URL: `https://github.com/livekit/components-swift`.

See [Adding package dependencies to your app](https://developer.apple.com/documentation/xcode/adding-package-dependencies-to-your-app) for more details.

---

**Package.swift**:

```swift
let package = Package(
  ...
  dependencies: [
    .package(url: "https://github.com/livekit/client-sdk-swift.git", from: "2.5.0"), // Core SDK
    .package(url: "https://github.com/livekit/components-swift.git", from: "0.1.0"), // UI Components
  ],
  targets: [
    .target(
      name: "MyApp",
      dependencies: [
        .product(name: "LiveKitComponents", package: "components-swift"),
      ]
    )
  ]
)

```

### Permissions and entitlements

You must add privacy strings for both camera and microphone usage to your `Info.plist` file, even if you don't plan to use both in your app.

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

To continue audio sessions in the background add the **Audio, AirPlay, and Picture in Picture** background mode to the Capabilities tab of your app target in Xcode.

Your `Info.plist` should have the following entries:

```xml
<dict>
...
<key>UIBackgroundModes</key>
<array>
<string>audio</string>
</array>

```

### Connecting to LiveKit

This simple example uses a hardcoded token that expires in 2 hours. In a real app, you’ll need to [generate a token](https://docs.livekit.io/home/server/generating-tokens.md) with your server.

** Filename: `ContentView.swift`**

```swift
// !! Note !!
// This sample hardcodes a token which expires in 2 hours.
let wsURL = "%{wsURL}%"
let token = "%{token}%"
// In production you should generate tokens on your server, and your client
// should request a token from your server.
@preconcurrency import LiveKit
import LiveKitComponents
import SwiftUI

struct ContentView: View {
    @StateObject private var room: Room

    init() {
        let room = Room()
        _room = StateObject(wrappedValue: room)
    }

    var body: some View {
        Group {
            if room.connectionState == .disconnected {
                Button("Connect") {
                    Task {
                        do {
                            try await room.connect(
                                url: wsURL,
                                token: token,
                                connectOptions: ConnectOptions(enableMicrophone: true)
                            )
                            try await room.localParticipant.setCamera(enabled: true)
                        } catch {
                            print("Failed to connect to LiveKit: \(error)")
                        }
                    }
                }
            } else {
                LazyVStack {
                    ForEachParticipant { _ in
                        VStack {
                            ForEachTrack(filter: .video) { trackReference in
                                VideoTrackView(trackReference: trackReference)
                                    .frame(width: 500, height: 500)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .environmentObject(room)
    }
}

```

For more details, you can reference [the components example app](https://github.com/livekit-examples/swift-components).

## Next steps

The following resources are useful for getting started with LiveKit on iOS.

- **[Generating tokens](https://docs.livekit.io/home/server/generating-tokens.md)**: Guide to generating authentication tokens for your users.

- **[Realtime media](https://docs.livekit.io/home/client/tracks.md)**: Complete documentation for live video and audio tracks.

- **[Realtime data](https://docs.livekit.io/home/client/data.md)**: Send and receive realtime data between clients.

- **[Swift SDK](https://github.com/livekit/client-sdk-swift)**: LiveKit Swift SDK on GitHub.

- **[SwiftUI Components](https://github.com/livekit/components-swift)**: LiveKit SwiftUI Components on GitHub.

- **[Swift SDK reference](https://docs.livekit.io/reference/client-sdk-swift.md)**: LiveKit Swift SDK reference docs.

- **[SwiftUI components reference](https://livekit.github.io/components-swift/documentation/livekitcomponents/)**: LiveKit SwiftUI components reference docs.

---

This document was rendered at 2025-09-27T09:36:39.815Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/swift.md](https://docs.livekit.io/home/quickstarts/swift.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).