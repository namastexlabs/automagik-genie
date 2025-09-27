LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › Android (Compose)

---

# Android quickstart (Jetpack Compose)

> Get started with LiveKit and Android using Jetpack Compose

## Voice AI quickstart

To build your first voice AI app for Android, use the following quickstart and the starter app. Otherwise follow the getting started guide below.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Create a voice AI agent in less than 10 minutes.

- **[Android Voice Agent](https://github.com/livekit-examples/agent-starter-android)**: A native Android voice AI assistant app built with Kotlin and Jetpack Compose.

## Getting started guide

This guide uses the Android Components library for the easiest way to get started on Android.

If you are using the traditional view-based system, check out the [Android quickstart](https://docs.livekit.io/home/quickstarts/android.md).

Otherwise follow this guide to build your first LiveKit app with Android Compose.

### SDK installation

LiveKit Components for Android Compose is available as a Maven package.

```groovy
...
dependencies {
    implementation "io.livekit:livekit-android-compose-components:<current version>"
}

```

See the [releases page](https://github.com/livekit/components-android/releases) for information on the latest version of the SDK.

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
/**
 * Checks if the RECORD_AUDIO and CAMERA permissions are granted.
 *
 * If not granted, will request them. Will call onPermissionGranted if/when
 * the permissions are granted.
 */
fun ComponentActivity.requireNeededPermissions(onPermissionsGranted: (() -> Unit)? = null) {
    val requestPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { grants ->
            // Check if any permissions weren't granted.
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

            // If all granted, notify if needed.
            if (onPermissionsGranted != null && grants.all { it.value }) {
                onPermissionsGranted()
            }
        }

    val neededPermissions = listOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA)
        .filter { ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_DENIED }
        .toTypedArray()

    if (neededPermissions.isNotEmpty()) {
        requestPermissionLauncher.launch(neededPermissions)
    } else {
        onPermissionsGranted?.invoke()
    }
}

```

### Connecting to LiveKit

Note that this example hardcodes a token we generated for you that expires in 2 hours. In a real app, you’ll need your server to generate a token for you.

```kt
// !! Note !!
// This sample hardcodes a token which expires in 2 hours.
const val wsURL = "%{wsURL}%"
const val token = "%{token}%"
// In production you should generate tokens on your server, and your frontend
// should request a token from your server.

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        requireNeededPermissions {
            setContent {
                RoomScope(
                    url = wsURL,
                    token = token,
                    audio = true,
                    video = true,
                    connect = true,
                ) {
                    // Get all the tracks in the room.
                    val trackRefs = rememberTracks()

                    // Display the video tracks.
                    // Audio tracks are automatically played.
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(trackRefs.size) { index ->
                            VideoTrackView(
                                trackReference = trackRefs[index],
                                modifier = Modifier.fillParentMaxHeight(0.5f)
                            )
                        }
                    }
                }
            }
        }
    }
}

```

(For more details, you can reference [the complete quickstart app](https://github.com/livekit-examples/android-components-quickstart).)

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

This document was rendered at 2025-09-27T09:36:37.556Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/android-compose.md](https://docs.livekit.io/home/quickstarts/android-compose.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).