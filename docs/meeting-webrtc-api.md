# Meeting Video (WebSocket + WebRTC) and Save Recording

## Overview

- **WebSocket (Socket.IO)** is used for **signaling**: joining a meeting room, exchanging WebRTC offers/answers and ICE candidates between peers.
- **WebRTC** is used for **peer-to-peer** audio/video streams between participants (no media goes through the server).
- **Recording** is done **client-side** (e.g. by the meeting admin using the browser’s `MediaRecorder`). The recorded file is then uploaded to the server and saved as a **video** linked to the meeting.

---

## 1. Socket.IO connection

Connect with the same base URL as your API. Send the JWT in the handshake:

```javascript
import { io } from "socket.io-client";

const socket = io("https://your-api.com", {
  auth: { token: "YOUR_JWT" },
  // or: query: { token: "YOUR_JWT" }
});
```

The meeting socket uses the **same** Socket.IO server and namespace as chat; only the event names differ.

---

## 2. Meeting room events (signaling)

### Join a meeting room

Only users who have access to the meeting (group admin or group member) can join.

**Emit:** `joinMeetingRoom`

```javascript
socket.emit("joinMeetingRoom", { meetingId: "meeting-uuid" }, (ack) => {
  if (ack?.ok) {
    // ack.participants = list of { socketId, userId, name, email, user_photo } already in the room (excluding you)
    // For each participant, create an RTCPeerConnection and send an offer (see WebRTC flow below).
  } else {
    console.error(ack?.message);
  }
});
```

**Listen:** `participantJoined`

When someone else joins, you receive:

```javascript
socket.on("participantJoined", (data) => {
  // data: { socketId, userId, name, email, user_photo, meetingId }
  // Create an RTCPeerConnection for this peer and createOffer; then send the offer via webrtcOffer.
});
```

**Listen:** `participantLeft`

```javascript
socket.on("participantLeft", (data) => {
  // data: { socketId, userId, meetingId }
  // Close the RTCPeerConnection for this socketId and remove their video.
});
```

**Listen:** `participantLeftByUserId` (sent when user leaves via REST e.g. tab closed)

```javascript
socket.on("participantLeftByUserId", (data) => {
  // data: { userId, meetingId }
  // Remove the participant with this user_id from your list and close their peer connection.
});
```

### Leave the room

**Emit:** `leaveMeetingRoom`

```javascript
socket.emit("leaveMeetingRoom", { meetingId: "meeting-uuid" });
```

---

## 3. WebRTC signaling events

Use these to exchange SDP (offer/answer) and ICE candidates. Always include `meetingId` and the target `toSocketId`.

### Send offer (after creating an offer with `pc.createOffer()`)

**Emit:** `webrtcOffer`

```javascript
socket.emit("webrtcOffer", {
  toSocketId: "target-socket-id",
  meetingId: "meeting-uuid",
  sdp: offer  // RTCSessionDescription
}, (ack) => { if (!ack?.ok) console.error(ack?.message); });
```

**Listen:** `webrtcOffer`

```javascript
socket.on("webrtcOffer", async (data) => {
  // data: { fromSocketId, fromUserId, fromName, meetingId, sdp }
  // Create RTCPeerConnection for fromSocketId, setRemoteDescription(sdp), createAnswer, setLocalDescription, then emit webrtcAnswer to fromSocketId.
});
```

### Send answer (after creating an answer with `pc.createAnswer()`)

**Emit:** `webrtcAnswer`

```javascript
socket.emit("webrtcAnswer", {
  toSocketId: "target-socket-id",
  meetingId: "meeting-uuid",
  sdp: answer
}, (ack) => { if (!ack?.ok) console.error(ack?.message); });
```

**Listen:** `webrtcAnswer`

```javascript
socket.on("webrtcAnswer", async (data) => {
  // data: { fromSocketId, fromUserId, meetingId, sdp }
  // Find the peer connection for fromSocketId and setRemoteDescription(sdp).
});
```

### Send ICE candidate

**Emit:** `webrtcIceCandidate`

```javascript
socket.emit("webrtcIceCandidate", {
  toSocketId: "target-socket-id",
  meetingId: "meeting-uuid",
  candidate: candidate  // RTCIceCandidate or null (null = end-of-candidates)
}, (ack) => { if (!ack?.ok) console.error(ack?.message); });
```

**Listen:** `webrtcIceCandidate`

```javascript
socket.on("webrtcIceCandidate", (data) => {
  // data: { fromSocketId, meetingId, candidate }
  // Find the peer connection for fromSocketId and addIceCandidate(data.candidate).
});
```

---

## 4. Client-side WebRTC flow (summary)

