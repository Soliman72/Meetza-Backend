# How the Meeting (WebSocket + WebRTC + Recording) System Works — And Why It’s Designed This Way

This doc explains **what** each part does and **how** the design was reasoned about: from the problem you had to the choices we made.

---

## 1. What You Wanted (The Problem)

You said:

- **Video meetings** with members and the group admin.
- Use **WebSocket** and **WebRTC**.
- **Save the meeting as a video** afterward.

So we need:

1. **Real-time video/audio** between people in a meeting.
2. **Some way to coordinate** who is in the meeting and how they connect (signaling).
3. **A way to record** the meeting and **store it** as a video in your app.

---

## 2. Why WebRTC + WebSocket (The Big Picture)

### WebRTC = the actual video/audio

- **WebRTC** is the browser API for **peer-to-peer** audio and video.
- Two (or more) browsers connect **directly** to each other and send media. The **server does not see or store the video/audio**.
- Pros: low latency, no server bandwidth for media, privacy (media doesn’t pass through your backend).
- Con: the two peers need to **discover each other** and **agree on how to connect** (IP, ports, codecs). That’s “signaling.”

### Signaling = how do we agree to connect?

- To set up a WebRTC call, each side must exchange:
  - **SDP (Session Description)**: “I can do video/audio like this, here’s my codecs and settings.”
  - **ICE candidates**: “You can reach me at this IP:port.”
- This exchange **must happen over some channel**. That channel is **signaling**. It doesn’t carry video; it only carries these metadata messages.

### WebSocket (Socket.IO) = the signaling channel

- You already had **Socket.IO** for chat. So the idea: **reuse the same WebSocket connection** for meeting signaling.
- Flow:
  1. User A and B both **join the same “meeting room”** over the socket (so the server knows they’re in the same meeting).
  2. A creates a WebRTC **offer** and sends it to the server with “for user B.”
  3. The server **relays** that offer to B’s socket.
  4. B creates an **answer** and sends it back via the server to A.
  5. Same for **ICE candidates** in both directions.
- So: **WebSocket = signaling only**. **WebRTC = the actual media**, direct between browsers. The server only forwards small JSON messages (offer/answer/ICE); it never sees the video stream.

That’s why the design is “WebSocket + WebRTC”: each technology does one job.

---

## 3. How the Backend Thinks About the Meeting Room

### “Room” = who should receive signaling messages

- The server needs to know: “when A sends an offer, who should get it?” → “B, and only B (and only if B is in the same meeting).”
- So we model a **room** per meeting: everyone in that meeting **joins the same Socket.IO room** (e.g. `meeting:abc-123`).
- Then:
  - **joinMeetingRoom** → check access → `socket.join("meeting:" + meetingId)`.
  - When A sends an offer “to B,” we don’t broadcast to the whole room; we send **only to B’s socket** with `io.to(toSocketId).emit(...)`. So we use the room to know who’s in the meeting, but we deliver signaling **peer-to-peer by socket id**.

### Why check “can this user access this meeting?”

- Not every user should join every meeting. Your rules: **group admin** can create/manage; **members of that group** can join.
- So before `socket.join(...)` we do a **canAccessMeeting(userId, meetingId)** check:
  - Load the meeting (and its `group_id`, `administrator_id`).
  - If the user is the meeting’s admin or a Super_Admin → allow.
  - Else check **group_membership**: is this user a member of that group? If yes → allow. If no → deny.
- So the “thinking” is: **reuse the same access rules you already have for the REST API** (group membership, admin) and enforce them on the socket so the room is consistent with your data model.

### Why store “which meeting rooms this socket is in”?

- In the socket handler we keep a **Set**: `meetingRooms` (e.g. `["meeting-id-1", "meeting-id-2"]`).
- When the client sends **webrtcOffer** / **webrtcAnswer** / **webrtcIceCandidate**, we include a `meetingId`. The server checks: **is this socket in that meeting room?** If not → reject (prevents someone from injecting signaling into a meeting they’re not in).
- On **disconnect**, we iterate over `meetingRooms` and emit **participantLeft** to each room so other peers can clean up their UI and close the right `RTCPeerConnection`s.

So the thinking: **rooms = membership**, **socket id = identity for signaling**, **meetingId on every event = authorization**.

---

## 4. Why Signaling Events Look Like This

### One peer talks to one other peer

- WebRTC is **pairwise**: A has a connection to B, and another to C. So signaling is also **pairwise**: “from A, to B, here’s my offer.”
- So every event carries:
  - **toSocketId** — who should receive this (so the server can do `io.to(toSocketId).emit(...)`).
  - **meetingId** — so the server can check the sender is in that meeting.
  - **sdp** or **candidate** — the actual WebRTC data.

### Why we don’t broadcast offer/answer to the whole room

- If we broadcast the offer to the whole room, everyone would get it. But the offer is meant for **one** peer (the one who will answer and then have a direct connection with the sender). So we send **only to that peer** by `toSocketId`. That’s “how we think”: one offer → one answer → one peer connection.

### participantJoined / participantLeft

