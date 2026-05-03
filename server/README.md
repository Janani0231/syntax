# Syntax Server

Express backend for Syntax.

## Responsibilities

- health endpoint
- note CRUD backed by MongoDB
- file CRUD backed by backend disk storage
- centralized API error responses
- JWT authentication and per-user authorization
- Redis-backed `connect.sid` session management
- Redis-backed note caching with safe fallback when Redis is unavailable
- RabbitMQ-backed background notification jobs
- WebSocket chat endpoint for authenticated users

## Environment

Create `server/.env` from the example:

```powershell
Copy-Item .env.example .env
```

Variables:

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

## Install

From the repo root:

```powershell
npm --prefix server install
```

Or from `server/`:

```powershell
npm install
```

## Run

Development:

```powershell
npm run dev
```

Build:

```powershell
npm run build
```

Run built server:

```powershell
npm run start
```

Run notification worker in development:

```powershell
npm run worker:dev
```

Run built notification worker:

```powershell
npm run worker:start
```

## MongoDB

The server expects MongoDB to be reachable through `MONGODB_URI`.

Local example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=syntax
```

Atlas example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=syntax
```

Notes are stored in the `notes` collection.

## RabbitMQ Background Jobs

RabbitMQ is used for background notification jobs. The API publishes jobs when:

- a user registers, simulating a welcome email
- a note is created, simulating a note-created email

Local example:

```env
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_ENABLED=true
NOTIFICATION_QUEUE_NAME=syntax.notifications
```

Start the worker separately from the API server:

```powershell
npm run worker:dev
```

If RabbitMQ is unavailable, API requests still succeed and notification jobs are skipped with a warning.

## Redis Sessions And Cache

The server stores authenticated Express sessions in Redis using the `connect.sid` cookie. Login and registration create a server-side session, and logout destroys that session.

The server also caches frequently accessed note list/detail responses in Redis.

Local example:

```env
REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
NOTE_CACHE_TTL_SECONDS=60
```

If Redis is unavailable, note caching falls back to MongoDB reads. For scalable session storage, keep Redis running in development and production. Note cache entries are invalidated after create, update, and delete operations.

Set `REDIS_ENABLED=false` to disable Redis note caching/session store fallback during local troubleshooting.

## File Storage

Uploaded files are stored on disk under `FILE_STORAGE_DIR`.

Per-user separation is implemented as subdirectories under that root, based on the frontend user email.

## WebSocket Chat

The server exposes an authenticated WebSocket endpoint:

```text
ws://localhost:4000/ws/chat?token=JWT_TOKEN
```

The dashboard uses this endpoint for live workspace chat. The server sends chat history, broadcasts new messages to connected clients, and publishes presence updates.

## API Endpoints

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

## Request Requirements

Register or log in to receive a JWT. Protected note and file routes require:

```text
Authorization: Bearer YOUR_JWT
```

Login/register also set an HTTP-only `connect.sid` session cookie backed by Redis. Protected routes accept the Redis session first and fall back to a JWT bearer token. Without a valid session or token, protected routes return `401`.