1. **getUserMedia** to get local video/audio.
2. **joinMeetingRoom** with the meeting id; receive `participants` and `participantJoined`.
3. For **each** other participant (by `socketId`):
   - Create an `RTCPeerConnection` (use public STUN like `stun:stun.l.google.com:19302`).
   - Add your local stream: `pc.addTrack(track, stream)`.
   - If you already have their socket in the room: **createOffer** → setLocalDescription → **webrtcOffer** to that socketId.
   - On **webrtcOffer** from them: setRemoteDescription(offer) → **createAnswer** → setLocalDescription → **webrtcAnswer** to them.
   - On **webrtcAnswer**: setRemoteDescription(answer).
   - On **webrtcIceCandidate**: addIceCandidate(candidate).
   - On **track** event: attach remote stream to a video element.
4. When **participantJoined**: create a new RTCPeerConnection for the new socketId, add your tracks, createOffer, send **webrtcOffer** to the new joiner (they will answer and send ICE).
5. On **participantLeft**: close the peer connection and remove the video.

---

## 5. Recording the meeting (client-side) and saving as video

Only the **meeting administrator** can save the recording. The video is **always saved to the group that created the meeting**; the backend sets `group_id` from the meeting.

### Automatic record and upload to the meeting’s group

To have the recording **save and upload automatically** to the specific group that made the meeting:

1. **When the meeting starts** (e.g. when the admin joins the room or clicks “Start meeting”): start `MediaRecorder` on the local stream (or a composed stream).
2. **When the meeting ends** (e.g. admin leaves the room or clicks “End meeting”): stop the recorder, get the blob, then **immediately** `POST` to `POST /api/meeting/:id/save-recording` with **only** `video_file` and the meeting id (no `title` needed).
3. The backend will:
   - Generate a title like `Recording: {meeting.title} - {date} {time}`,
   - Set `group_id` from the meeting (the group that created the meeting),
   - Upload the file and create the video row.

No user action is required for “where to save” or “what title”—it always goes to the meeting’s group with an auto-generated title unless the client sends a custom `title`.

### Record on the client

- Use **MediaRecorder** on a stream that contains the meeting:
  - Option A: Record your **outgoing** stream only.
  - Option B: Use a **canvas** to composite your video + remote videos and record the canvas stream (more complex).
- When the meeting ends, stop the recorder and get a **Blob** (e.g. `video/webm`).

Example (record your own video only):

```javascript
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
const recorder = new MediaRecorder(stream);
const chunks = [];
recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: "video/webm" });
  // Upload blob to save-recording (see below).
};
recorder.start();
// ... later ...
recorder.stop();
```

### Upload and save as video (always to the meeting’s group)

**Endpoint:** `POST /api/meeting/:id/save-recording`

- **Auth:** Bearer JWT (admin; only the meeting’s administrator can save).
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `video_file` (required): the recorded video file (e.g. from the MediaRecorder blob).
  - `title` (optional): title for the saved video. If omitted, the backend **auto-generates** a title: `Recording: {meeting.title} - {date} {time}`.
  - `description` (optional): text.
  - `poster_file` (optional): image file for the video poster.

**Where it goes:** The video is **always saved and uploaded to the specific group that created the meeting**. The backend uses the meeting’s `group_id`; the client does not send it. The created row has `meeting_id` and `group_id` set from the meeting, so the video appears in that group’s video list.

**Automatic save flow (recommended):** When the meeting ends (e.g. admin leaves or clicks “End meeting”), the client can **automatically** upload the recording without asking the user for a title: send only `video_file` and `meetingId`; the backend will assign the title and save to the meeting’s group.

Example – automatic upload (no title):

```javascript
const formData = new FormData();
formData.append("video_file", blob, "recording.webm");
// title optional: backend uses "Recording: {meeting.title} - {date} {time}"

const res = await fetch(`/api/meeting/${meetingId}/save-recording`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
const data = await res.json();
// data.data: id, title (auto or provided), meeting_id, video_url, poster_url, duration, group_id, etc.
```

Example – with optional title and description:

```javascript
const formData = new FormData();
formData.append("title", "Weekly sync – Feb 3");
formData.append("description", "Recorded from Meetza meeting");
formData.append("video_file", blob, "recording.webm");

const res = await fetch(`/api/meeting/${meetingId}/save-recording`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});
```

The created **video** is stored in the `video` table with `meeting_id` and `group_id` from the meeting and appears in that group’s video list.

---

## 6. Optional: get participants via socket

**Emit:** `getMeetingParticipants`

```javascript
socket.emit("getMeetingParticipants", { meetingId: "meeting-uuid" }, (ack) => {
  if (ack?.ok) {
    console.log(ack.participants); // same shape as joinMeetingRoom ack
  }
});
```

---

## Summary

| Item | Technology |
|------|------------|
| Signaling (join, offer, answer, ICE) | Socket.IO (WebSocket) |
| Audio/Video streams | WebRTC (peer-to-peer) |
| Recording | Client-side MediaRecorder → Blob |
| Save as video | POST `/api/meeting/:id/save-recording` (multipart) |
