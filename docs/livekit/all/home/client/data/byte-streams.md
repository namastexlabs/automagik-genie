LiveKit Docs › LiveKit SDKs › Realtime text & data › Sending files & bytes

---

# Sending files & bytes

> Use byte streams to send files, images, or any other kind of data between participants.

## Overview

Byte streams provide a simple way to send files, images, or other binary data between participants in realtime. Each individual stream is associated with a topic, and you must register a handler to receive incoming streams for that topic. Streams can target specific participants or the entire room.

To send text data, use [text streams](https://docs.livekit.io/home/client/data/text-streams.md) instead.

## Sending files

To send a file or an image, use the `sendFile` method. Precise support varies by SDK, as this is integrated with the platform's own file APIs.

**JavaScript**:

```typescript
// Send a `File` object
const file = ($('file') as HTMLInputElement).files?.[0]!; 
const info = await room.localParticipant.sendFile(file, {
  mimeType: file.type,
  topic: 'my-topic',

  // Optional, allows progress to be shown to the user
  onProgress: (progress) => console.log('sending file, progress', Math.ceil(progress * 100)), 
});
console.log(`Sent file with stream ID: ${info.id}`);

```

---

**Swift**:

```swift
// Send a file from disk by specifying its path
let fileURL = URL(filePath: "path/to/file.jpg")
let info = try await room.localParticipant
    .sendFile(fileURL, for: "my-topic")

print("Sent file with stream ID: \(info.id)")

```

---

**Python**:

```python
# Send a file from disk by specifying its path
info = await room.local_participant.send_file(
  file_path="path/to/file.jpg",
  topic="my-topic",
)
print(f"Sent file with stream ID: {info.stream_id}")

```

---

**Rust**:

```rust
let options = StreamByteOptions {
    topic: "my-topic".to_string(),
    ..Default::default()
};
let info = room.local_participant()
    .send_file("path/to/file.jpg", options).await?;

println!("Sent file with stream ID: {}", info.id);

```

---

**Node.js**:

```typescript
// Send a file from disk by specifying its path
const info = await room.localParticipant.sendFile("path/to/file.jpg", {
  topic: "my-topic",
});
console.log(`Sent file with stream ID: ${info.id}`);

```

---

**Go**:

```go
filePath := "path/to/file.jpg"
info, err := room.LocalParticipant.SendFile(filePath, livekit.StreamBytesOptions{
  Topic: "my-topic",
  FileName: &filePath,
})
if err != nil {
  fmt.Printf("failed to send file: %v\n", err)
}
fmt.Printf("Sent file with stream ID: %s\n", info.ID)

```

---

**Android**:

```kotlin
val file = File("path/to/file.jpg")
val result = room.localParticipant.sendFile(file, StreamBytesOptions(topic = "my-topic"))
result.onSuccess { info ->
    Log.i("Datastream", "sent file id: ${info.id}")
}

```

---

**Flutter**:

```dart
final fileToSend = File('path/to/file.jpg');
var info = await room.localParticipant?.sendFile(fileToSend,
    options: SendFileOptions(
      topic: 'my-topic',
      onProgress: (p0) {
        // progress is a value between 0 and 1
        // it indicates the progress of the file transfer
        print('progress: ${p0 * 100} %');
      },
    )
);
print('Sent file with stream ID: ${info['id']}');

```

## Streaming bytes

To stream any kind of binary data, open a stream writer with the `streamBytes` method. You must explicitly close the stream when you are done sending data.

**Swift**:

```swift
let writer = try await room.localParticipant
    .streamBytes(for: "my-topic")

print("Opened byte stream with ID: \(writer.info.id)")

// Example sending arbitrary binary data
// For sending files, use `sendFile` instead
let dataChunks = [Data([0x00, 0x01]), Data([0x03, 0x04])]
for chunk in dataChunks {
    try await writer.write(chunk)
}

// The stream must be explicitly closed when done
try await writer.close()

print("Closed byte stream with ID: \(writer.info.id)")

```

---

**Python**:

```python
writer = await self.stream_bytes(
    # All byte streams must have a name, which is like a filename
    name="my-byte-stream",

    # The topic must match the topic used in the receiver's `register_byte_stream_handler`
    topic="my-topic",
)

print(f"Opened byte stream with ID: {writer.stream_id}")

chunk_size = 15000 # 15KB, a recommended max chunk size

# This an example to send a file, but you can send any kind of binary data
async with aiofiles.open(file_path, "rb") as f:
    while bytes := await f.read(chunk_size):
        await writer.write(bytes)

await writer.aclose()

```

---

**Rust**:

```rust
let options = StreamByteOptions {
    topic: "my-topic".to_string(),
    ..Default::default()
};
let stream_writer = room.local_participant()
    .stream_bytes(options).await?;

let id = stream_writer.info().id.clone();
println!("Opened text stream with ID: {}", id);

// Example sending arbitrary binary data
// For sending files, use `send_file` instead
let data_chunks = [[0x00, 0x01], [0x03, 0x04]];
for chunk in data_chunks {
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
const writer = await room.localParticipant.streamBytes({
  // All byte streams must have a name, which is like a filename
  name: "my-byte-stream",

  // The topic must match the topic used in the receiver's `registerByteStreamHandler`
  topic: "my-topic",
});

console.log(`Opened byte stream with ID: ${writer.info.id}`);

const chunkSize = 15000; // 15KB, a recommended max chunk size

// This is an example to send a file, but you can send any kind of binary data
const fileStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

for await (const chunk of fileStream) {
  await writer.write(chunk);
}

await writer.close();

```

---

**Go**:

```go
writer := room.LocalParticipant.StreamBytes(livekit.StreamBytesOptions{
  Topic: "my-topic",
})

// Use the writer to send data
// onDone is called when a chunk is sent
// writer can be closed in onDone of the last chunk
writer.Write(data, onDone)

// Close the writer when done, if you haven't already
writer.Close()

```

---

**Android**:

```kotlin
val writer = room.localParticipant.streamBytes(StreamBytesOptions(topic = "my-topic"))
Log.i("Datastream", "id: ${writer.info.id}")
val dataChunks = listOf(byteArrayOf(0x00, 0x01), byteArrayOf(0x02, 0x03))
for (chunk in dataChunks) {
    writer.write(chunk)
}
writer.close()

```

---

**Flutter**:

```dart
var stream = await room.localParticipant?.streamText(StreamTextOptions(
  topic: 'my-topic',
));

var chunks = ['Lorem ', 'ipsum ', 'dolor ', 'sit ', 'amet...'];
for (var chunk in chunks) {
  // write each chunk to the stream
  await stream?.write(chunk);
}

// close the stream to signal that no more data will be sent
await stream?.close();

```

## Handling incoming streams

Whether the data was sent as a file or a stream, it is always received as a stream. You must register a handler to receive it.

**JavaScript**:

```typescript
room.registerByteStreamHandler('my-topic', (reader, participantInfo) => {
  const info = reader.info;

  // Optional, allows you to display progress information if the stream was sent with `sendFile`
  reader.onProgress = (progress) => {
    console.log(`"progress ${progress ? (progress * 100).toFixed(0) : 'undefined'}%`);
  };

  // Option 1: Process the stream incrementally using a for-await loop.
  for await (const chunk of reader) {
    // Collect these however you want. 
    console.log(`Next chunk: ${chunk}`); 
  }

  // Option 2: Get the entire file after the stream completes.
  const result = new Blob(await reader.readAll(), { type: info.mimeType });

  console.log(
    `File "${info.name}" received from ${participantInfo.identity}\n` +
    `  Topic: ${info.topic}\n` +
    `  Timestamp: ${info.timestamp}\n` +
    `  ID: ${info.id}\n` +
    `  Size: ${info.size}` // Optional, only available if the stream was sent with `sendFile`
  );
});

