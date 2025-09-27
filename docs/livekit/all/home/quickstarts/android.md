LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › Android

---

# Android quickstart

> Get started with LiveKit and Android

## Voice AI quickstart

To build your first voice AI app for Android, use the following quickstart and the starter app. Otherwise follow the getting started guide below.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Create a voice AI agent in less than 10 minutes.

- **[Android Voice Agent](https://github.com/livekit-examples/agent-starter-android)**: A native Android voice AI assistant app built with Kotlin and Jetpack Compose.

## Getting started guide

This guide is for Android apps using the traditional view-based system. If you are using Jetpack Compose, check out the [Compose quickstart guide](https://docs.livekit.io/home/quickstarts/android-compose.md).

### Install LiveKit SDK

LiveKit for Android is available as a Maven package.

```groovy
...
dependencies {
  implementation "io.livekit:livekit-android:<current version>"
}

```

See the [releases page](https://github.com/livekit/client-sdk-android/releases) for information on the latest version of the SDK.

You'll also need JitPack as one of your repositories. In your `settings.gradle` file:

```groovy
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        //...
        maven { url 'https://jitpack.io' }
    }
}

```

### Permissions

LiveKit relies on the `RECORD_AUDIO` and `CAMERA` permissions to use the microphone and camera. These permission must be requested at runtime, like so:

```kt
private fun requestPermissions() {
    val requestPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { grants ->
            for (grant in grants.entries) {
                if (!grant.value) {
                    Toast.makeText(
                        this,
                        "Missing permission: ${grant.key}",
                        Toast.LENGTH_SHORT
                    )
                        .show()
                }
            }
        }
    val neededPermissions = listOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA)
        .filter {
            ContextCompat.checkSelfPermission(
                this,
                it
            ) == PackageManager.PERMISSION_DENIED
        }
        .toTypedArray()
    if (neededPermissions.isNotEmpty()) {
        requestPermissionLauncher.launch(neededPermissions)
    }
}

```

### Connect to LiveKit

Use the following code to connect and publish audio/video to a room, while rendering the video from other connected participants.

LiveKit uses `SurfaceViewRenderer` to render video tracks. A `TextureView` implementation is also provided through `TextureViewRenderer`. Subscribed audio tracks are automatically played.

Note that this example hardcodes a token we generated for you that expires in 2 hours. In a real app, you’ll need your server to generate a token for you.

```kt
// !! Note !!
// This sample hardcodes a token which expires in 2 hours.
const val wsURL = "%{wsURL}%"
const val token = "%{token}%"
// In production you should generate tokens on your server, and your frontend
// should request a token from your server.

class MainActivity : AppCompatActivity() {

    lateinit var room: Room

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)

        // Create Room object.
        room = LiveKit.create(applicationContext)

        // Setup the video renderer
        room.initVideoRenderer(findViewById<SurfaceViewRenderer>(R.id.renderer))

        connectToRoom()
    }

    private fun connectToRoom() {

        lifecycleScope.launch {

            // Setup event handling.
            launch {
                room.events.collect { event ->
                    when (event) {
                        is RoomEvent.TrackSubscribed -> onTrackSubscribed(event)
                        else -> {}
                    }
                }
            }

            // Connect to server.
            room.connect(
                wsURL,
                token,
            )

            // Publish audio/video to the room
            val localParticipant = room.localParticipant
            localParticipant.setMicrophoneEnabled(true)
            localParticipant.setCameraEnabled(true)
        }
    }

    private fun onTrackSubscribed(event: RoomEvent.TrackSubscribed) {
        val track = event.track
        if (track is VideoTrack) {
            attachVideo(track)
        }
    }

    private fun attachVideo(videoTrack: VideoTrack) {
        videoTrack.addRenderer(findViewById<SurfaceViewRenderer>(R.id.renderer))
        findViewById<View>(R.id.progress).visibility = View.GONE
    }
}

```

(For more details, you can reference [the complete sample app](https://github.com/livekit/client-sdk-android/blob/d8c3b2c8ad8c129f061e953eae09fc543cc715bb/sample-app-basic/src/main/java/io/livekit/android/sample/basic/MainActivity.kt#L21).)

## Next steps

The following resources are useful for getting started with LiveKit on Android.

- **[Generating tokens](https://docs.livekit.io/home/server/generating-tokens.md)**: Guide to generating authentication tokens for your users.

- **[Realtime media](https://docs.livekit.io/home/client/tracks.md)**: Complete documentation for live video and audio tracks.

- **[Realtime data](https://docs.livekit.io/home/client/data.md)**: Send and receive realtime data between clients.

- **[Android SDK](https://github.com/livekit/client-sdk-android)**: LiveKit Android SDK on GitHub.

- **[Android components](https://github.com/livekit/components-android)**: LiveKit Android components on GitHub.

- **[Android SDK reference](https://docs.livekit.io/reference/client-sdk-android/index.html.md)**: LiveKit Android SDK reference docs.

- **[Android components reference](https://docs.livekit.io/reference/components/android.md)**: LiveKit Android components reference docs.

---

This document was rendered at 2025-09-27T09:36:37.835Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/android.md](https://docs.livekit.io/home/quickstarts/android.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).