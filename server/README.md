# Syntax Server

Express backend for Syntax.

## Responsibilities

- health endpoint
- note CRUD backed by MongoDB
- file CRUD backed by backend disk storage
- centralized API error responses
- per-user scoping using `x-user-email`

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

## File Storage

Uploaded files are stored on disk under `FILE_STORAGE_DIR`.

Per-user separation is implemented as subdirectories under that root, based on the frontend user email.

## API Endpoints

- `GET /api/health`
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

All note and file routes require:

```text
x-user-email: user@example.com
```

Without that header, the server returns `400`.
