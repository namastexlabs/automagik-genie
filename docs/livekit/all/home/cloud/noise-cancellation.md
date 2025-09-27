LiveKit Docs › LiveKit Cloud › Enhanced noise cancellation

---

# Enhanced noise cancellation

> LiveKit Cloud offers AI-powered noise cancellation for realtime audio.

## Overview

LiveKit Cloud includes advanced models licensed from [Krisp](https://krisp.ai/) to remove background noise and ensure the best possible audio quality. The models run locally, with no audio data sent to Krisp servers as part of this process and negligible impact on audio latency or quality.

The feature includes a background voice cancellation (BVC) model, which removes extra background speakers in addition to background noise, providing the best possible experience for voice AI applications. You can also use the standard NC model if desired.

The following comparison shows the effect of the models on the audio as perceived by a user, and also as perceived by a voice AI agent running an STT model ([Deepgram Nova 3](https://docs.livekit.io/agents/integrations/stt/deepgram.md) in these samples). The segments marked with a strikethrough indicate unwanted content that would confuse the agent. These samples illustrate that BVC is necessary to achieve clean STT in noisy multi-speaker environments.

Try the free [noise canceller tool](https://github.com/livekit-examples/noise-canceller) with your LiveKit Cloud account to test your own audio samples.

## Supported platforms

You can apply the filter in the frontend ("outbound") with plugins for JavaScript, Swift, and Android, or directly inside of your agent code ("inbound"). The BVC model is available only within your agent, using the Python or Node.js plugins. LiveKit also offers an NC model for SIP-based telephony, which can be enabled with a flag in the trunk configuration.

The following table shows the support for each platform.

| Platform | Outbound | Inbound | BVC | Package |
| Web | ✅ | ❌ | ❌ | [@livekit/krisp-noise-filter](https://www.npmjs.com/package/@livekit/krisp-noise-filter) |
| Swift | ✅ | ❌ | ❌ | [LiveKitKrispNoiseFilter](https://github.com/livekit/swift-krisp-noise-filter) |
| Android | ✅ | ❌ | ❌ | [io.livekit:krisp-noise-filter](https://central.sonatype.com/artifact/io.livekit/krisp-noise-filter) |
| Flutter | ✅ | ❌ | ❌ | [livekit_noise_filter](https://pub.dev/packages/livekit_noise_filter) |
| React Native | ✅ | ❌ | ❌ | [@livekit/react-native-krisp-noise-filter](https://www.npmjs.com/package/@livekit/react-native-krisp-noise-filter) |
| Unity | ❌ | ❌ | ❌ | N/A |
| Python | ❌ | ✅ | ✅ | [livekit-plugins-noise-cancellation](https://pypi.org/project/livekit-plugins-noise-cancellation/) |
| Node.js | ❌ | ✅ | ✅ | [@livekit/noise-cancellation-node](https://www.npmjs.com/package/@livekit/noise-cancellation-node) |
| Telephony | ✅ | ✅ | ❌ | [LiveKit SIP documentation](https://docs.livekit.io/sip.md#noise-cancellation-for-calls) |

## Usage instructions

Use the following instructions to integrate the filter into your app, either inside of your agent code or in the frontend.

> 💡 **Tip**
> 
> Leaving default settings on is strongly recommended. Learn more about these defaults in the [Noise & echo cancellation](https://docs.livekit.io/home/client/tracks/noise-cancellation.md) docs.

### Agent code ("inbound") implementation

The following examples show how to set up noise cancellation inside your agent code. This applies noise cancellation to inbound audio and is the recommended approach for most voice AI use cases.

**Python**:

> 💡 **Tip**
> 
> When using noise or background voice cancellation in the agent code, do not enable Krisp noise cancellation in the frontend. Noise cancellation models are trained on raw audio and might produce unexpected results if the input has already been processed by Krisp in the frontend.
> 
> Standard noise cancellation and the separate echo cancellation feature can be left enabled.

#### Installation

Install the noise cancellation package from PyPI:

```bash
pip install "livekit-plugins-noise-cancellation~=0.2"

```

#### Usage in LiveKit Agents

Include the filter in `RoomInputOptions` when starting your `AgentSession`:

```python
from livekit.plugins import noise_cancellation

# ...
await session.start(
    # ...,
    room_input_options=room_io.RoomInputOptions(
        noise_cancellation=noise_cancellation.BVC(),
    ),
)
# ...

```

> 💡 **Agents v0.12 compatibility**
> 
> In LiveKit Agents v0.12, pass the `noise_cancellation` parameter to the `VoicePipelineAgent` or `MultimodalAgent` constructor.

#### Usage with AudioStream

Apply the filter to any individual inbound AudioStream:

```python
stream = rtc.AudioStream.from_track(
    track=track,
    noise_cancellation=noise_cancellation.NC(),
)

```

#### Available models

There are three noise cancellation models available:

```python
# Standard enhanced noise cancellation
noise_cancellation.NC()

# Background voice cancellation (NC + removes non-primary voices
# that would confuse transcription or turn detection)
noise_cancellation.BVC()

# Background voice cancellation optimized for telephony applications
noise_cancellation.BVCTelephony()

```

---

**Node.js**:

> 💡 **Tip**
> 
> When using noise or background voice cancellation in the agent code, do not enable Krisp noise cancellation in the frontend. Noise cancellation models are trained on raw audio and might produce unexpected results if the input has already been processed by Krisp in the frontend.
> 
> Standard noise cancellation and the separate echo cancellation feature can be left enabled.

#### Installation

Install the noise cancellation package from NPM:

```bash
npm install @livekit/noise-cancellation-node

```

#### Usage in LiveKit Agents

Pass the model to the `Agent` constructor:

```typescript
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';

const assistant = new voice.Agent({
  noiseCancellation: BackgroundVoiceCancellation(),
  // ... model, etc.
});

```

#### Usage with AudioStream

Apply the filter to any individual inbound AudioStream:

```typescript
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';

// Create AudioStream with noise cancellation
const stream = new AudioStream(track, {
  noiseCancellation: BackgroundVoiceCancellation()
});

```

#### Available models

There are three noise cancellation models available:

```typescript
import {
  // Standard enhanced noise cancellation
  NoiseCancellation,

  // Background voice cancellation (NC + removes non-primary voices
  // that would confuse transcription or turn detection)
  BackgroundVoiceCancellation,

  // Background voice cancellation optimized for telephony applications
  TelephonyBackgroundVoiceCancellation,
} from '@livekit/noise-cancellation-node';

```

---

**SIP**:

#### Installation (inbound)

Include `krisp_enabled: true` in the trunk configuration.

```json
{
  "trunk": {
    "name": "My trunk",
    "numbers": ["+15105550100"],
    "krisp_enabled": true
  }
}

```

See the full [inbound trunk docs](https://docs.livekit.io/sip/trunk-inbound.md) for more information.

#### Available models

The Telephony noise filter supports only the standard noise cancellation (NC) model.

### Frontend ("outbound") implementation

The following examples show how to set up noise cancellation in the frontend. This applies noise cancellation to outbound audio.

**JavaScript**:

> 💡 **Tip**
> 
> When using noise or background voice cancellation in the frontend, do not enable Krisp noise cancellation in the agent code.
> 
> Standard noise cancellation and the separate echo cancellation feature can be left enabled.

#### Installation

```bash
npm install @livekit/krisp-noise-filter

```

This package includes the Krisp SDK but not the models, which downloads at runtime to minimize the impact on your application's bundle size.

#### React components usage

LiveKit Components includes a convenient [`useKrispNoiseFilter`](https://docs.livekit.io/reference/components/react/hook/usekrispnoisefilter.md) hook to easily integrate Krisp into your React app:

```tsx
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';

function MyKrispSetting() {
  const krisp = useKrispNoiseFilter();
  return (
    <input
      type="checkbox"
      onChange={(ev) => krisp.setNoiseFilterEnabled(ev.target.checked)}
      checked={krisp.isNoiseFilterEnabled}
      disabled={krisp.isNoiseFilterPending}
    />
  );
}

```

#### Base JS SDK usage

For other frameworks or advanced use cases, use the `KrispNoiseFilter` class directly:

```ts
import { type LocalAudioTrack, Room, RoomEvent, Track } from 'livekit-client';

const room = new Room();

// We recommend a dynamic import to only load the required resources when you enable the plugin
const { KrispNoiseFilter } = await import('@livekit/krisp-noise-filter');

room.on(RoomEvent.LocalTrackPublished, async (trackPublication) => {
  if (
    trackPublication.source === Track.Source.Microphone &&
    trackPublication.track instanceof LocalAudioTrack
  ) {
    if (!isKrispNoiseFilterSupported()) {
      console.warn('Krisp noise filter is currently not supported on this browser');
      return;
    }
    // Once instantiated, the filter will begin initializing and will download additional resources
    const krispProcessor = KrispNoiseFilter();
    console.log('Enabling LiveKit Krisp noise filter');
    await trackPublication.track.setProcessor(krispProcessor);

    // To enable/disable the noise filter, use setEnabled()
    await krispProcessor.setEnabled(true);

    // To check the current status use:
    // krispProcessor.isEnabled()

    // To stop and dispose of the Krisp processor, simply call:
    // await trackPublication.track.stopProcessor()
  }
});

```

#### Available models

The JavaScript noise filter supports only the standard noise cancellation (NC) model.

#### Compatibility

Not all browsers support the underlying Krisp SDK (including Safari <17.4). Use `isKrispNoiseFilterSupported()` to check if the current browser is supported.

---

**Android**:

> 💡 **Tip**
> 
> When using noise or background voice cancellation in the frontend, do not enable Krisp noise cancellation in the agent code.
> 
> Standard noise cancellation and the separate echo cancellation feature can be left enabled.

#### Installation

Add the package to your `build.gradle` file:

```groovy
dependencies {
  implementation "io.livekit:krisp-noise-filter:0.0.10"
}

```

Get the latest SDK version number from [Maven Central](https://central.sonatype.com/artifact/io.livekit/krisp-noise-filter).

#### Usage

```kotlin
val krisp = KrispAudioProcessor.getInstance(getApplication())

coroutineScope.launch(Dispatchers.IO) {
    // Only needs to be done once.
    // This should be executed on the background thread to avoid UI freezes.
    krisp.init()
}

// Pass the KrispAudioProcessor into the Room creation
room = LiveKit.create(
    getApplication(),
    overrides = LiveKitOverrides(
        audioOptions = AudioOptions(
            audioProcessorOptions = AudioProcessorOptions(
                capturePostProcessor = krisp,
            )
        ),
    ),
)

// Or to set after Room creation
room.audioProcessingController.setCapturePostProcessing(krisp)

```

#### Available models

The Android noise filter supports only the standard noise cancellation (NC) model.

---

**Swift**:

> 💡 **Tip**
> 
> When using noise or background voice cancellation in the frontend, do not enable Krisp noise cancellation in the agent code.
> 
> Standard noise cancellation and the separate echo cancellation feature can be left enabled.

#### Installation

Add a new [package dependency](https://developer.apple.com/documentation/xcode/adding-package-dependencies-to-your-app) to your app by URL:

```
https://github.com/livekit/swift-krisp-noise-filter

```

Or in your `Package.swift` file:

```swift
.package(url: "https://github.com/livekit/swift-krisp-noise-filter.git", from: "0.0.7"),

```

#### Usage

Here is a simple example of a SwiftUI app that uses Krisp in its root view:

```swift
import LiveKit
import SwiftUI
import LiveKitKrispNoiseFilter

// Keep this as a global variable or somewhere that won't be deallocated
let krispProcessor = LiveKitKrispNoiseFilter()

struct ContentView: View {
    @StateObject private var room = Room()

    var body: some View {
        MyOtherView()
        .environmentObject(room)
        .onAppear {
            // Attach the processor
            AudioManager.shared.capturePostProcessingDelegate = krispProcessor
            // This must be done before calling `room.connect()`
            room.add(delegate: krispProcessor)

            // You are now ready to connect to the room from this view or any child view
        }
    }
}

```

For a complete example, view the [Krisp sample project](https://github.com/livekit-examples/swift-example-collection/tree/main/krisp-minimal).

#### Available models

The Swift noise filter supports only the standard noise cancellation (NC) model.

#### Compatibility

- The Krisp SDK requires iOS 13+ or macOS 10.15+.
- If your app also targets visionOS or tvOS, you'll need to wrap your Krisp code in `#if os(iOS) || os(macOS)` and [add a filter to the library linking step in Xcode](https://developer.apple.com/documentation/xcode/customizing-the-build-phases-of-a-target#Link-against-additional-frameworks-and-libraries).

---

**React Native**:

> 💡 **Tip**
> 
> When using noise or background voice cancellation in the frontend, do not enable Krisp noise cancellation in the agent code.
> 
> Standard noise cancellation and the separate echo cancellation feature can be left enabled.

#### Installation

```bash
npm install @livekit/react-native-krisp-noise-filter

```

This package includes both the Krisp SDK and the required models.

#### Usage

```tsx
import { KrispNoiseFilter } from '@livekit/react-native-krisp-noise-filter';
import { useLocalParticipant } from '@livekit/components-react';
import { useMemo, useEffect } from 'react';

function MyComponent() {
  let { microphoneTrack } = useLocalParticipant();
  const krisp = useMemo(() => KrispNoiseFilter(), []);

  useEffect(() => {
    const localAudioTrack = microphoneTrack?.audioTrack;
    if (!localAudioTrack) {
      return;
    }
    localAudioTrack?.setProcessor(krisp);
  }, [microphoneTrack, krisp]);
}

```

#### Available models

The React Native noise filter supports only the standard noise cancellation (NC) model.

---

**Flutter**:

> 💡 **Tip**
> 
> When using noise or background voice cancellation in the frontend, do not enable Krisp noise cancellation in the agent code.
> 
> Standard noise cancellation and the separate echo cancellation feature can be left enabled.

#### Installation

Add the package to your `pubspec.yaml` file:

```yaml
dependencies:
  livekit_noise_filter: ^0.1.0

```

#### Usage

```dart
import 'package:livekit_client/livekit_client.dart';
import 'package:livekit_noise_filter/livekit_noise_filter.dart';

// Create the noise filter instance
final liveKitNoiseFilter = LiveKitNoiseFilter();

// Configure room with the noise filter
final room = Room(
  roomOptions: RoomOptions(
    defaultAudioCaptureOptions: AudioCaptureOptions(
      processor: liveKitNoiseFilter,
    ),
  ),
);

// Connect to room and enable microphone
await room.connect(url, token);
await room.localParticipant?.setMicrophoneEnabled(true);

// You can also enable/disable the filter at runtime
// liveKitNoiseFilter.setBypass(true);  // Disables noise cancellation
// liveKitNoiseFilter.setBypass(false); // Enables noise cancellation

```

#### Available models

The Flutter noise filter supports only the standard noise cancellation (NC) model.

#### Compatibility

The Flutter noise filter is currently supported only on iOS, macOS, and Android platforms.

---

**SIP**:

#### Installation (outbound)

Include `krisp_enabled: true` in the [`CreateSipParticipant`](https://docs.livekit.io/sip/api.md#createsipparticipant) request.

```python
request = CreateSIPParticipantRequest(
  sip_trunk_id = "<trunk_id>",
  sip_call_to = "<phone_number>",
  room_name = "my-sip-room",
  participant_identity = "sip-test",
  participant_name = "Test Caller",
  krisp_enabled = True,
  wait_until_answered = True
)

```

See the full [outbound call docs](https://docs.livekit.io/sip/outbound-calls.md) for more information.

#### Available models

The Telephony noise filter supports only the standard noise cancellation (NC) model.

---

This document was rendered at 2025-09-27T09:36:32.242Z.
For the latest version of this document, see [https://docs.livekit.io/home/cloud/noise-cancellation.md](https://docs.livekit.io/home/cloud/noise-cancellation.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).