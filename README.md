# Syntax

Full-stack Syntax workspace built with:

- React + Vite frontend
- Express backend
- MongoDB for notes
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
- Rich-text editor with notes stored in MongoDB
- File uploads stored by the backend
- File and note listing/download from real server data
- Per-user data scoping based on the current frontend login email

## Prerequisites

- Node.js LTS
- npm
- MongoDB

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
FILE_STORAGE_DIR=server/storage
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

Notes:

- File APIs use backend storage on disk.
- Note APIs use MongoDB.
- Frontend requests include `x-user-email`, so notes/files are scoped per logged-in email.
- Current login/register is frontend-only and does not create a real backend auth session.

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
