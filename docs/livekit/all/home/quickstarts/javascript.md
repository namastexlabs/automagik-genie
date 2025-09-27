LiveKit Docs › LiveKit SDKs › Platform-specific quickstarts › JavaScript

---

# JavaScript quickstart (web)

> Get started with LiveKit and JavaScript

> 💡 **Tip**
> 
> Check out the dedicated quickstarts for [React](https://docs.livekit.io/home/quickstarts/react.md) or [Next.js](https://docs.livekit.io/home/quickstarts/nextjs.md) if you're using one of those platforms.

## Voice AI quickstart

To build your first voice AI app for web, use the following quickstart and the starter app. Otherwise follow the getting started guide below.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Create a voice AI agent in less than 10 minutes.

- **[Next.js Voice Agent](https://github.com/livekit-examples/agent-starter-react)**: A web voice AI assistant built with React and Next.js.

## Getting started guide

This guide covers the basics to connect to LiveKit from a JavaScript app.

### Install LiveKit SDK

Install the LiveKit SDK:

**yarn**:

```shell
yarn add livekit-client

```

---

**npm**:

```shell
npm install livekit-client --save

```

### Join a room

Note that this example hardcodes a token. In a real app, you’ll need your server to generate a token for you.

```js
import { Room } from 'livekit-client';

const wsURL = '%{wsURL}%';
const token = '%{token}%';

const room = new Room();
await room.connect(wsURL, token);
console.log('connected to room', room.name);

// Publish local camera and mic tracks
await room.localParticipant.enableCameraAndMicrophone();

```

## Next steps

The following resources are useful for getting started with LiveKit in a JavaScript app.

- **[Generating tokens](https://docs.livekit.io/home/server/generating-tokens.md)**: Guide to generating authentication tokens for your users.

- **[Realtime media](https://docs.livekit.io/home/client/tracks.md)**: Complete documentation for live video and audio tracks.

- **[Realtime data](https://docs.livekit.io/home/client/data.md)**: Send and receive realtime data between clients.

- **[JavaScript SDK](https://github.com/livekit/client-sdk-js)**: LiveKit JavaScript SDK on GitHub.

- **[React components](https://github.com/livekit/components-js)**: LiveKit React components on GitHub.

- **[JavaScript SDK reference](https://docs.livekit.io/reference/client-sdk-js.md)**: LiveKit JavaScript SDK reference docs.

- **[React components reference](https://docs.livekit.io/reference/components/react.md)**: LiveKit React components reference docs.

---

This document was rendered at 2025-09-27T09:36:38.723Z.
For the latest version of this document, see [https://docs.livekit.io/home/quickstarts/javascript.md](https://docs.livekit.io/home/quickstarts/javascript.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).