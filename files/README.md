# MERN File Explorer — Full Stack

Windows 11-style File Explorer upgraded from a mock JS object to a real MERN backend.

## Architecture

```
Loss.html (mock)          →   Real MERN Stack
─────────────────────────────────────────────
db { }                    →   MongoDB / Mongoose
API.getFolderContent()    →   GET  /api/folders/:id
API.createFolder()        →   POST /api/folders
API.renameItem()          →   PATCH /api/items/:id
API.deleteItem()          →   DELETE /api/items/:id
(new) uploadFile()        →   POST /api/files/upload  → AWS S3
(new) getDownloadUrl()    →   GET  /api/files/:id/download
```

## Quick Start (Docker)

```bash
# 1. Copy and fill in your env vars
cp server/.env.example .env

# 2. Start everything
docker compose up --build

# 3. Open the app
open http://localhost:3000

# 4. Seed initial data (first run only)
curl -X POST http://localhost:5000/api/seed
```

## Local Development (no Docker)

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Express Server
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev            # nodemon watches for changes

# Terminal 3 — Frontend (just open the file)
open client/index.html
# or serve with: npx serve client
```

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| GET    | /api/health | Server + MongoDB health check |
| GET    | /api/folders/:id | List items inside a folder |
| POST   | /api/folders | Create a new folder |
| POST   | /api/files/upload | Upload file → S3 + MongoDB |
| GET    | /api/files/:id/download | Get signed S3 download URL |
| PATCH  | /api/items/:id | Rename an item |
| DELETE | /api/items/:id | Delete item + all children (recursive) |
| POST   | /api/seed | Reset DB to initial folder tree |

## AWS S3 Setup

1. Create an S3 bucket in your preferred region
2. Enable CORS on the bucket:
```json
[{
  "AllowedOrigins": ["http://localhost:3000"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"]
}]
```
3. Create an IAM user with `AmazonS3FullAccess` (or scoped policy)
4. Add credentials to your `.env` file

## Deployment (DigitalOcean / Azure)

```bash
# Build and push image
docker build -f docker/Dockerfile -t file-explorer-api ./server
docker tag file-explorer-api your-registry/file-explorer-api:latest
docker push your-registry/file-explorer-api:latest

# On the server
docker compose -f docker-compose.yml up -d
```

## File Structure

```
mern-file-explorer/
├── server/
│   ├── server.js        ← Express + Mongoose + S3
│   ├── package.json
│   └── .env.example
├── client/
│   └── index.html       ← Updated Loss.html (real fetch() API calls)
├── docker/
│   └── Dockerfile
└── docker-compose.yml
```