```

---

**Swift**:

```swift
try await room.localParticipant
    .registerByteStreamHandler(for: "my-topic") { reader, participantIdentity in
        let info = reader.info

        // Option 1: Process the stream incrementally using a for-await loop
        for try await chunk in reader {
            // Collect these however you want
            print("Next chunk received: \(chunk.count) bytes")
        }

        // Option 2: Get the entire file after the stream completes
        let data = try await reader.readAll()

        // Option 3: Write the stream to a local file on disk as it arrives
        let fileURL = try await reader.writeToFile()
        print("Wrote file to: \(fileURL)")

        print("""
            File "\(info.name ?? "unnamed")" received from \(participantIdentity)
            Topic: \(info.topic)
            Timestamp: \(info.timestamp)
            ID: \(info.id)
            Size: \(info.size) (only available if the stream was sent with `sendFile`)
            """)
    }

```

---

**Python**:

```python
import asyncio

# Store active tasks to prevent garbage collection
_active_tasks = []

async def async_handle_byte_stream(reader, participant_identity):
    info = reader.info

    # Read the stream to a file
    with open(reader.info["name"], mode="wb") as f:
        async for chunk in reader:
            f.write(chunk)

        f.close()

    print(
        f'File "{info.name}" received from {participant_identity}\n'
        f'  Topic: {info.topic}\n'
        f'  Timestamp: {info.timestamp}\n'
        f'  ID: {info.id}\n'
        f'  Size: {info.size}'  # Optional, only available if the stream was sent with `send_file`
    )

