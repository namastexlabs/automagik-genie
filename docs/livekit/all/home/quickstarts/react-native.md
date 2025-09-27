LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › React Native

---

# React Native quickstart

> Get started with LiveKit and React Native

> ℹ️ **Note**
> 
> If you're planning to integrate LiveKit into an Expo app, see the [quickstart guide for Expo instead](https://docs.livekit.io/home/quickstarts/expo.md).

## Voice AI quickstart

To build your first voice AI app for React Native, use the following quickstart and the starter app. Otherwise follow the getting started guide below.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Create a voice AI agent in less than 10 minutes.

- **[React Native Voice Agent](https://github.com/livekit-examples/agent-starter-react-native)**: A native voice AI assistant app built with React Native and Expo.

## Getting started guide

The following guide walks you through the steps to build a video-conferencing application using React Native. It uses the [LiveKit React Native SDK](https://github.com/livekit/client-sdk-react-native) to render the UI and communicate with LiveKit servers via WebRTC. By the end, you will have a basic video-conferencing application you can run with multiple participants.

### Install LiveKit SDK

Install the LiveKit SDK:

```shell
npm install @livekit/react-native @livekit/react-native-webrtc livekit-client

```

### Integrate into your project

**Android**:

This library depends on @livekit/react-native-webrtc, which has additional installation instructions for [Android](https://github.com/livekit/react-native-webrtc/blob/master/Documentation/AndroidInstallation.md).

Once the @livekit/react-native-webrtc dependency is installed, one last step is required. In your MainApplication.java file:

```java
import com.livekit.reactnative.LiveKitReactNative;
import com.livekit.reactnative.audio.AudioType;

public class MainApplication extends Application implements ReactApplication {

  @Override
  public void onCreate() {
    // Place this above any other RN related initialization
    // When the AudioType is omitted, it'll default to CommunicationAudioType.
    // Use AudioType.MediaAudioType if user is only consuming audio, and not publishing
    LiveKitReactNative.setup(this, new AudioType.CommunicationAudioType());

    //...
  }
}

```

---

**Swift**:

This library depends on `@livekit/react-native-webrtc`, which has additional installation instructions for [iOS](https://github.com/livekit/react-native-webrtc/blob/master/Documentation/iOSInstallation.md).

Once the `@livekit/react-native-webrtc` dependency is installed, one last step is required. In your `AppDelegate.m` file:

```objc
#import "LivekitReactNative.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Place this above any other RN related initialization
  [LivekitReactNative setup];

  //...
}

```

If you are using Expo, LiveKit is available on Expo through development builds. [See the instructions found here](https://github.com/livekit/client-sdk-react-native/wiki/Expo-Development-Build-Instructions).

Finally, in your index.js file, setup the LiveKit SDK by calling `registerGlobals()`. This sets up the required WebRTC libraries for use in Javascript, and is needed for LiveKit to work.

```jsx
import { registerGlobals } from '@livekit/react-native';

// ...

registerGlobals();

```

### Connect to a room, publish video & audio

```jsx
import * as React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { useEffect } from 'react';
import {
  AudioSession,
  LiveKitRoom,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  isTrackReference,
  registerGlobals,
} from '@livekit/react-native';
import { Track } from 'livekit-client';

// !! Note !!
// This sample hardcodes a token which expires in 2 hours.
const wsURL = "%{wsURL}%"
const token = "%{token}%"

export default function App() {
  // Start the audio session first.
  useEffect(() => {
    let start = async () => {
      await AudioSession.startAudioSession();
    };

    start();
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  return (
    <LiveKitRoom
      serverUrl={wsURL}
      token={token}
      connect={true}
      options={{
        // Use screen pixel density to handle screens with differing densities.
        adaptiveStream: { pixelDensity: 'screen' },
      }}
      audio={true}
      video={true}
    >
      <RoomView />
    </LiveKitRoom>
  );
};

const RoomView = () => {
  // Get all camera tracks.
  const tracks = useTracks([Track.Source.Camera]);

  const renderTrack: ListRenderItem<TrackReferenceOrPlaceholder> = ({item}) => {
    // Render using the VideoTrack component.
    if(isTrackReference(item)) {
      return (<VideoTrack trackRef={item} style={styles.participantView} />)
    } else {
      return (<View style={styles.participantView} />)
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tracks}
        renderItem={renderTrack}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  participantView: {
    height: 300,
  },
});

```

### Create a backend server to generate tokens

Set up a server to generate tokens for your app at runtime by following this guide: [Generating Tokens](https://docs.livekit.io/home/server/generating-tokens.md).

## Next steps

The following resources are useful for getting started with LiveKit on React Native.

- **[Generating tokens](https://docs.livekit.io/home/server/generating-tokens.md)**: Guide to generating authentication tokens for your users.

- **[Realtime media](https://docs.livekit.io/home/client/tracks.md)**: Complete documentation for live video and audio tracks.

- **[Realtime data](https://docs.livekit.io/home/client/data.md)**: Send and receive realtime data between clients.

- **[React Native SDK](https://github.com/livekit/client-sdk-react-native)**: LiveKit React Native SDK on GitHub.

- **[React Native SDK reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/livekit/client-sdk-react-native/main/docs/modules.html)**: LiveKit React Native SDK reference docs.

---

This document was rendered at 2025-09-27T09:36:39.271Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/react-native.md](https://docs.livekit.io/home/quickstarts/react-native.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).