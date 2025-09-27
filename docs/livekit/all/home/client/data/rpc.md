LiveKit Docs › LiveKit SDKs › Realtime text & data › Remote method calls

---

# Remote method calls (RPC)

> Use RPC to execute custom methods on other participants in the room and await a response.

## Overview

With RPC your application can define methods on one participant that can be invoked remotely by other participants within a room, and may return a response. This feature can be used to request data, coordinate application-specific state, and more. When used to [forward tool calls](https://docs.livekit.io/agents/build/tools.md#forwarding) from an AI Agent, your LLM can directly access data or manipulate UI in your application's frontend.

## Method registration

First register the method at the destination participant with `localParticipant.registerRpcMethod` and provide the method's name and a handler function.  Any number of methods can be registered on a single participant.

**JavaScript**:

```typescript
localParticipant.registerRpcMethod(
  'greet',
  async (data: RpcInvocationData) => {
    console.log(`Received greeting from ${data.callerIdentity}: ${data.payload}`);
    return `Hello, ${data.callerIdentity}!`;
  }
);

```

---

**Python**:

```python
@room.local_participant.register_rpc_method("greet")
async def handle_greet(data: RpcInvocationData):
    print(f"Received greeting from {data.caller_identity}: {data.payload}")
    return f"Hello, {data.caller_identity}!"

```

---

**Node.js**:

```typescript
localParticipant.registerRpcMethod(
  'greet',
  async (data: RpcInvocationData) => {
    console.log(`Received greeting from ${data.callerIdentity}: ${data.payload}`);
    return `Hello, ${data.callerIdentity}!`;
  }
);

```

---

**Rust**:

```rust
room.local_participant().register_rpc_method(
    "greet".to_string(),
    |data| {
        Box::pin(async move {
            println!(
                "Received greeting from {}: {}",
                data.caller_identity,
                data.payload
            );
            return Ok("Hello, ".to_string() + &data.caller_identity);
        })
    },
);

```

---

**Android**:

```kotlin
localParticipant.registerRpcMethod(
    "greet"
) { data ->
    println("Received greeting from ${data.callerIdentity}: ${data.payload}")
    "Hello, ${data.callerIdentity}!"
}

```

---

**Swift**:

```swift
localParticipant.registerRpcMethod("greet") { data in
    print("Received greeting from \(data.callerIdentity): \(data.payload)")
    return "Hello, \(data.callerIdentity)!"
}

```

---

**Go**:

```go
greetHandler := func(data livekit.RpcInvocationData) (string, error) {
  fmt.Printf("Received greeting from %s: %s\n", data.CallerIdentity, data.Payload)
  return "Hello, " + data.CallerIdentity + "!", nil
}
room.LocalParticipant.RegisterRpcMethod("greet", greetHandler)

```

## Method invocation

Use `localParticipant.performRpc` to invoke the registered RPC method on a remote participant by providing the destination participant's identity, the method name, and the payload. This is an asynchronous operation that returns a string, and may raise an error.

**JavaScript**:

```typescript
try {
  const response = await localParticipant.performRpc({
    destinationIdentity: 'recipient-identity',
    method: 'greet',
    payload: 'Hello from RPC!',
  });
  console.log('RPC response:', response);
} catch (error) {
  console.error('RPC call failed:', error);
}

```

---

**Python**:

```python
try:
  response = await room.local_participant.perform_rpc(
    destination_identity='recipient-identity',
    method='greet',
    payload='Hello from RPC!'
  )
  print(f"RPC response: {response}")
except Exception as e:
  print(f"RPC call failed: {e}")

```

---

**Node.js**:

```typescript
try {
  const response = await localParticipant.performRpc({
    destinationIdentity: 'recipient-identity',
    method: 'greet',
    payload: 'Hello from RPC!',
  });
  console.log('RPC response:', response);
} catch (error) {
  console.error('RPC call failed:', error);
}

```

---

**Rust**:

```rust
match room
    .local_participant()
    .perform_rpc(PerformRpcParams {
        destination_identity: "recipient-identity".to_string(),
        method: "greet".to_string(),
        payload: "Hello from RPC!".to_string(),
        ..Default::default()
    })
    .await
{
    Ok(response) => {
        println!("RPC response: {}", response);
    }
    Err(e) => log::error!("RPC call failed: {:?}", e),
}

```

---

**Android**:

```kotlin
try {
    val response = localParticipant.performRpc(
        destinationIdentity = "recipient-identity",
        method = "greet",
        payload = "Hello from RPC!"
    ).await()
    println("RPC response: $response")
} catch (e: RpcError) {
    println("RPC call failed: $e")
}

```

---

**Swift**:

```swift
do {
    let response = try await localParticipant.performRpc(
      destinationIdentity: "recipient-identity",
      method: "greet",
      payload: "Hello from RPC!"
    )
    print("RPC response: \(response)")
} catch let error as RpcError {
    print("RPC call failed: \(error)")
}

```

---

**Go**:

```go
res, err := room.LocalParticipant.PerformRpc(livekit.PerformRpcParams{
  DestinationIdentity: "recipient-identity",
  Method: "greet",
  Payload: "Hello from RPC!",
})
if err != nil {
  fmt.Printf("RPC call failed: %v\n", err)
}
fmt.Printf("RPC response: %s\n", res)

```

## Method names

Method names can be any string, up to 64 bytes long (UTF-8).

## Payload format

RPC requests and responses both support a string payload, with a maximum size of 15KiB (UTF-8). You may use any format that makes sense, such as JSON or base64-encoded data.

## Response timeout

`performRpc` uses a timeout to hang up automatically if the response takes too long. The default timeout is 10 seconds, but you are free to change it as needed in your `performRpc` call. In general, you should set a timeout that is as short as possible while still satisfying your use case.

The timeout you set is used for the entire duration of the request, including network latency. This means the timeout the handler is provided will be shorter than the overall timeout.

## Errors

`performRpc` will return certain built-in errors (detailed below), or your own custom errors generated in your remote method handler.

To return a custom error to the caller, handlers should throw an error of the type `RpcError` with the following properties:

- `code`: A number that indicates the type of error. Codes 1001-1999 are reserved for LiveKit internal errors.
- `message`: A string that provides a readable description of the error.
- `data`: An optional string that provides even more context about the error, with the same format and limitations as request/response payloads.

Any other error thrown in a handler will be caught and the caller will receive a generic `1500 Application Error`.

#### Built-in error types

| Code | Name | Description |
| 1400 | UNSUPPORTED_METHOD | Method not supported at destination |
| 1401 | RECIPIENT_NOT_FOUND | Recipient not found |
| 1402 | REQUEST_PAYLOAD_TOO_LARGE | Request payload too large |
| 1403 | UNSUPPORTED_SERVER | RPC not supported by server |
| 1404 | UNSUPPORTED_VERSION | Unsupported RPC version |
| 1500 | APPLICATION_ERROR | Application error in method handler |
| 1501 | CONNECTION_TIMEOUT | Connection timeout |
| 1502 | RESPONSE_TIMEOUT | Response timeout |
| 1503 | RECIPIENT_DISCONNECTED | Recipient disconnected |
| 1504 | RESPONSE_PAYLOAD_TOO_LARGE | Response payload too large |
| 1505 | SEND_FAILED | Failed to send |

---

This document was rendered at 2025-09-27T09:36:26.875Z.
For the latest version of this document, see [https://docs.livekit.io/home/client/data/rpc.md](https://docs.livekit.io/home/client/data/rpc.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).