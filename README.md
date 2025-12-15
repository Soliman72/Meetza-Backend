# Meetza Backend

A comprehensive Node.js backend application for managing educational groups, meetings, videos, and real-time communication. Meetza provides a platform for administrators and members to collaborate through groups, schedule meetings, share content, and interact via chat.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [WebSocket Events](#websocket-events)
- [Running the Application](#running-the-application)
- [Authentication](#authentication)
- [Database Schema](#database-schema)

## ✨ Features

### User Management
- User registration and authentication
- Email verification system
- Password reset functionality
- Social authentication (Google, Facebook, LinkedIn)
- Role-based access control (Administrator, Super_Admin, Member)
- User profile management

### Group Management
- Create and manage educational groups
- Group membership management
- Position-based group organization (e.g., Professor, Department Head)
- Group content and resource sharing
- Year and semester-based grouping (1-4 years, Fall/Spring/Summer)

### Meetings & Videos
- Schedule and manage meetings
- Video recording and upload
- Video comments and likes/dislikes
- Save/bookmark videos
- Video poster images

### Real-time Communication
- Group chat with Socket.IO
- Media sharing in chat (images, voice, files)
- Read receipts and unread message tracking
- Real-time notifications
- Message history persistence

### Notifications
- System notifications
- Read/unread status tracking
- Real-time notification delivery

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MySQL (mysql2)
- **Authentication**: 
  - JWT (jsonwebtoken)
  - Passport.js (Google, Facebook, LinkedIn OAuth)
- **Real-time**: Socket.IO 4.8.1
- **File Upload**: Multer 2.0.2
- **Cloud Storage**: Cloudinary 2.8.0
- **Email**: Nodemailer 7.0.9
- **Validation**: Validator 13.15.23
- **Security**: bcrypt 6.0.0
- **Other**: 
  - UUID for unique identifiers
  - Axios for HTTP requests
  - Google APIs for calendar integration

## 📦 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn
- Cloudinary account (for file storage)
- Email service credentials (for nodemailer)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Meetza-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

4. **Set up the database**
   See [Database Setup](#database-setup)

5. **Start the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   node server.js
   ```

## 🗄 Database Setup

1. **Create the database**
   ```bash
   mysql -u your_username -p < database_schema.sql
   ```

   Or import `database_schema.sql` through MySQL Workbench or any MySQL client.

2. **Database Configuration**
   The database connection is configured in `config/db.js` using environment variables.

   For detailed database schema information, see [DATABASE_README.md](./DATABASE_README.md)

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=4000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=meetza

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=http://localhost:4000/api/auth/social/google/callback

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Facebook OAuth (if using)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# LinkedIn OAuth (if using)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

## 📁 Project Structure

```
Meetza-Backend/
├── config/                 # Configuration files
│   ├── db.js              # Database connection
│   ├── passport.js        # Passport authentication setup
│   └── service.json       # Service configurations
├── controller/            # Route controllers
│   ├── authController.js
│   ├── userController.js
│   ├── groupController.js
│   ├── meetingController.js
│   ├── videoController.js
│   ├── chatController.js
│   ├── notificationController.js
│   └── ... (other controllers)
├── router/                # Express routes
│   ├── authRouter.js
│   ├── userRouter.js
│   ├── groupRouter.js
│   └── ... (other routers)
├── services/              # Business logic services
│   ├── chatMessageService.js
│   └── notificationService.js
├── sockets/               # Socket.IO handlers
│   ├── chatSocket.js
│   └── notificationSocket.js
├── utils/                 # Utility functions
│   ├── verifyToken.js
│   ├── checkAdmin.js
│   ├── uploadFile.js
│   ├── sendEmail.js
│   └── ... (other utilities)
├── scripts/               # Utility scripts
│   └── test-socket.js
├── docs/                  # Documentation
│   └── chat-api.md
├── database_schema.sql    # Database schema
├── DATABASE_README.md     # Database documentation
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
└── .gitignore            # Git ignore rules
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Email verification
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot_password` - Request password reset
- `POST /api/auth/verify_code` - Verify reset code
- `POST /api/auth/reset_password` - Reset password
- `GET /api/auth/social/google` - Google OAuth initiation
- `GET /api/auth/social/google/callback` - Google OAuth callback

### Users (`/api/user`)
- User profile management endpoints

### Groups (`/api/group`)
- Group creation and management
- Group listing and details

### Group Membership (`/api/group-membership`)
- Add/remove members from groups
- List group members

### Group Content (`/api/group-contents`)
- Upload and manage group content
- Resource file management

### Meetings (`/api/meeting`)
- Schedule meetings
- Update meeting status
- List meetings

### Videos (`/api/video`)
- Upload videos
- List videos
- Video details

### Comments (`/api/comment`)
- Add comments to videos
- List comments

### Likes (`/api/like`)
- Like/dislike videos
- Get like counts

### Saved Videos (`/api/saved_video`)
- Save/bookmark videos
- List saved videos

### Chat (`/api/chat`)
- `GET /api/chat/groups` - List user's groups with chat info
- `GET /api/chat/groups/:groupId/messages` - Get chat history
- `POST /api/chat/groups/:groupId/messages` - Send message
- `GET /api/chat/groups/:groupId/info` - Get group info
- `GET /api/chat/groups/:groupId/meetings` - Get group meetings
- `PUT /api/chat/groups/:groupId/messages/:messageId/read` - Mark message as read
- `GET /api/chat/groups/:groupId/unread-count` - Get unread count

### Notifications (`/api/notification`)
- Get notifications
- Mark notifications as read

### Contacts (`/api/contact`)
- Contact management

### Administrators (`/api/administrator`)
- Administrator management

### Members (`/api/member`)
- Member management

### Positions (`/api/position`)
- Position management

### Social Auth (`/api/social_auth`)
- Social authentication management

For detailed chat API documentation, see [docs/chat-api.md](./docs/chat-api.md)

## 🔌 WebSocket Events

### Client → Server Events

- `joinGroup` - Join a group chat room
  ```js
  socket.emit('joinGroup', { groupId: '...' })
  ```

- `leaveGroup` - Leave a group chat room
  ```js
  socket.emit('leaveGroup', { groupId: '...' })
  ```

- `sendMessage` - Send a chat message
  ```js
  socket.emit('sendMessage', { groupId: '...', message: '...' })
  ```

- `markMessageRead` - Mark a message as read
  ```js
  socket.emit('markMessageRead', { groupId: '...', messageId: '...' })
  ```

- `markAllMessagesRead` - Mark all messages as read
  ```js
  socket.emit('markAllMessagesRead', { groupId: '...' })
  ```

- `getUnreadCount` - Get unread message count
  ```js
  socket.emit('getUnreadCount', { groupId: '...' })
  ```

### Server → Client Events

- `message` - New message received
- `messageRead` - Message marked as read
- `messageUnread` - Message marked as unread
- `allMessagesRead` - All messages marked as read
- `notification` - New notification received

### WebSocket Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token: "<JWT_TOKEN>" }
});
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
node server.js
```

The server will run on `http://localhost:4000` (or the port specified in your `.env` file).

## 🔒 Authentication

Most API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

The authentication middleware (`utils/verifyToken.js`) verifies the token and attaches the user object to the request.

## 📊 Database Schema

The database consists of 18 main tables:

1. **user** - User accounts and authentication
2. **administrator** - Administrator-specific data
3. **member** - Member-specific data
4. **position** - Administrator positions
5. **group** - Study/work groups
6. **group_content** - Group content and resources
7. **group_content_resource** - Files attached to group content
8. **group_membership** - Group membership relationships
9. **meeting** - Scheduled meetings
10. **video** - Video recordings
11. **comment** - Video comments
12. **like** - Video likes/dislikes
13. **saved_video** - Bookmarked videos
14. **notifications** - System notifications
15. **group_message** - Chat messages
16. **group_message_media** - Media files in messages
17. **message_read_status** - Message read receipts
18. **social_auth** - Social authentication providers

For detailed schema information, see [DATABASE_README.md](./DATABASE_README.md) and [database_schema.sql](./database_schema.sql)

## 📝 Notes

- All primary keys use UUID (VARCHAR(36)) format
- Character set: `utf8mb4` with `utf8mb4_unicode_ci` collation (supports emojis)
- Most foreign keys use `ON DELETE CASCADE`
- Static files (videos, images) are served from `/uploads` directory
- The application uses Cloudinary for cloud file storage

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Meetza Development Team

---

For more information about the database structure, see [DATABASE_README.md](./DATABASE_README.md)
