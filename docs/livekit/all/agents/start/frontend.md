LiveKit Docs › Getting started › Web & mobile frontends

---

# Web and mobile frontends

> Bring your agent to life through a web or mobile app.

## Overview

LiveKit Agents is ready to integrate with your preferred frontend platform using the [LiveKit SDKs](https://docs.livekit.io/home/client/connect.md) for JavaScript, Swift, Android, Flutter, React Native, and more. Your agent can communicate with your frontend through LiveKit WebRTC, which provides fast and reliable realtime connectivity.

For example, a simple voice agent subscribes to the user's microphone track and publishes its own. [Text transcriptions](https://docs.livekit.io/agents/build/text.md) are also available as text streams. A more complex agent with vision capabilities can subscribe to a video track published from the user's camera or shared screen. An agent can also publish its own video to implement a virtual avatar or other features.

In all of these cases, the LiveKit SDKs are production grade and easy to use so you can build useful and advanced agents without worrying about the complexities of realtime media delivery. This topic contains resources and tips for building a high-quality frontend for your agent.

## Starter apps

LiveKit recommends using one of the following starter apps to get up and running quickly on your preferred platform. Each app is open source under the MIT License so you can freely modify it to your own needs. The mobile apps require a hosted token server, but include a [LiveKit Cloud Sandbox](https://cloud.livekit.io/projects/p_/sandbox/templates/token-server) for development purposes.

![undefined](/images/agents/start/frontend/agent-starter-react-screenshot-dark.png)

- **[SwiftUI Voice Agent](https://github.com/livekit-examples/agent-starter-swift)**: A native iOS, macOS, and visionOS voice AI assistant built in SwiftUI.

- **[Next.js Voice Agent](https://github.com/livekit-examples/agent-starter-react)**: A web voice AI assistant built with React and Next.js.

- **[Flutter Voice Agent](https://github.com/livekit-examples/agent-starter-flutter)**: A cross-platform voice AI assistant app built with Flutter.

- **[React Native Voice Agent](https://github.com/livekit-examples/agent-starter-react-native)**: A native voice AI assistant app built with React Native and Expo.

- **[Android Voice Agent](https://github.com/livekit-examples/agent-starter-android)**: A native Android voice AI assistant app built with Kotlin and Jetpack Compose.

- **[Web Embed Voice Agent](https://github.com/livekit-examples/agent-starter-embed)**: A voice AI agent that can be embedded in any web page.

## Media and text

To learn more about realtime media and text streams, see the following documentation.

- **[Media tracks](https://docs.livekit.io/home/client/tracks.md)**: Use the microphone, speaker, cameras, and screenshare with your agent.

- **[Text streams](https://docs.livekit.io/home/client/data/text-streams.md)**: Send and receive realtime text and transcriptions.

## Data sharing

To share images, files, or any other kind of data between your frontend and your agent, you can use the following features.

- **[Byte streams](https://docs.livekit.io/home/client/data/byte-streams.md)**: Send and receive images, files, or any other data.

- **[Data packets](https://docs.livekit.io/home/client/data/packets.md)**: Low-level API for sending and receiving any kind of data.

## State and control

In some cases, your agent and your frontend code might need a custom integration of state and configuration to meet your application's requirements. In these cases, the LiveKit realtime state and data features can be used to create a tightly-coupled and responsive experience.

AgentSession automatically manages the `lk.agent.state` participant attribute to contain the appropriate string value from among `initializing`, `listening`, `thinking`, or `speaking`.

- **[State synchronization](https://docs.livekit.io/home/client/state.md)**: Share custom state between your frontend and agent.

- **[RPC](https://docs.livekit.io/home/client/data/rpc.md)**: Define and call methods on your agent or your frontend from the other side.

## Audio visualizer

The LiveKit component SDKs for React, SwiftUI, Android Compose, and Flutter include an audio visualizer component that can be used to give your voice agent a visual presence in your application.

For complete examples, see the sample apps listed above. The following documentation is a quick guide to using these components:

**React**:

Install the [React components](https://github.com/livekit/components-js/tree/main/packages/react) and [styles](https://github.com/livekit/components-js/tree/main/packages/styles) packages to use the [useVoiceAssistant](https://docs.livekit.io/reference/components/react/hook/usevoiceassistant.md) hook and the [BarVisualizer](https://docs.livekit.io/reference/components/react/component/barvisualizer.md). These components work automatically within a [LiveKitRoom](https://docs.livekit.io/reference/components/react/component/livekitroom.md) or [RoomContext.Provider](https://docs.livekit.io/reference/components/react/component/roomcontext.md)).

Also see [VoiceAssistantControlBar](https://docs.livekit.io/reference/components/react/component/voiceassistantcontrolbar.md), which provides a simple set of common UI controls for voice agent applications.

```typescript
"use client";

import "@livekit/components-styles";

import {
  useVoiceAssistant,
  BarVisualizer,
} from "@livekit/components-react";

export default function SimpleVoiceAssistant() {
  // Get the agent's audio track and current state
  const { state, audioTrack } = useVoiceAssistant();
  return (
    <div className="h-80">
      <BarVisualizer state={state} barCount={5} trackRef={audioTrack} style={{}} />
      <p className="text-center">{state}</p>
    </div>
  );
}

```

---

**Swift**:

First install the components package from [https://github.com/livekit/components-swift](https://github.com/livekit/components-swift).

Then you can use the `AgentBarAudioVisualizer` view to display the agent's audio and state:

```swift
struct AgentView: View {
    // Load the room from the environment
    @EnvironmentObject private var room: Room

    // Find the first agent participant in the room
    private var agentParticipant: RemoteParticipant? {
        for participant in room.remoteParticipants.values {
            if participant.kind == .agent {
                return participant
            }
        }
        
        return nil
    }

    // Reads the agent state property
    private var agentState: AgentState {
        agentParticipant?.agentState ?? .initializing
    }

    var body: some View {
          AgentBarAudioVisualizer(audioTrack: participant.firstAudioTrack, agentState: agentState, barColor: .primary, barCount: 5)
              .id(participant.firstAudioTrack?.id)
    }
}

```

---

**Android**:

First install the components package from [https://github.com/livekit/components-android](https://github.com/livekit/components-android).

Then you can use the `rememberVoiceAssistant` and `VoiceAssistantBarVisualizer` composables to display the visualizer, assuming you are within a `RoomScope` composable already.

```kotlin
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import io.livekit.android.compose.state.rememberVoiceAssistant
import io.livekit.android.compose.ui.audio.VoiceAssistantBarVisualizer

@Composable
fun AgentAudioVisualizer(modifier: Modifier = Modifier) {
    // Get the voice assistant instance
    val voiceAssistant = rememberVoiceAssistant()
    
    // Display the audio visualization
    VoiceAssistantBarVisualizer(
        voiceAssistant = voiceAssistant,
        modifier = modifier
            .padding(8.dp)
            .fillMaxWidth()
    )
}

```

---

**Flutter**:

First install the components package from [https://github.com/livekit/components-flutter](https://github.com/livekit/components-flutter).

```bash
flutter pub add livekit_components

```

Enable audio visualization when creating the `Room`:

```dart
// Enable audio visualization when creating the Room
final room = Room(roomOptions: const RoomOptions(enableVisualizer: true));

```

Then you can use the `SoundWaveformWidget` to display the agent's audio visualization, assuming you're using a `RoomContext`:

```dart
import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart';
import 'package:livekit_components/livekit_components.dart' hide ParticipantKind;
import 'package:provider/provider.dart';

/// Shows a simple audio visualizer for an agent participant
class AgentView extends StatelessWidget {
  const AgentView({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<RoomContext>(
      builder: (context, roomContext, child) {
        // Find the agent participant in the room
        final agentParticipant = roomContext.room.remoteParticipants.values
            .where((p) => p.kind == ParticipantKind.AGENT)
            .firstOrNull;
        
        if (agentParticipant == null) {
          return const SizedBox.shrink();
        }
        
        // Get the agent's audio track for visualization
        final audioTrack = agentParticipant.audioTrackPublications
            .firstOrNull?.track as AudioTrack?;
            
        if (audioTrack == null) {
          return const SizedBox.shrink();
        }
        
        // Show the waveform visualization
        return SoundWaveformWidget(
          audioTrack: audioTrack,
          options: AudioVisualizerOptions(
            width: 32,
            minHeight: 32,
            maxHeight: 256,
            color: Theme.of(context).colorScheme.primary,
            count: 7,
          ),
        );
      },
    );
  }
}

```

## Authentication

The LiveKit SDKs require a [token](https://docs.livekit.io/home/get-started/authentication.md) to connect to a room. In web apps, you can typically include a simple token endpoint as part of the app. For mobile apps, you need a separate [token server](https://docs.livekit.io/home/server/generating-tokens.md).

## Virtual avatars

Your frontend can include a video representation of your agent using a virtual avatar from a supported provider. LiveKit includes full support for video rendering on all supported platforms. The [starter apps](#starter-apps) include support for virtual avatars. For more information and a list of supported providers, consult the documentation:

- **[Virtual avatars](https://docs.livekit.io/agents/integrations/avatar.md)**: Use a virtual avatar to give your agent a visual presence in your app.

## Responsiveness tips

This section contains some suggestions to make your app feel more responsive to the user.

### Minimize connection time

To connect your user to your agent, these steps must all occur:

1. Fetch an access token.
2. The user connects to the room.
3. Dispatch an agent process.
4. The agent connects to the room.
5. User and agent publish and subscribe to each other's media tracks.

If done in sequence, this takes up to a few seconds to complete. You can reduce this time by eliminating or parallelizing these steps.

**Option 1: "Warm" token**

In this case, your application will generate a token for the user at login with a long expiration time. When you need to connect to the room, the token is already available in your frontend.

**Option 2: Dispatch agent during token generation**

In this case, your application will optimistically create a room and dispatch the agent at the same time the token is generated, using [explicit agent dispatch](https://docs.livekit.io/agents/worker/agent-dispatch.md#explicit). This allows the user and the agent to connect to the room at the same time.

### Connection indicators

Make your app feel more responsive, even when slow to connect, by linking various events into only one or two status indicators for the user rather than a number of discrete steps and UI changes.  Refer to the [event handling](https://docs.livekit.io/home/client/events.md) documentation for more information on how to monitor the connection state and other events.

In the case that your agent fails to connect, you should notify the user and allow them to try again rather than leaving them to speak into an empty room.

- **Room connection**: The `room.connect` method can be awaited in most SDKs, and most also provide a `room.connectionState` property. Also monitor the `Disconnected` event to know when the connection is lost.
- **Agent presence**: Monitor `ParticipantConnected` events with `participant.kind === ParticipantKind.AGENT`
- **Agent state**: Access the agent's state (`initializing`, `listening`, `thinking`, or `speaking`)
- **Track subscription**: Listen for `TrackSubscribed` events to know when your media has been subscribed to.

### Effects

You should use sound effects, haptic feedback, and visual effects to make your agent feel more responsive. This is especially important during long thinking states (for instance, when performing external lookups or tool use). The [visualizer](#audio-visualizer) includes basic "thinking" state indication and also allows the user to notice when their audio is not working. For more advanced effects, use the [state and control](#state-control) features to trigger effects in your frontend.

---

This document was rendered at 2025-09-27T09:36:21.711Z.
For the latest version of this document, see [https://docs.livekit.io/agents/start/frontend.md](https://docs.livekit.io/agents/start/frontend.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).