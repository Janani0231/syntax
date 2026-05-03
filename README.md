# Syntax

Full-stack Syntax workspace built with:

- React + Vite frontend
- Express backend
- MongoDB for notes
- Redis-backed `connect.sid` sessions and note caching
- RabbitMQ background queue for notification jobs
- WebSocket-powered live workspace chat
- File-based backend storage for uploaded assets

## Project Structure

```text
syntax/
├── .env.example
├── package.json
├── src/
├── server/
│   ├── .env.example
│   ├── package.json
│   └── src/
└── README.md
```

## What The App Does

- Landing page, login, and register screens
- Dashboard connected to backend APIs
- Live WebSocket chat for authenticated users
- Rich-text editor with notes stored in MongoDB
- File uploads stored by the backend
- File and note listing/download from real server data
- Per-user data scoping based on the current frontend login email

## Prerequisites

- Node.js LTS
- npm
- MongoDB
- Redis optional but recommended for caching

Check installed versions:

```powershell
node -v
npm -v
```

## Environment Setup

Create the frontend env file:

```powershell
Copy-Item .env.example .env
```

Frontend env values:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Create the backend env file:

```powershell
Copy-Item server\.env.example server\.env
```

Backend env values:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=syntax
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
SESSION_SECRET=replace-with-another-long-random-secret
SESSION_COOKIE_NAME=connect.sid
SESSION_TTL_SECONDS=604800
SESSION_COOKIE_SECURE=false
CORS_ORIGIN=http://localhost:5173
REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
NOTE_CACHE_TTL_SECONDS=60
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_ENABLED=true
NOTIFICATION_QUEUE_NAME=syntax.notifications
FILE_STORAGE_DIR=server/storage
```

## RabbitMQ Setup

RabbitMQ is used for background notification jobs. The API queues jobs after registration and note creation, and the worker consumes them separately.

For local development with Docker:

```powershell
docker run -d --name syntax-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

RabbitMQ management UI:

```text
http://localhost:15672
```

Default login:

```text
guest / guest
```

Environment:

```env
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_ENABLED=true
NOTIFICATION_QUEUE_NAME=syntax.notifications
```

Run the worker in a separate terminal:

```powershell
npm run server:worker:dev
```

If RabbitMQ is not available, API requests still succeed and notification jobs are skipped with a warning.

## Redis Setup

Redis is used for server-side `connect.sid` sessions and optional caching for frequently accessed note list/detail data.

For local development, run Redis on the default port and keep:

```env
REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
NOTE_CACHE_TTL_SECONDS=60
```

If Redis is not available, note caching falls back to MongoDB reads. For scalable session storage, keep Redis running. You can disable Redis usage during local troubleshooting with:

```env
REDIS_ENABLED=false
```

## MongoDB Setup

You can use either a local MongoDB server or MongoDB Atlas.

### Local MongoDB

1. Install MongoDB Community Edition.
2. Start MongoDB.
3. Keep `MONGODB_URI=mongodb://127.0.0.1:27017`.
4. Keep `MONGODB_DB_NAME=syntax` or change it if you want a different database name.

### MongoDB Atlas

1. Create a cluster in MongoDB Atlas.
2. Create a database user.
3. Allow your IP address.
4. Copy the connection string.
5. Put it into `server/.env` as `MONGODB_URI`.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster-name.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=syntax
```

## Install Dependencies

Install frontend dependencies:

```powershell
npm install
```

Install backend dependencies:

```powershell
npm --prefix server install
```

## Run The Project

Open two terminals in `D:\projects\syntax`.

### Terminal 1: backend

```powershell
npm run server:dev
```

Backend default URL:

```text
http://localhost:4000
```

### Terminal 2: frontend

```powershell
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

## Build Commands

Frontend build:

```powershell
npm run build
```

Backend build:

```powershell
npm run server:build
```

Start built backend:

```powershell
npm run server:start
```

## API Summary

Backend routes:

- WebSocket: `ws://localhost:4000/ws/chat?token=JWT_TOKEN`
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/files`
- `GET /api/files/:name`
- `POST /api/files`
- `PUT /api/files/:name`
- `DELETE /api/files/:name`
- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

Notes:

- File APIs use backend storage on disk.
- Note APIs use MongoDB and use Redis cache for repeated reads when enabled.
- Registration and note creation publish notification jobs to RabbitMQ when enabled.
- Authenticated users can exchange live chat messages through WebSockets.
- Login/register creates a Redis-backed HTTP-only `connect.sid` session cookie.
- Protected routes accept the Redis session first and fall back to `Authorization: Bearer <token>`.

## Troubleshooting

### Frontend cannot reach backend

- Confirm backend is running on `http://localhost:4000`
- Confirm `VITE_API_BASE_URL` matches the backend URL
- Restart Vite after changing `.env`

### MongoDB connection fails

- Confirm MongoDB is running or Atlas network access is allowed
- Confirm `MONGODB_URI` is correct
- Confirm `MONGODB_DB_NAME` is set

### Port already in use

- Change `PORT` in `server/.env` for the backend
- Change `VITE_API_BASE_URL` in `.env` if backend port changes

## Share Or Push Later

Before pushing or sharing:

- keep `.env` files private
- commit `.env.example` files
- do not commit `node_modules`
- do not rely on local Mongo data being present on another machine

For backend-specific notes, see [server/README.md](D:/projects/syntax/server/README.md:1).
