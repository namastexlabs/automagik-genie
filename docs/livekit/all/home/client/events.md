LiveKit Docs › LiveKit SDKs › Handling events

---

# Handling events

> Observe and respond to events in the LiveKit SDK.

## Overview

The LiveKit SDKs use events to communicate with the application changes that are taking place in the room.

There are two kinds of events, **room events** and **participant events**. Room events are emitted from the main `Room` object, reflecting any change in the room. Participant events are emitted from each `Participant`, when that specific participant has changed.

Room events are generally a superset of participant events. As you can see, some events are fired on both `Room` and `Participant`; this is intentional. This duplication is designed to make it easier to componentize your application. For example, if you have a UI component that renders a participant, it should only listen to events scoped to that participant.

## Declarative UI

Event handling can be quite complicated in a realtime, multi-user system. Participants could be joining and leaving, each publishing tracks or muting them. To simplify this, LiveKit offers built-in support for [declarative UI](https://alexsidorenko.com/blog/react-is-declarative-what-does-it-mean/) for most platforms.

With declarative UI you specify the how the UI should look given a particular state, without having to worry about the sequence of transformations to apply. Modern frameworks are highly efficient at detecting changes and rendering only what's changed.

**React**:

We offer a few hooks and components that makes working with React much simpler.

- [useParticipant](https://docs.livekit.io/reference/components/react/hook/useparticipants.md) - maps participant events to state
- [useTracks](https://docs.livekit.io/reference/components/react/hook/usetracks.md) - returns the current state of the specified audio or video track
- [VideoTrack](https://docs.livekit.io/reference/components/react/component/videotrack.md) - React component that renders a video track
- [RoomAudioRenderer](https://docs.livekit.io/reference/components/react/component/roomaudiorenderer.md) - React component that renders the sound of all audio tracks

```tsx
const Stage = () => {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  return (
    <LiveKitRoom
      {/* ... */}
    >
      // Render all video
      {tracks.map((track) => {
        <VideoTrack trackRef={track} />;
      })}
      // ...and all audio tracks.
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

function ParticipantList() {
  // Render a list of all participants in the room.
  const participants = useParticipants();
  <ParticipantLoop participants={participants}>
    <ParticipantName />
  </ParticipantLoop>;
}

```

---

**SwiftUI**:

Most core objects in the Swift SDK, including `Room`, `Participant`, and `TrackReference`, implement the `ObservableObject` protocol so they are ready-made for use with SwiftUI.

For the simplest integration, the [Swift Components SDK](https://github.com/livekit/components-swift) contains ready-made utilities for modern SwiftUI apps, built on `.environmentObject`:

- `RoomScope` - creates and (optionally) connects to a `Room`, leaving upon dismissal
- `ForEachParticipant` - iterates each `Participant` in the current room, automatically updating
- `ForEachTrack` - iterates each `TrackReference` on the current participant, automatically updating

```swift
struct MyChatView: View {
    var body: some View {
        RoomScope(url: /* URL */,
                  token: /* Token */,
                  connect: true,
                  enableCamera: true,
                  enableMicrophone: true) {
            VStack {
                ForEachParticipant { _ in
                    VStack {
                        ForEachTrack(filter: .video) { _ in
                            MyVideoView()
                                .frame(width: 100, height: 100)
                        }
                    }
                }
            }
        }
    }
}

struct MyVideoView: View {
  @EnvironmentObject private var trackReference: TrackReference

  var body: some View {
      VideoTrackView(trackReference: trackReference)
        .frame(width: 100, height: 100)
  }
}

```

---

**Android Compose**:

The `Room` and `Participant` objects have built-in `Flow` support. Any property marked with a `@FlowObservable` annotation can be observed with the `flow` utility method. It can be used like this:

```kotlin
@Composable
fun Content(
  room: Room
) {
  val remoteParticipants by room::remoteParticipants.flow.collectAsState(emptyMap())
  val remoteParticipantsList = remoteParticipants.values.toList()
  LazyRow {
      items(
          count = remoteParticipantsList.size,
          key = { index -> remoteParticipantsList[index].sid }
      ) { index ->
          ParticipantItem(room = room, participant = remoteParticipantsList[index])
      }
  }
}

@Composable
fun ParticipantItem(
    room: Room,
    participant: Participant,
) {
  val videoTracks by participant::videoTracks.flow.collectAsState(emptyList())
  val subscribedTrack = videoTracks.firstOrNull { (pub) -> pub.subscribed } ?: return
  val videoTrack = subscribedTrack.second as? VideoTrack ?: return

  VideoTrackView(
      room = room,
      videoTrack = videoTrack,
  )
}

```

---

**Flutter**:

Flutter supports [declarative UI](https://docs.flutter.dev/get-started/flutter-for/declarative) by default. The LiveKit SDK notifies changes in two ways:

- ChangeNotifier - generic notification of changes. This is useful when you are building reactive UI and only care about changes that may impact rendering
- EventsListener<Event> - listener pattern to listen to specific events (see [events.dart](https://github.com/livekit/client-sdk-flutter/blob/main/lib/src/events.dart))

```dart
class RoomWidget extends StatefulWidget {
  final Room room;

  RoomWidget(this.room);

  @override
  State<StatefulWidget> createState() {
    return _RoomState();
  }
}

class _RoomState extends State<RoomWidget> {
  late final EventsListener<RoomEvent> _listener = widget.room.createListener();

  @override
  void initState() {
    super.initState();
    // used for generic change updates
    widget.room.addListener(_onChange);

    // Used for specific events
    _listener
      ..on<RoomDisconnectedEvent>((_) {
        // handle disconnect
      })
      ..on<ParticipantConnectedEvent>((e) {
        print("participant joined: ${e.participant.identity}");
      })
  }

  @override
  void dispose() {
    // Be sure to dispose listener to stop listening to further updates
    _listener.dispose();
    widget.room.removeListener(_onChange);
    super.dispose();
  }

  void _onChange() {
    // Perform computations and then call setState
    // setState will trigger a build
    setState(() {
      // your updates here
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    // Builds a room layout with a main participant in the center, and a row of
    // participants at the bottom.
    // ParticipantWidget is located here: https://github.com/livekit/client-sdk-flutter/blob/main/example/lib/widgets/participant.dart
    body: Column(
      children: [
        Expanded(
            child: participants.isNotEmpty
                ? ParticipantWidget.widgetFor(participants.first)
                : Container()),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: math.max(0, participants.length - 1),
            itemBuilder: (BuildContext context, int index) => SizedBox(
              width: 100,
              height: 100,
              child: ParticipantWidget.widgetFor(participants[index + 1]),
            ),
          ),
        ),
      ],
    ),
  );
}

```

## Events

This table captures a consistent set of events that are available across platform SDKs. In addition to what's listed here, there may be platform-specific events on certain platforms.

| Event | Description | Room Event | Participant Event |
| **ParticipantConnected** | A RemoteParticipant joins _after_ the local participant. | ✔️ |  |
| **ParticipantDisconnected** | A RemoteParticipant leaves | ✔️ |  |
| **Reconnecting** | The connection to the server has been interrupted and it's attempting to reconnect. | ✔️ |  |
| **Reconnected** | Reconnection has been successful | ✔️ |  |
| **Disconnected** | Disconnected from room due to the room closing or unrecoverable failure | ✔️ |  |
| **TrackPublished** | A new track is published to room after the local participant has joined | ✔️ | ✔️ |
| **TrackUnpublished** | A RemoteParticipant has unpublished a track | ✔️ | ✔️ |
| **TrackSubscribed** | The LocalParticipant has subscribed to a track | ✔️ | ✔️ |
| **TrackUnsubscribed** | A previously subscribed track has been unsubscribed | ✔️ | ✔️ |
| **TrackMuted** | A track was muted, fires for both local tracks and remote tracks | ✔️ | ✔️ |
| **TrackUnmuted** | A track was unmuted, fires for both local tracks and remote tracks | ✔️ | ✔️ |
| **LocalTrackPublished** | A local track was published successfully | ✔️ | ✔️ |
| **LocalTrackUnpublished** | A local track was unpublished | ✔️ | ✔️ |
| **ActiveSpeakersChanged** | Current active speakers has changed | ✔️ |  |
| **IsSpeakingChanged** | The current participant has changed speaking status |  | ✔️ |
| **ConnectionQualityChanged** | Connection quality was changed for a Participant | ✔️ | ✔️ |
| **ParticipantAttributesChanged** | A participant's attributes were updated | ✔️ | ✔️ |
| **ParticipantMetadataChanged** | A participant's metadata was updated | ✔️ | ✔️ |
| **RoomMetadataChanged** | Metadata associated with the room has changed | ✔️ |  |
| **DataReceived** | Data received from another participant or server | ✔️ | ✔️ |
| **TrackStreamStateChanged** | Indicates if a subscribed track has been paused due to bandwidth | ✔️ | ✔️ |
| **TrackSubscriptionPermissionChanged** | One of subscribed tracks have changed track-level permissions for the current participant | ✔️ | ✔️ |
| **ParticipantPermissionsChanged** | When the current participant's permissions have changed | ✔️ | ✔️ |

---

This document was rendered at 2025-09-27T09:36:27.415Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/events.md](https://docs.livekit.io/home/client/events.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).