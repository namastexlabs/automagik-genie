LiveKit Docs › LiveKit SDKs › Overview

---

# LiveKit SDKs Overview

> A guide to LiveKit's client and server SDKs for building realtime applications.

## Overview

LiveKit provides a comprehensive ecosystem of SDKs for building realtime applications, including **realtime SDKs** for building user-facing applications, and **server-side SDKs** for backend operations and media processing. The SDKs are designed to work together, and support multiple platforms and languages.

## Realtime SDKs

Realtime SDKs let you build applications that connect to LiveKit rooms and participate in realtime communication. These SDKs handle WebRTC connections, media capture, and room management.

### Web and mobile platforms

These are the primary client platforms used for building realtime applications. Each SDK is optimized for its target platform and provides native integration capabilities.

- **[JavaScript SDK](https://github.com/livekit/client-sdk-js)**: JavaScript/TypeScript SDK for web browsers. Supports all major browsers and provides React hooks for easy integration.

- **[iOS/macOS/visionOS](https://github.com/livekit/client-sdk-swift)**: Native Swift SDK for Apple platforms including iOS, macOS, and visionOS. Optimized for Apple's ecosystem.

- **[Android](https://github.com/livekit/client-sdk-android)**: Native Kotlin SDK for Android applications. Provides comprehensive media handling and room management.

- **[Flutter](https://github.com/livekit/client-sdk-flutter)**: Cross-platform SDK for Flutter applications. Write once, run on iOS, Android, web, and desktop.

- **[React Native](https://github.com/livekit/client-sdk-react-native)**: React Native SDK for building cross-platform mobile applications with JavaScript/TypeScript.

- **[Unity](https://github.com/livekit/client-sdk-unity)**: Unity SDK for game development and virtual reality applications. Supports both native and WebGL builds.

### Additional client platforms

LiveKit also supports specialized platforms and use cases beyond the main web and mobile platforms:

- **[Rust SDK](https://github.com/livekit/rust-sdks)**: For systems programming and embedded applications.
- **[Unity WebGL](https://github.com/livekit/client-sdk-unity-web)**: For web-based Unity applications.
- **[ESP32](https://github.com/livekit/client-sdk-esp32)**: For IoT and embedded devices.

## Server-side SDKs

Server-side SDKs provide backend integration capabilities, enabling you to create programmatic participants, manage rooms, and process media streams. They can also generate access tokens, call server APIs, and receive webhooks.

The Go SDK additionally offers client capabilities, allowing you to build automations that act like end users.

### Core server SDKs

- **[Node.js](https://github.com/livekit/node-sdks)**: JavaScript SDK for Node.js applications. Includes room management, participant control, and webhook handling.

- **[Python](https://github.com/livekit/python-sdks)**: Python SDK for backend applications. Provides comprehensive media processing and room management capabilities.

- **[Golang](https://github.com/livekit/server-sdk-go)**: Go SDK for high-performance server applications. Optimized for scalability and low latency. Includes client capabilities.

- **[Ruby](https://github.com/livekit/server-sdk-ruby)**: Ruby SDK for Ruby on Rails and other Ruby applications. Full-featured server integration.

- **[Java/Kotlin](https://github.com/livekit/server-sdk-kotlin)**: Java and Kotlin SDK for JVM-based applications. Enterprise-ready with comprehensive features.

- **[Rust](https://github.com/livekit/rust-sdks)**: Rust SDK for systems programming and high-performance applications. Memory-safe and fast.

### Community SDKs

- **[PHP](https://github.com/agence104/livekit-server-sdk-php)**: Community-maintained SDK for PHP applications.
- **[.NET](https://github.com/pabloFuente/livekit-server-sdk-dotnet)**: Community-maintained SDK for .NET applications.

## UI Components

LiveKit provides pre-built UI components to accelerate development:

- **[React Components](https://github.com/livekit/components-js)**: React components for video, audio, and chat interfaces. Drop-in components for rapid development.

- **[Android Compose](https://github.com/livekit/components-android)**: Jetpack Compose components for Android applications. Modern UI components for Android development.

- **[SwiftUI](https://github.com/livekit/components-swift)**: SwiftUI components for iOS and macOS applications. Native UI components for Apple platforms.

- **[Flutter](https://github.com/livekit/components-flutter)**: Flutter widgets for cross-platform applications. Reusable UI components for Flutter apps.

## Agents Framework

LiveKit provides the Agents Framework for building AI agents and programmatic participants:

- **[Agents docs](https://docs.livekit.io/agents.md)**: Learn how to build voice AI agents using the Agents Framework.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Voice AI agent quickstart guide. The fastest way to get an agent up and running.

- **[Agents Framework](https://github.com/livekit/agents)**: Python framework for building AI agents and programmatic participants. Production-ready with comprehensive AI integrations.

- **[AgentsJS](https://github.com/livekit/agents-js)**: JavaScript/TypeScript framework for building AI agents. Modern architecture with TypeScript support.

## Telephony Integration

LiveKit's SIP integration enables your applications to connect with traditional phone systems and telephony infrastructure. Server-side SDKs include SIP capabilities for building telephony applications. To learn more, see [SIP](https://docs.livekit.io/sip.md).

## Key features across SDKs

LiveKit SDKs provide a consistent set of features across all platforms, ensuring that your applications work reliably regardless of the target platform. These core capabilities are designed to handle the complexities of realtime communication while providing a simple, unified API.

### Realtime capabilities

Realtime SDKs focus on connecting users to LiveKit rooms and managing realtime communication. These capabilities enable applications to capture, transmit, and receive media streams with minimal latency.

- **Media capture**: Camera, microphone, and screen sharing.
- **Room management**: Join, leave, and manage room participants.
- **Track handling**: Subscribe to and publish audio and video tracks.
- **Data channels**: Realtime messaging between participants.
- **Connection management**: Automatic reconnection and quality adaptation.

### Server-side capabilities

Server-side SDKs provide the infrastructure and control needed to manage LiveKit rooms and participants. These capabilities enable backend applications to orchestrate realtime sessions and process media streams.

- **Room control**: Create, manage, and monitor rooms.
- **Participant management**: Control participant permissions and behavior.
- **Media processing**: Subscribe to and process media streams.
- **Webhook handling**: Respond to room and participant events.
- **Recording**: Capture and store room sessions.

### Cross-platform consistency

All SDKs provide consistent APIs and features across platforms:

- **Unified room model**: Same room concepts across all platforms.
- **Consistent track handling**: Standardized audio and video track management.
- **Shared data APIs**: Common data channel and messaging patterns.
- **Quality adaptation**: Automatic quality adjustment based on network conditions.

## Getting started

To get started with LiveKit SDKs:

1. **Choose your platform**: Select the appropriate client and server SDKs for your use case.
2. **Set up LiveKit**: Deploy LiveKit server or use [LiveKit Cloud](https://livekit.io/cloud).
3. **Build your app**: Use the SDKs to create your realtime application.
4. **Add UI components**: Integrate pre-built components for faster development.
5. **Deploy and scale**: Use LiveKit's production-ready infrastructure.

To get started with LiveKit Agents, see the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

---

This document was rendered at 2025-09-27T09:36:25.411Z.
For the latest version of this document, see [https://docs.livekit.io/home/client.md](https://docs.livekit.io/home/client.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).