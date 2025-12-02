# Meetza Backend Database Schema

This document describes the complete database schema for the Meetza Backend application.

## Quick Start

To create all database tables, run:

```bash
mysql -u your_username -p < database_schema.sql
```

Or import it through MySQL Workbench or any MySQL client.

## Database Structure

### Core Tables

1. **user** - Main user authentication and profile table
2. **administrator** - Administrator-specific information (linked to user)
3. **member** - Member-specific information (linked to user)
4. **social_auth** - Social authentication providers (Google, etc.)

### Group Management

5. **position** - Positions held by administrators (e.g., "Professor", "Department Head")
6. **group** - Study/work groups with administrator, position, year, and semester
7. **group_membership** - Many-to-many relationship between groups and members
8. **group_content** - Content associated with groups (lecture materials, resources)
9. **group_content_resource** - Files/resources attached to group content

### Communication

10. **group_message** - Chat messages within groups
11. **group_message_media** - Media files attached to messages (images, voice, files)
12. **message_read_status** - Read/unread status tracking for group messages
13. **notifications** - System notifications sent to members

### Meetings & Videos

14. **meeting** - Scheduled meetings for groups
15. **video** - Recorded videos from meetings or uploaded content

### Video Interactions

16. **comment** - Comments on videos
17. **like** - Likes/dislikes on videos (0 = dislike, 1 = like)
18. **saved_video** - Videos saved/bookmarked by members

## Relationships Summary

```
user
├── administrator (1:1)
├── member (1:1)
├── social_auth (1:N)
├── position (1:N) [as administrator_id]
├── group (1:N) [as administrator_id]
├── meeting (1:N) [as administrator_id]
├── video (1:N) [as administrator_id]
├── notifications (1:N) [as sender_id]
└── message_read_status (1:N) [as user_id]

group
├── group_content (N:1) [via group_content_id]
├── group_membership (1:N)
├── group_message (1:N)
├── meeting (1:N)
└── video (1:N)

group_content
└── group_content_resource (1:N)

video
├── comment (1:N)
├── like (1:N)
└── saved_video (1:N)

member
├── group_membership (1:N)
├── comment (1:N)
├── like (1:N)
├── saved_video (1:N)
└── notifications (1:N)

group_message
├── group_message_media (1:N)
└── message_read_status (1:N)
```

## Important Notes

1. **Circular Dependency**: There's a circular relationship between `group` and `group_content`. The SQL script handles this by creating `group_content` first without the foreign key, then creating `group`, and finally adding the foreign key constraint.

2. **User Roles**: Users can have roles: `Administrator`, `Super_Admin`, or `Member`. Each role has corresponding entries in `administrator` or `member` tables.

3. **IDs**: All primary keys use UUID (VARCHAR(36)) format.

4. **Character Set**: All tables use `utf8mb4` character set and `utf8mb4_unicode_ci` collation to support full Unicode including emojis.

5. **Foreign Key Actions**:
   - Most foreign keys use `ON DELETE CASCADE` to automatically delete related records
   - Some nullable foreign keys use `ON DELETE SET NULL` to preserve data integrity

## Table Details

### user
- Stores all user authentication and profile data
- Roles: Administrator, Super_Admin, Member
- Email verification system built-in

### administrator
- Extends user table for administrators
- Stores role (Administrator or Super_Admin)

### member
- Extends user table for regular members

### position
- Defines positions administrators hold
- Linked to administrators

### group
- Study/work groups
- Has administrator, position, year (1-4), semester (Fall/Spring/Summer)
- Can optionally have group_content

### group_content
- Content/resources for groups
- Can be linked back to a specific group (circular relationship)

### group_content_resource
- Files attached to group content
- Stores file URL, name, type, and size

### group_membership
- Links members to groups
- Unique constraint on (group_id, member_id)

### meeting
- Scheduled meetings
- Status: Scheduled, Completed, Cancelled

### video
- Recorded videos
- Can be linked to a meeting
- Has video URL and poster URL

### comment
- Comments on videos
- Timestamped

### like
- Likes (1) or dislikes (0) on videos
- Unique constraint on (member_id, video_id)

### saved_video
- Videos bookmarked by members
- Composite primary key (member_id, video_id)

### notifications
- System notifications
- Read/unread status

### group_message
- Chat messages in groups
- Message text is optional (can have only media)

### group_message_media
- Media files in messages
- Types: image, voice, file

### message_read_status
- Tracks read/unread status for each message per user
- Unique constraint on (message_id, user_id)
- Tracks when a message was read (read_at timestamp)
- Used for read receipts and unread message counts

### social_auth
- Social authentication providers
- Unique constraint on (provider, provider_id)