def handle_byte_stream(reader, participant_identity):
    task = asyncio.create_task(async_handle_byte_stream(reader, participant_identity))
    _active_tasks.append(task)
    task.add_done_callback(lambda t: _active_tasks.remove(t))

room.register_byte_stream_handler(
    "my-topic",
    handle_byte_stream
)

```

---

**Rust**:

The Rust API differs slightly from the other SDKs. Instead of registering a topic handler, you handle the `ByteStreamOpened` room event and take the reader from the event if you wish to handle the stream.

```rust
while let Some(event) = room.subscribe().recv().await {
    match event {
        RoomEvent::ByteStreamOpened { reader, topic, participant_identity } => {
            if topic != "my-topic" { continue };
            let Some(mut reader) = reader.take() else { continue };
            let info = reader.info();

            // Option 1: Process the stream incrementally as a Stream
            //           using `TryStreamExt` from the `futures_util` crate
            while let Some(chunk) = reader.try_next().await? {
                println!("Next chunk: {:?}", chunk);
            }

            // Option 2: Get the entire file after the stream completes
            let data = reader.read_all().await?;

            // Option 3: Write the stream to a local file on disk as it arrives
            let file_path = reader.write_to_file().await?;
            println!("Wrote file to: {}", file_path.display());

            println!("File '{}' received from {}", info.name, participant_identity);
            println!("  Topic: {}", info.topic);
            println!("  Timestamp: {}", info.timestamp);
            println!("  ID: {}", info.id);
            println!("  Size: {:?}", info.total_length); // Only available when sent with `send_file`
        }
        _ => {}
    }
}

```

---

**Node.js**:

```typescript
room.registerByteStreamHandler('my-topic', (reader, participantInfo) => {
  const info = reader.info;

  // Option 1: Process the stream incrementally using a for-await loop.
  for await (const chunk of reader) {
    // Collect these however you want. 
    console.log(`Next chunk: ${chunk}`); 
  }

  // Option 2: Get the entire file after the stream completes.
  const result = new Blob(await reader.readAll(), { type: info.mimeType });

  console.log(
    `File "${info.name}" received from ${participantInfo.identity}\n` +
    `  Topic: ${info.topic}\n` +
    `  Timestamp: ${info.timestamp}\n` +
    `  ID: ${info.id}\n` +
    `  Size: ${info.size}` // Optional, only available if the stream was sent with `sendFile`
  );
});

