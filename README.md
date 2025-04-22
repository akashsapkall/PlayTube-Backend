# PlayTube 🎥

A YouTube-like video streaming platform built with Node.js, Express, and MongoDB. Supports video uploads, user interactions, playlists, and advanced analytics.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green)](https://www.mongodb.com/)

## Features ✨

### Core Functionality
- 🛡️ JWT-based user authentication/authorization
- 📤 Video upload with Cloudinary integration (MP4, WebM)
- 🖼️ Thumbnail management with auto-format conversion
- 📈 Advanced video analytics using aggregation pipelines
- 💬 Comment system with nested replies
- ❤️ Like/Dislike functionality
- 📑 Playlist management system
- 🔍 Full-text search with regex
- 📊 User dashboard with channel statistics
- 🔔 Real-time notifications (WebSocket-ready architecture)

### Advanced Features
- 🧮 Complex aggregation pipelines for insights:
  - Channel statistics (views/likes/subscribers)
  - Trending videos algorithm
  - Watch history tracking
- 🔒 Role-based access control (RBAC)
- ⚡ Optimized video streaming with chunked uploads
- 🔄 Pagination with facet aggregation
- 📦 Memory buffer uploads (no temp files)

## Tech Stack 🛠️

**Backend**  
- Node.js
- Express.js
- MongoDB (Mongoose ODM)

**Services**  
- Cloudinary (Media storage)
- JWT (Authentication)
- Bcrypt (Password hashing)
- Redis (Rate limiting - future ready)

**Architecture**  
- REST API best practices
- MVC pattern
- Layered middleware architecture
- Error handling framework

## Installation ⚙️

1. Clone repository:
```bash
git clone https://github.com/yourusername/playtube-backend.git
cd playtube-backend
```
2. Install dependencies:
```bash
npm install
```
3. Configure environment (.env):
```bash
PORT=8000
MONGODB_URI=mongodb://localhost:27017/playtube
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d
```
4. Start server:
```bash
npm run dev
```
