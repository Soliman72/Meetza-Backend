## Chat & Collaboration APIs

All routes require a valid JWT via the `Authorization: Bearer <token>` header and leverage the existing `/api/auth` login flow.

### REST Endpoints

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/chat/groups` | Lists every group where the authenticated user is the administrator or a member. Includes last message snippet and member counts. |
| GET | `/api/chat/groups/:groupId/messages?limit=50&before=<ISO>` | Returns chronological chat history with simple pagination through the optional `before` cursor. |
| POST | `/api/chat/groups/:groupId/messages` | Persists a chat message (also echoes to websocket listeners). Body: `{ "message": "..." }`. |
| GET | `/api/chat/groups/:groupId/info` | Aggregates group profile, members (admin + students), and the attached group content/resources. |
| GET | `/api/chat/groups/:groupId/meetings?from=<ISO>&to=<ISO>` | Lists scheduled meetings for the group, filtered by optional date range for the calendar widget. |

### Websocket Gateway (`/socket.io`)

```js
import { io } from "socket.io-client";

const socket = io("https://<host>", {
  auth: { token: "<JWT>" },
});
```

Events:

- `joinGroup` – payload `{ groupId }`. Subscribes the socket to the room `group:<groupId>`.
- `leaveGroup` – payload `{ groupId }`. Removes subscription.
- `sendMessage` – payload `{ groupId, message }`. Persists and broadcasts the chat message. Ack signature `{ ok: boolean, data?, message? }`.
- `message` – emitted by the server to everyone in the room; shape mirrors the REST response: `{ id, group_id, sender_id, sender_name, sender_email, sender_photo, message, created_at }`.

### Persistence

- Messages are stored in the new `group_message` table (`ensureChatTables()` creates it automatically on boot), keeping history available when users return to the chat page.
- Resources shown inside the "Group Chat Info" panel are sourced from the existing `group_content` + `group_content_resource` tables; the API categorizes files into `photos`, `documents`, `videos`, `audio`, `links`, or `other` buckets based on MIME type.

### Suggested Tests

1. **Group discovery** – call `GET /api/chat/groups` as a member and as an admin; verify only authorized groups appear.
2. **History pagination** – seed >50 messages, fetch with and without `before` cursor, ensure order is chronological.
3. **Realtime send/receive** – connect two sockets, `joinGroup`, `sendMessage` from one, confirm both receive the `message` event and that the REST history now includes it.
4. **Group info resources** – upload assets through the existing `group_content` endpoints, then fetch `/info` and confirm categorisation matches UI tabs.
5. **Calendar range filtering** – create meetings across multiple days, call `/meetings?from=...&to=...` and ensure only constrained entries return.