```

---

**Go**:

```go
room.RegisterByteStreamHandler(
  "my-topic",
  func(reader livekit.ByteStreamReader, participantIdentity livekit.ParticipantIdentity) {
    fmt.Printf("Byte stream received from %s\n", participantIdentity)

    // Option 1: Process the stream incrementally
    res := []byte{}
    for {
      chunk := make([]byte, 1024)
      n, err := reader.Read(chunk)
      res = append(res, chunk[:n]...)
      if err != nil {
        if err == io.EOF {
          break
        } else {
          fmt.Printf("failed to read byte stream: %v\n", err)
          break
        }
      }
    }
    // Similar to Read, there is ReadByte(), ReadBytes(delim byte)

    // Option 2: Get the entire stream after it completes
    data := reader.ReadAll()
    fmt.Printf("received data: %v\n", data)
  },
)

```

---

**Android**:

```kotlin
room.registerByteStreamHandler("my-topic") { reader, info ->
  myCoroutineScope.launch {
      val info = reader.info
      Log.i("Datastream", "info stuff")
      // Option 1: process incrementally
      reader.flow.collect { chunk ->
          Log.i("Datastream", "Next chunk received: ${chunk.size} bytes")
      }
      // Option 2
      val data = reader.readAll()
      val dataSize = data.fold(0) { sum, next -> sum + next.size }
      Log.i("DataStream", "Received data: total $dataSize bytes")
  }
}

```

---

**Flutter**:

```dart
// for incoming text streams 
room.registerTextStreamHandler('my-topic',
    (TextStreamReader reader, String participantIdentity) async {
  var text = await reader.readAll();
  print('Received text: $text');
});

// for receiving files
room.registerByteStreamHandler('my-topic',
        (ByteStreamReader reader, String participantIdentity) async {
    // Get the entire file after the stream completes.
    var file = await reader.readAll();

    // Write a file to local path
    var writeFile = File('path/to/copy-${reader.info!.name}');
      
    // Merge all chunks to content
    var content = file.expand((element) => element).toList();

    // Write content to the file.
    writeFile.writeAsBytesSync(content);
  });

```

## Stream properties

These are all of the properties available on a text stream, and can be set from the send/stream methods or read from the handler.

| Property | Description | Type |
| `id` | Unique identifier for this stream. | string |
| `topic` | Topic name used to route the stream to the appropriate handler. | string |
| `timestamp` | When the stream was created. | number |
| `mimeType` | The MIME type of the stream data. Auto-detected for files, otherwise defaults to `application/octet-stream`. | string |
| `name` | The name of the file being sent. | string |
| `size` | Total expected size in bytes, if known. | number |
| `attributes` | Additional attributes as needed for your application. | string dict |
| `destinationIdentities` | Identities of the participants to send the stream to. If empty, will be sent to all. | array |

## Concurrency

Multiple streams can be written or read concurrently. If you call `sendFile` or `streamBytes` multiple times on the same topic, the recipient's handler will be invoked multiple times, once for each stream. These invocations will occur in the same order as the streams were opened by the sender, and the stream readers will be closed in the same order in which the streams were closed by the sender.

## Joining mid-stream

Participants who join a room after a stream has been initiated will not receive any of it. Only participants connected at the time the stream is opened are eligible to receive it.

## Chunk sizes

The processes for writing and reading streams are optimized separately. This means the number and size of chunks sent may not match the number and size of those received. However, the full data received is guaranteed to be complete and in order. Chunks are generally smaller than 15kB.

> ℹ️ **Note**
> 
> Streams are a simple and powerful way to send data, but if you need precise control over individual packet behavior, the lower-level [data packets](https://docs.livekit.io/home/client/data/packets.md) API may be more appropriate.

---

This document was rendered at 2025-09-27T09:36:26.265Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/data/byte-streams.md](https://docs.livekit.io/home/client/data/byte-streams.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).