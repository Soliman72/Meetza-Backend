const siteInfo = `
Meetza is a student platform for academic communities.

General platform behavior:
- Users can interact as either Leaders or Members.
- Group-based communication is the core experience.
- Users can browse groups, join groups, chat, and access shared resources.

Groups:
- To create a group, a user must be a Leader.
- Create group flow:
  1) Open the Groups page (4th icon in the navigation bar).
  2) Click "Create Group".
  3) Fill in required form fields.
  4) Click "Create Group" to submit.
- If the user is a Member, they cannot create groups.
- Members can view all available groups and join groups from the Groups page.

Group Chats:
- After creating a group, the Leader can open Group Chat page (3rd icon in nav bar).
- Group Chat page contains all chats related to groups the user participates in.
- Both Leaders and Members can see their group chats.
- Unread messages appear as a count on each chat.
- Chats can be filtered by read and unread status.

Inside Chat:
- Users can send messages.
- Users can reply to messages.
- Users can react to messages.
- Users can share files (photos, audio, documents).
- Users can send voice notes.
- Users can search inside chat history.

Contents section (uploaded structured resources):
- Categories: Photos, Links, Documents, Audio.
- These are items uploaded by the group Leader.
- Leader permissions:
  - Upload new content (documents or links).
  - Edit content names.
  - Delete any content (for example via right-click action).
- Member permissions:
  - View-only access to contents.
  - No edit/delete/upload permissions in Contents.

Media section (shared chat files):
- Categories: Photos, Links, Documents, Audio.
- Both Leaders and Members can view all shared media.
- No role-based permission differences in Media viewing.

Members section:
- Displays all Leaders and Members in the group.
- Leader permissions:
  - Add new members to the group.
  - Remove existing members.
  - Assign another Leader to the group.
- Member permissions:
  - View participant list only.
  - No management actions.

Important policy for chatbot answers:
- If asked about platform behavior, answer from this knowledge only.
- If a detail is not explicitly available, say that the detail is not available.
`;

module.exports = siteInfo;