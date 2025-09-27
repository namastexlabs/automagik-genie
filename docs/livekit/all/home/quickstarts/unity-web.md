LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › Unity (WebGL)

---

# Unity quickstart (WebGL)

> Get started with LiveKit and Unity (WebGL)

## 1. Install LiveKit SDK

Click the Add **+** menu in the Package Manager toolbar, select **Add package from git URL**, and enter: `https://github.com/livekit/client-sdk-unity-web.git`

For more details, see the [Unity docs on installing packages from Git URLs](https://docs.unity3d.com/Manual/upm-ui-giturl.html).

## 2. Connect to a room

Note that this example hardcodes a token. In a real app, you’ll need your server to generate a token for you.

```cs
public class MyObject : MonoBehaviour
{
    public Room Room;

    IEnumerator Start()
    {
        Room = new Room();
        var c = Room.Connect("%{wsURL}%", "%{token}%");
        yield return c;

        if (!c.IsError) {
            // Connected
        }
    }
}

```

## 3. Publish video & audio

```cs
yield return Room.LocalParticipant.EnableCameraAndMicrophone();

```

## 4. Display a video on a RawImage

```cs
RawImage image = GetComponent<RawImage>();

Room.TrackSubscribed += (track, publication, participant) =>
{
    if(track.Kind == TrackKind.Video)
    {
        var video = track.Attach() as HTMLVideoElement;
        video.VideoReceived += tex =>
        {
            // VideoReceived is called every time the video resolution changes
            image.texture = tex;
        };
    }
};

```

## 5. Next Steps

- Set up a server to generate tokens for your app at runtime by following this guide: [Generating Tokens](https://docs.livekit.io/home/server/generating-tokens.md).
- View the [full SDK reference](https://livekit.github.io/client-sdk-unity-web/) and [GitHub repository](https://github.com/livekit/client-sdk-unity-web) for more documentation and examples.

Happy coding!

---

This document was rendered at 2025-09-27T09:36:40.081Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/unity-web.md](https://docs.livekit.io/home/quickstarts/unity-web.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).