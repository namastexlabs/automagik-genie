LiveKit Docs › LiveKit SDKs › Realtime text & data › Sending text

---

# Sending text

> Use text streams to send any amount of text between participants.

## Overview

Text streams provide a simple way to send text between participants in realtime, supporting use cases such as chat, streamed LLM responses, and more. Each individual stream is associated with a topic, and you must register a handler to receive incoming streams for that topic. Streams can target specific participants or the entire room.

To send other kinds of data, use [byte streams](https://docs.livekit.io/home/client/data/byte-streams.md) instead.

## Sending all at once

Use the `sendText` method when the whole string is available up front. The input string is automatically chunked and streamed so there is no limit on string size.

**JavaScript**:

```typescript
const text = 'Lorem ipsum dolor sit amet...';
const info = await room.localParticipant.sendText(text, {
  topic: 'my-topic',
});

console.log(`Sent text with stream ID: ${info.id}`);

```

---

**Swift**:

```swift
let text = "Lorem ipsum dolor sit amet..."
let info = try await room.localParticipant
    .sendText(text, for: "my-topic")

print("Sent text with stream ID: \(info.id)")

```

---

**Python**:

```python
text = 'Lorem ipsum dolor sit amet...'
info = await room.local_participant.send_text(text, 
  topic='my-topic'
)
print(f"Sent text with stream ID: {info.stream_id}")

```

---

**Rust**:

```rust
let text = "Lorem ipsum dolor sit amet...";
let options = StreamTextOptions {
    topic: "my-topic".to_string(),
    ..Default::default()
};
let info = room.local_participant()
    .send_text(&text, options).await?;

println!("Sent text with stream ID: {}", info.id);

```

---

**Node.js**:

```typescript
const text = 'Lorem ipsum dolor sit amet...';
const info = await room.localParticipant.sendText(text, {
  topic: 'my-topic',
});

console.log(`Sent text with stream ID: ${info.id}`);

```

---

**Go**:

```go
text := "Lorem ipsum dolor sit amet..."
info := room.LocalParticipant.SendText(text, livekit.StreamTextOptions{
  Topic: "my-topic",
})

fmt.Printf("Sent text with stream ID: %s\n", info.ID)

```

---

**Android**:

```kotlin
val text = "Lorem ipsum dolor sit amet..."
val result = room.localParticipant.sendText(text, StreamTextOptions(topic = "my-topic"))

result.onSuccess { info ->
  Log.i("Datastream", "sent text id: ${info.id}")
}

```

---

**Flutter**:

```dart
var info = await room.localParticipant?.sendText('Lorem ipsum dolor sit amet...',
    options: SendTextOptions(
      topic: 'chat',
    ));

```

## Streaming incrementally

If your text is generated incrementally, use `streamText` to open a stream writer. You must explicitly close the stream when you are done sending data.

**JavaScript**:

```typescript
const streamWriter = await room.localParticipant.streamText({
  topic: 'my-topic',
});   

console.log(`Opened text stream with ID: ${streamWriter.info.id}`);

// In a real app, you would generate this text asynchronously / incrementally as well
const textChunks = ["Lorem ", "ipsum ", "dolor ", "sit ", "amet..."]
for (const chunk of textChunks) {
  await streamWriter.write(chunk)
}

// The stream must be explicitly closed when done
await streamWriter.close(); 

console.log(`Closed text stream with ID: ${streamWriter.info.id}`);

```

---

**Swift**:

```swift
let writer = try await room.localParticipant
    .streamText(for: "my-topic")

print("Opened text stream with ID: \(writer.info.id)")

// In a real application, you might receive chunks of text from an LLM or other source
let textChunks = ["Lorem ", "ipsum ", "dolor ", "sit ", "amet..."]
for chunk in textChunks {
    try await writer.write(chunk)
}

// The stream must be explicitly closed when done
try await writer.close()

print("Closed text stream with ID: \(writer.info.id)")

```

---

**Python**:

```python
writer = await room.local_participant.stream_text(
    topic="my-topic",
)

print(f"Opened text stream with ID: {writer.stream_id}")

# In a real application, you might receive chunks of text from an LLM or other source
text_chunks = ["Lorem ", "ipsum ", "dolor ", "sit ", "amet..."]
for chunk in text_chunks:
    await writer.write(chunk)

await writer.close()

print(f"Closed text stream with ID: {writer.stream_id}")

```

---

**Rust**:

```rust
let options = StreamTextOptions {
    topic: "my-topic".to_string(),
    ..Default::default()
};
let stream_writer = room.local_participant()
    .stream_text(options).await?;

let id = stream_writer.info().id.clone();
println!("Opened text stream with ID: {}", id);

let text_chunks = ["Lorem ", "ipsum ", "dolor ", "sit ", "amet..."];
for chunk in text_chunks {
    stream_writer.write(&chunk).await?;
}
// The stream can be closed explicitly or will be closed implicitly
// when the last writer is dropped
stream_writer.close().await?;

println!("Closed text stream with ID: {}", id);

```

---

**Node.js**:

```typescript
const streamWriter = await room.localParticipant.streamText({
  topic: 'my-topic',
});   

console.log(`Opened text stream with ID: ${streamWriter.info.id}`);

// In a real app, you would generate this text asynchronously / incrementally as well
const textChunks = ["Lorem ", "ipsum ", "dolor ", "sit ", "amet..."]
for (const chunk of textChunks) {
  await streamWriter.write(chunk)
}

// The stream must be explicitly closed when done
await streamWriter.close(); 

console.log(`Closed text stream with ID: ${streamWriter.info.id}`);

```

---

**Go**:

```go
// In a real application, you would generate this text asynchronously / incrementally as well
textChunks := []string{"Lorem ", "ipsum ", "dolor ", "sit ", "amet..."}

writer := room.LocalParticipant.SendText(livekit.StreamTextOptions{
  Topic: "my-topic",
})

for i, chunk := range textChunks {
  // Close the stream when the last chunk is sent
  onDone := func() {
    if i == len(textChunks) - 1 {
      writer.Close()
    }
  } 
  writer.Write(chunk, onDone)
}

fmt.Printf("Closed text stream with ID: %s\n", writer.Info.ID)

```

---

**Android**:

```kotlin
val streamWriter = room.localParticipant.streamText(StreamTextOptions(topic = "my-topic"))
val textChunks = listOf("Lorem ", "ipsum ", "dolor ", "sit ", "amet...")
for (chunk in textChunks) {
    streamWriter.write(chunk)
}
streamWriter.close()

```

---

**Flutter**:

```dart
var stream = await room.localParticipant?.streamText(StreamTextOptions(
    topic: 'my-topic',
  ));

var chunks = ['Lorem ', 'ipsum ', 'dolor ', 'sit ', 'amet...'];
for (var chunk in chunks) {
   write each chunk to the stream
  await stream?.write(chunk);
}

// close the stream to signal that no more data will be sent
await stream?.close();

```

## Handling incoming streams

Whether the data was sent with `sendText` or `streamText`, it is always received as a stream. You must register a handler to receive it.

**JavaScript**:

```typescript
room.registerTextStreamHandler('my-topic', (reader, participantInfo) => {
  const info = reader.info;
  console.log(
    `Received text stream from ${participantInfo.identity}\n` +
    `  Topic: ${info.topic}\n` +
    `  Timestamp: ${info.timestamp}\n` +
    `  ID: ${info.id}\n` +
    `  Size: ${info.size}` // Optional, only available if the stream was sent with `sendText`
  );  

  // Option 1: Process the stream incrementally using a for-await loop.
  for await (const chunk of reader) {
    console.log(`Next chunk: ${chunk}`);
  }

  // Option 2: Get the entire text after the stream completes.
  const text = await reader.readAll();
  console.log(`Received text: ${text}`);
});

```

---

**Swift**:

```swift
try await room.localParticipant
    .registerTextStreamHandler(for: "my-topic") { reader, participantIdentity in
        let info = reader.info

        print("""
            Text stream received from \(participantIdentity)
            Topic: \(info.topic)
            Timestamp: \(info.timestamp)
            ID: \(info.id)
            Size: \(info.size) (only available if the stream was sent with `sendText`)
            """)

        // Option 1: Process the stream incrementally using a for-await loop
        for try await chunk in reader {
            print("Next chunk: \(chunk)")
        }

        // Option 2: Get the entire text after the stream completes
        let text = try await reader.readAll()
        print("Received text: \(text)")
    }

```

---

**Python**:

```python
import asyncio

# Store active tasks to prevent garbage collection
_active_tasks = set()

async def async_handle_text_stream(reader, participant_identity):
    info = reader.info

    print(
        f'Text stream received from {participant_identity}\n'
        f'  Topic: {info.topic}\n'
        f'  Timestamp: {info.timestamp}\n'
        f'  ID: {info.id}\n'
        f'  Size: {info.size}'  # Optional, only available if the stream was sent with `send_text`
    )

    # Option 1: Process the stream incrementally using an async for loop.
    async for chunk in reader:
        print(f"Next chunk: {chunk}")

    # Option 2: Get the entire text after the stream completes.
    text = await reader.read_all()
    print(f"Received text: {text}")
  
def handle_text_stream(reader, participant_identity):
    task = asyncio.create_task(async_handle_text_stream(reader, participant_identity))
    _active_tasks.add(task)
    task.add_done_callback(lambda t: _active_tasks.remove(t))

room.register_text_stream_handler(
    "my-topic",
    handle_text_stream
)

```

---

**Rust**:

The Rust API differs slightly from the other SDKs. Instead of registering a topic handler, you handle the `TextStreamOpened` room event and take the reader from the event if you wish to handle the stream.

```rust
while let Some(event) = room.subscribe().recv().await {
    match event {
        RoomEvent::TextStreamOpened { reader, topic, participant_identity } => {
            if topic != "my-topic" { continue };
            let Some(mut reader) = reader.take() else { continue };
            let info = reader.info();

            println!("Text stream received from {participant_identity}");
            println!("  Topic: {}", info.topic);
            println!("  Timestamp: {}", info.timestamp);
            println!("  ID: {}", info.id);
            println!("  Size: {:?}", info.total_length);

            // Option 1: Process the stream incrementally as a Stream
            //           using `TryStreamExt` from the `futures_util` crate
            while let Some(chunk) = reader.try_next().await? {
                println!("Next chunk: {chunk}");
            }

            // Option 2: Get the entire text after the stream completes
            let text = reader.read_all().await?;
            println!("Received text: {text}");
        }
        _ => {}
    }
}

```

---

**Node.js**:

```typescript
room.registerTextStreamHandler('my-topic', (reader, participantInfo) => {
  const info = reader.info;
  console.log(
    `Received text stream from ${participantInfo.identity}\n` +
    `  Topic: ${info.topic}\n` +
    `  Timestamp: ${info.timestamp}\n` +
    `  ID: ${info.id}\n` +
    `  Size: ${info.size}` // Optional, only available if the stream was sent with `sendText`
  );  

  // Option 1: Process the stream incrementally using a for-await loop.
  for await (const chunk of reader) {
    console.log(`Next chunk: ${chunk}`);
  }

  // Option 2: Get the entire text after the stream completes.
  const text = await reader.readAll();
  console.log(`Received text: ${text}`);
});

```

---

**Go**:

```go
room.RegisterTextStreamHandler(
  "my-topic",
  func(reader livekit.TextStreamReader, participantIdentity livekit.ParticipantIdentity) {
    fmt.Printf("Text stream received from %s\n", participantIdentity)

    // Option 1: Process the stream incrementally
    res := ""
		for {
      // ReadString takes a delimiter
			word, err := reader.ReadString(' ')
			fmt.Printf("read word: %s\n", word)
			res += word
			if err != nil {
				// EOF represents the end of the stream
				if err == io.EOF {
					break
				} else {
					fmt.Printf("failed to read text stream: %v\n", err)
					break
				}
			}
		}
    // Similar to ReadString, there is Read(p []bytes), ReadByte(), ReadBytes(delim byte) and ReadRune() as well
    // All of these methods return io.EOF when the stream is closed
    // If the stream has no data, it will block until there is data or the stream is closed
    // If the stream has data, but not as much as requested, it will return what is available without any error

    // Option 2: Get the entire text after the stream completes
    text := reader.ReadAll()
    fmt.Printf("received text: %s\n", text)
  },
)

```

---

**Android**:

```kotlin
room.registerTextStreamHandler("my-topic") { reader, info ->
  myCoroutineScope.launch {
      val info = reader.info
      Log.i("Datastream", "info stuff")
      // Option 1: process incrementally
      reader.flow.collect { chunk ->
          Log.i("Datastream", "Next chunk: $chunk")
      }
      // Option 2
      val text = reader.readAll()
      Log.i("DataStream", "Received text ${text.joinToString()}")
  }
}

```

---

**Flutter**:

```dart
room.registerTextStreamHandler('chat',
    (TextStreamReader reader, String participantIdentity) async {
  var text = await reader.readAll();
  print('received chat message from $participantIdentity: $text');
});

```

## Stream properties

These are all of the properties available on a text stream, and can be set from the send/stream methods or read from the handler.

| Property | Description | Type |
| `id` | Unique identifier for this stream. | string |
| `topic` | Topic name used to route the stream to the appropriate handler. | string |
| `timestamp` | When the stream was created. | number |
| `size` | Total expected size in bytes (UTF-8), if known. | number |
| `attributes` | Additional attributes as needed for your application. | string dict |
| `destinationIdentities` | Identities of the participants to send the stream to. If empty, is sent to all. | array |

## Concurrency

Multiple streams can be written or read concurrently. If you call `sendText` or `streamText` multiple times on the same topic, the recipient's handler will be invoked multiple times, once for each stream. These invocations will occur in the same order as the streams were opened by the sender, and the stream readers will be closed in the same order in which the streams were closed by the sender.

## Joining mid-stream

Participants who join a room after a stream has been initiated will not receive any of it. Only participants connected at the time the stream is opened are eligible to receive it.

## No message persistence

LiveKit does not include long-term persistence for text streams. All data is transmitted in real-time between connected participants only. If you need message history, you'll need to implement storage yourself using a database or other persistence layer.

## Chat components

LiveKit provides pre-built React components for common text streaming use cases like chat. For details, see the [Chat component](https://docs.livekit.io/reference/components/react/component/chat.md) and [useChat hook](https://docs.livekit.io/reference/components/react/hook/usechat.md).

> ℹ️ **Note**
> 
> Streams are a simple and powerful way to send text, but if you need precise control over individual packet behavior, the lower-level [data packets](https://docs.livekit.io/home/client/data/packets.md) API may be more appropriate.

---

This document was rendered at 2025-09-27T09:36:27.144Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/data/text-streams.md](https://docs.livekit.io/home/client/data/text-streams.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).