- When someone **joins**, others in the room need to know “there’s a new peer, create a connection and send an offer (or wait for them to send an offer).” So the server broadcasts **participantJoined** (socketId, userId, name, etc.) to the room (except the joiner).
- When someone **leaves** (or disconnects), we broadcast **participantLeft** so everyone can close the right peer connection and remove their video. So the thinking: **membership changes are broadcast; WebRTC signaling is targeted.**

---

## 5. Why Recording Is “Client-Side Then Upload”

### Where can recording happen?

- **Option A — Server records:** The server would need to **receive** all video/audio streams, mix them, and encode to a file. That means:
  - Media must go **through** the server (no longer pure peer-to-peer), and
  - You need a **media server** (e.g. GStreamer, mediasoup, Janus) and more infra. Heavy for a first version.
- **Option B — Client records:** The browser already has the streams (its own and the remote tracks). The **browser** can record (e.g. with **MediaRecorder**) and produce a file (e.g. WebM). Then the client **uploads** that file to your backend.
- We chose **B** so that:
  - The backend stays simple (no media pipeline).
  - You already have **video upload** (Cloudinary, `video` table). We just add an endpoint that says: “this file is a **recording of this meeting**” and create a `video` row with `meeting_id` and `group_id`.

### “Save as video” = one REST endpoint

- You already have:
  - **video** table: `id`, `title`, `meeting_id`, `video_url`, `poster_url`, `administrator_id`, `date_recorded`, `description`, `group_id`.
  - **createVideo** that uploads a file and inserts a row.
- So “save meeting recording” is: **same schema**, but:
  - The file comes from the **client** (the recorded blob).
  - `meeting_id` and `group_id` come from the **meeting** (we load the meeting by id and use its `group_id`).
  - Only the **meeting’s administrator** (or Super_Admin) is allowed to save, so we check `meeting.administrator_id === req.user.id` (and optionally allow Super_Admin).
- So the thinking: **reuse the existing “video” concept and permissions**, and add one endpoint that ties an uploaded file to a meeting and enforces “only meeting admin can save.”

---

## 6. How the Pieces Fit Together (Flow of Thought)

1. **Meetings** are already in your DB (group, admin, members). So “video meeting” = same meeting, but we add **real-time media** and **signaling**.
2. **Real-time media** → WebRTC (browser API). WebRTC needs **signaling** → we use the existing Socket.IO server and add **meeting rooms** and **relay events** (offer/answer/ICE).
3. **Who can join a meeting?** → Same as your REST rules: group admin or group member. So we **check access** before joining the room and **tag** each socket with the meetings it’s in.
4. **Who can save the recording?** → Only the meeting admin. So we add **save-recording** that checks `meeting.administrator_id` and then does the same “upload file + insert video row” you already have elsewhere.
5. **Recording itself** → Done in the browser (MediaRecorder), then **POST** the file to `save-recording`. No media server.

So the “thinking” is: **reuse as much as possible** (Socket.IO, auth, video table, group/member rules) and add the **minimum** new concepts: meeting room, pairwise signaling, and one “save this file as the meeting’s video” endpoint.

---

## 7. Summary Table (What Each Thing Is For)

| Piece | What it does | Why we did it this way |
|-------|----------------|------------------------|
| **Socket.IO meeting room** | Groups sockets by `meetingId` so we know who’s in which meeting. | So we can relay signaling only between people in the same meeting and enforce access. |
| **joinMeetingRoom** | Checks access, joins the room, returns current participants, notifies others. | One place to enforce “only group admin/members” and to tell the client who’s already there so they can create peer connections. |
| **webrtcOffer / webrtcAnswer / webrtcIceCandidate** | Relay SDP and ICE from one socket to another by `toSocketId`. | WebRTC needs offer/answer/ICE per pair; the server doesn’t need to understand the content, just deliver it to the right peer. |
| **participantJoined / participantLeft** | Broadcast “who joined/left” to the room. | So every client can create or destroy the right RTCPeerConnection and update the UI. |
| **canAccessMeeting()** | DB check: meeting exists, user is admin or group member. | Same rules as REST; keeps socket behavior consistent with your data model. |
| **meetingRooms Set** | Remembers which meetings this socket joined. | So we can validate `meetingId` on every signaling event and emit **participantLeft** on disconnect. |
| **Client recording** | MediaRecorder in the browser, then upload blob. | Avoids a media server; uses what the browser already has. |

---

## 8. If You Change Requirements Later

- **More than two people:** The design already supports it: each participant has one peer connection **per other participant**; signaling is per pair. The server doesn’t need to change; the client creates N−1 connections when there are N users.
- **Server-side recording:** You’d add a media server that receives WebRTC streams (or a separate “recorder” client that sends one mixed stream to the server) and then save that. The current “save as video” endpoint can stay; only the **source** of the file would change.
- **TURN server:** If users are behind strict NATs, peer-to-peer might fail. Then you’d add a TURN server (e.g. coturn). The backend doesn’t handle TURN; you’d configure the **client**’s `RTCPeerConnection` with `iceServers: [..., { urls: "turn:..." }]`. Signaling (our WebSocket) stays the same.

So the way to “think like this” is: **clarify the problem** (video + signaling + save), **assign one job to each technology** (WebRTC = media, WebSocket = signaling, REST = save), **reuse your existing auth and data model**, and **add the smallest extra pieces** (rooms, relay events, one upload endpoint) that make it work.
