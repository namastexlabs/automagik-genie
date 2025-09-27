LiveKit Docs › Recording & export › Custom recording templates

---

# Custom recording templates

> Create your own recording layout to use with Room Composite Egress.

## Overview

LiveKit [Room Composite Egress](https://docs.livekit.io/room-composite.md) enables recording of all participants' tracks in a room. This document explains its functionality and customization options.

## Built-in LiveKit Recording View

The recording feature in LiveKit is built on a web-based architecture, utilizing a headless Chrome instance to render and capture output. The default view is built using LiveKit's [React Components](https://docs.livekit.io/reference/components/react.md). There are a handful of configuration options available including:

- [layout](https://docs.livekit.io/room-composite.md#Default-layouts) to control how the participants are arranged in the view. (You can set or change the layout using either [`StartRoomCompositeEgress()`](https://docs.livekit.io/home/egress/api.md#startroomcompositeegress) or [`UpdateLayout()`](https://docs.livekit.io/home/egress/api.md#updatelayout).)
- [Encoding options](https://docs.livekit.io/overview.md#EncodingOptions) to control the quality of the audio and/or video captured

For more advanced customization, LiveKit supports configuring the URL of the web application that will generate the page to be recorded, allowing full customization of the recording view.

## Building a Custom Recording View

While you can use any web framework, it's often easiest to start with the built-in React-based application and modify it to meet your requirements. The source code can be found in the [`template-default` folder](https://github.com/livekit/egress/tree/main/template-default/src) of the [LiveKit egress repository](https://github.com/livekit/egress). The main files include:

- [`Room.tsx`](https://github.com/livekit/egress/blob/main/template-default/src/Room.tsx): the main component that renders the recording view
- [`SpeakerLayout.tsx`](https://github.com/livekit/egress/blob/main/template-default/src/SpeakerLayout.tsx), [`SingleSpeakerLayout.tsx`](https://github.com/livekit/egress/blob/main/template-default/src/SingleSpeakerLayout.tsx): components used for the `speaker` and `single-speaker` layouts
- [`App.tsx`](https://github.com/livekit/egress/blob/main/template-default/src/App.tsx), [`index.tsx`](https://github.com/livekit/egress/blob/main/template-default/src/index.tsx): the main entry points for the application
- [`App.css`](https://github.com/livekit/egress/blob/main/template-default/src/App.css), [`index.css`](https://github.com/livekit/egress/blob/main/template-default/src/index.css): the CSS files for the application

> ℹ️ **Note**
> 
> The built-in `Room.tsx` component uses the [template SDK](https://github.com/livekit/egress/tree/main/template-sdk/src/index.ts), for common tasks like:
> 
> - Retrieving query string arguments (Example: [App.tsx](https://github.com/livekit/egress/blob/c665a4346fcc91f0a7a54289c8f897853dd3fc4f/template-default/src/App.tsx#L27-L30))
> - Starting a recording (Example: [Room.tsx](https://github.com/livekit/egress/blob/c665a4346fcc91f0a7a54289c8f897853dd3fc4f/template-default/src/Room.tsx#L81-L86))
> - Ending a recording (Example: [EgressHelper.setRoom()](https://github.com/livekit/egress/blob/ea1daaed50eb506d7586fb15198cd21506ecd457/template-sdk/src/index.ts#L67))
> 
> If you are not using `Room.tsx` as a starting point, be sure to leverage the template SDK to handle these and other common tasks.

### Building your Application

Make a copy of the above files and modify tnem to meet your requirements.

#### Example: Move non-speaking participants to the right side of the Speaker view

By default the `Speaker` view shows the non-speaking participants on the left and the speaker on the right. Let's change this so the speaker is on the left and the non-speaking participants are on the right.

1. Copy the default components and CSS files into a new location
2. Modify `SpeakerLayout.tsx` to move the `FocusLayout` above `CarouselLayout` so it looks like this:

```tsx
return (
    <div className="lk-focus-layout">
      <FocusLayout trackRef={mainTrack as TrackReference} />

      <CarouselLayout tracks={remainingTracks}>
        <ParticipantTile />
      </CarouselLayout>
    </div>
  );

```
3. Modify `App.css` to fix the `grid-template-columns` value (reverse the values). It should look like this:

```css
.lk-focus-layout {
  height: 100%;
  grid-template-columns: 5fr 1fr;
}

```

### Deploying your Application

Once your app is ready for testing or deployment, you'll need to host it on a web server. We recommend using [Vercel](https://vercel.com/) for its simplicity, but many other options are available.

### Testing Your Application

We have created the [`egress test-egress-template`](https://github.com/livekit/livekit-cli?tab=readme-ov-file#testing-egress-templates) subcommand in the [LiveKit CLI](https://github.com/livekit/livekit-cli) to make it easier to test.

The `egress test-egress-template` subcommand:

- Creates a room
- Adds the desired number of virtual publishers who will publish simulated video streams
- Opens a browser instance to your app URL with the correct parameters

Once you have your application deployed, you can use this command to test it out.

#### Usage

```shell
export LIVEKIT_API_SECRET=SECRET
export LIVEKIT_API_KEY=KEY
export LIVEKIT_URL=YOUR_LIVEKIT_URL

lk egress test-template \
  --base-url YOUR_WEB_SERVER_URL \
  --room ROOM_NAME \
  --layout LAYOUT \
  --publishers PUBLISHER_COUNT

```

This command launches a browser and opens: `YOUR_WEB_SERVER_URL?url=<LIVEKIT_INSTANCE WSS URL>&token=<RECORDER TOKEN>&layout=LAYOUT`

#### Example

```shell
export LIVEKIT_API_SECRET=SECRET
export LIVEKIT_API_KEY=KEY
export LIVEKIT_URL=YOUR_LIVEKIT_URL

lk egress test-template \
  --base-url http://localhost:3000/lk-recording-view \
  --room my-room \
  --layout grid \
  --publishers 3

```

This command launches a browser and opens: `http://localhost:3000/lk-recording-view?url=wss%3A%2F%2Ftest-1234567890.livekit.cloud&token=<RECORDER TOKEN>&layout=grid`

### Using the Custom Recording View in Production

Set the `custom_base_url` parameter on the `StartRoomCompositeEgress()` API to the URL where your custom recording application is deployed.

For additional authentication, most customers attach URL parameters to the `custom_base_url`. For example: `https://your-template-url.example.com/?yourparam={auth_info}` (and set this as your `custom_base_url`).

## Recording Process

For those curious about the workflow of a recording, the basic steps are:

1. The `Egress.StartRoomCompositeEgress()` API is invoked
2. LiveKit assigns an available egress instance to handle the request
3. The egress recorder creates necessary connection & authentication details
4. A URL for the rendering web page is constructed with these parameters:- `url`: URL of LiveKit Server
- `token`: Access token for joining the room as a recorder
- `layout`: Desired layout passed to `StartRoomCompositeEgress()`
5. The egress recorder launches a headless Chrome instance with the constructed URL
6. The recorder waits for the web page to log `START_RECORDING` to the console
7. The recording begins
8. The recorder waits for the web page to log `END_RECORDING` to the console
9. The recording is terminated

---

This document was rendered at 2025-09-27T09:36:34.243Z.
For the latest version of this document, see [https://docs.livekit.io/home/egress/custom-template.md](https://docs.livekit.io/home/egress/custom-template.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).