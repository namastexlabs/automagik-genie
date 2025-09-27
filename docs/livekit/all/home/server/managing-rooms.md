LiveKit Docs › Server APIs › Room management

---

# Managing rooms

> Create, list, and delete Rooms from your backend server.

## Initialize RoomServiceClient

Room management is done with a RoomServiceClient, created like so:

**Go**:

```go
import (
  lksdk "github.com/livekit/server-sdk-go"
  livekit "github.com/livekit/protocol/livekit"
)

// ...

host := "https://my.livekit.host"
roomClient := lksdk.NewRoomServiceClient(host, "api-key", "secret-key")

```

---

**Python**:

```shell
pip install livekit-api

```

```python
from livekit.api import LiveKitAPI

# Will read LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET from environment variables
async with api.LiveKitAPI() as lkapi:
  # ... use your client with `lkapi.room` ...

```

---

**Node.js**:

```js
import { Room, RoomServiceClient } from 'livekit-server-sdk';

const livekitHost = 'https://my.livekit.host';
const roomService = new RoomServiceClient(livekitHost, 'api-key', 'secret-key');

```

## Create a room

**Go**:

```go
room, _ := roomClient.CreateRoom(context.Background(), &livekit.CreateRoomRequest{
  Name:            "myroom",
  EmptyTimeout:    10 * 60, // 10 minutes
  MaxParticipants: 20,
})

```

---

**Python**:

```python
from livekit.api import CreateRoomRequest

room = await lkapi.room.create_room(CreateRoomRequest(
  name="myroom",
  empty_timeout=10 * 60,
  max_participants=20,
))

```

---

**Node.js**:

```js
const opts = {
  name: 'myroom',
  emptyTimeout: 10 * 60, // 10 minutes
  maxParticipants: 20,
};
roomService.createRoom(opts).then((room: Room) => {
  console.log('room created', room);
});

```

---

**LiveKit CLI**:

```shell
lk room create --empty-timeout 600 myroom

```

## List rooms

**Go**:

```go
rooms, _ := roomClient.ListRooms(context.Background(), &livekit.ListRoomsRequest{})

```

---

**Python**:

```python
from livekit.api import ListRoomsRequest

rooms = await lkapi.room.list_rooms(ListRoomsRequest())

```

---

**Node.js**:

```js
roomService.listRooms().then((rooms: Room[]) => {
  console.log('existing rooms', rooms);
});

```

---

**LiveKit CLI**:

```shell
lk room list

```

## Delete a room

Deleting a room causes all Participants to be disconnected.

**Go**:

```go
_, _ = roomClient.DeleteRoom(context.Background(), &livekit.DeleteRoomRequest{
  Room: "myroom",
})

```

---

**Python**:

```python
from livekit.api import DeleteRoomRequest

await lkapi.room.delete_room(DeleteRoomRequest(
  room="myroom",
))

```

---

**Node.js**:

```js
// Delete a room
roomService.deleteRoom('myroom').then(() => {
  console.log('room deleted');
});

```

---

**LiveKit CLI**:

```shell
lk room delete myroom

```

---

This document was rendered at 2025-09-27T09:36:43.677Z.
For the latest version of this document, see [https://docs.livekit.io/home/server/managing-rooms.md](https://docs.livekit.io/home/server/managing-rooms.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).