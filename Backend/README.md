# CampusLink Backend (Node.js + Express + MongoDB)

This is a minimal backend for the CampusLink React Native app. It provides authentication, posts, likes, comments, and image upload endpoints.

## Features

- JWT auth (register/login/me/update profile)
- Posts feed, create post, like/unlike, share counter
- Comments: list and add
- Image uploads stored locally and served statically
- CORS enabled for Expo dev URLs

## Quick start

### 1) Prerequisites

- Node.js 18+
- MongoDB running locally (or Docker)

### 2) Setup

Copy environment variables:

```bash
cp .env.example .env
# then edit .env if needed
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm run dev
```

Server runs on http://localhost:4000 and exposes `/health`.

### 3) Run MongoDB (option A: local install)

- Install MongoDB Community and ensure it runs on `mongodb://localhost:27017`

### 3) Run MongoDB (option B: Docker)

Create `docker-compose.yml` (optional) next to this README:

```yaml
version: "3.8"
services:
  mongo:
    image: mongo:6
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
volumes:
  mongo-data:
```

Then start:

```bash
docker compose up -d
```

## API Overview

Base URL: `http://localhost:4000`

Auth:

- POST `/api/auth/register` { email, password, full_name?, department?, batch? }
- POST `/api/auth/login` { email, password }
- GET `/api/auth/me` (Bearer token)
- PUT `/api/auth/me` (Bearer token) { full_name?, department?, batch?, phone?, bio?, avatar_url? }

Posts:

- GET `/api/posts/feed` -> { posts: [...] }
- POST `/api/posts` (Bearer token) { content, category?, privacy?, image_urls?, feeling?, event_details?, tags? }
- POST `/api/posts/:postId/like` (Bearer token)
- DELETE `/api/posts/:postId/like` (Bearer token)
- POST `/api/posts/:postId/share` (Bearer token)

Comments:

- GET `/api/comments/:postId`
- POST `/api/comments/:postId` (Bearer token) { content }

Uploads:

- POST `/api/uploads` (Bearer token, form-data: file)
  - returns `{ url }` to store in `image_urls`

## Integrating with the React Native app

1. Create a small API client: `CampusLink-main/lib/api.js`:

   - Use `fetch` to call the above endpoints. Store JWT in `AsyncStorage`.
   - Replace Supabase calls in screens with these endpoints incrementally:
     - FeedScreen: replace posts fetch with `GET /api/posts/feed`
     - PostCreationScreen: replace image upload with `POST /api/uploads` then `POST /api/posts`
     - Likes/comments: map to the provided endpoints
   - AuthContext: swap signIn/signUp/signOut and profile fetch/update to backend endpoints.

2. Add an env var for the mobile app (e.g. `.env` in Expo):

   - `EXPO_PUBLIC_API_BASE=http://<your-machine-ip>:4000`
   - On Android emulator: `http://10.0.2.2:4000`

3. Test on device/emulator
   - Ensure the phone can reach your dev machine IP.
   - Update CORS origins in backend `.env` if needed.

## Notes

- This backend intentionally mirrors the minimal data the current UI expects.
- Extend schemas and endpoints as you add features (groups, chat, polls, etc.).
