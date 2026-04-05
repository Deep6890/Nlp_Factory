# 🎙️ Audio Storage + Transcript Backend

A production-ready **Node.js / Express / MongoDB** backend for personal audio file storage with automatic transcript generation.

---

## Features

- **JWT Authentication** — Register, login, protected routes
- **Audio Upload → Cloudinary** — Unique per-user namespaced paths, no overwriting
- **Transcript Pipeline** — Auto-generates transcript after every upload; upload always succeeds even if transcription fails
- **MongoDB Persistence** — Separate `Recording` and `Transcript` collections linked by `recordingId`
- **Paginated APIs** — Fetch all recordings or transcripts with `page` / `limit`
- **Cascade Delete** — Deleting a recording removes the Cloudinary asset and its transcript atomically
- **Admin Role** — Admins can access any user's data
- **Rate Limiting** — Per-route and global protection

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MongoDB + Mongoose |
| File Storage | Cloudinary (resource_type: video for audio) |
| File Upload | Multer (memory storage) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Logging | morgan |

---

## Project Structure

```
src/
├── app.js                  # Express app setup, middleware, routes
├── server.js               # Entry point: connects DB, starts server
├── config/
│   ├── cloudinary.js       # Cloudinary SDK config
│   └── db.js               # MongoDB/Mongoose connection
├── models/
│   ├── User.js             # User schema (name, email, password, role)
│   ├── Recording.js        # Recording schema (cloudUrl, cloudPublicId, …)
│   └── Transcript.js       # Transcript schema (text, keywords, status, …)
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── recordingController.js
│   └── transcriptController.js
├── services/
│   ├── authService.js      # signUp / logIn / generateToken
│   ├── userService.js      # getUserById / updateProfile / getDashboardStats
│   ├── recordingService.js # CRUD for Recording documents
│   ├── transcriptService.js# generateTranscript + all Transcript CRUD
│   └── storageService.js   # uploadToCloud / deleteFromCloud (Cloudinary)
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── recordingRoutes.js
│   └── transcriptRoutes.js
├── middlewares/
│   ├── authMiddleware.js   # protect + restrictTo
│   ├── errorMiddleware.js  # global error handler
│   ├── uploadMiddleware.js # multer audio upload
│   └── rateLimiter.js      # API + auth rate limiters
├── validations/
│   ├── authValidation.js
│   └── recordingValidation.js
└── utils/
    ├── ApiError.js         # Custom error class with factory methods
    ├── ApiResponse.js      # Standardised JSON response shape
    └── logger.js           # morgan + console logger
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string (≥32 chars) |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `TRANSCRIPT_ENGINE_URL` | Your STT service endpoint |

### 3. Run the server

```bash
# Development (hot-reload)
npm run dev

# Production
npm start
```

---

## API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, receive JWT |
| GET | `/auth/me` | ✅ | Get authenticated user (alias) |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | ✅ | Get own profile from MongoDB |
| GET | `/users/dashboard` | ✅ | Recording + transcript stats |
| PUT | `/users/profile` | ✅ | Update name |
| GET | `/users/:userId/audios` | ✅ | All audios for user (use `me` as shorthand) |

### Recordings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/recordings/upload` | ✅ | Upload audio file (field: `audio`) |
| GET | `/recordings` | ✅ | List own recordings |
| GET | `/recordings/:recordingId` | ✅ | Get single recording |
| GET | `/recordings/:recordingId/transcript` | ✅ | Get transcript for a recording |
| DELETE | `/recordings/:recordingId` | ✅ | Delete recording + Cloudinary + transcript |

### Transcripts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/transcripts` | ✅ | List own transcripts |
| GET | `/transcripts/search?q=keyword` | ✅ | Full-text search |
| GET | `/transcripts/:id` | ✅ | Get transcript by id |
| DELETE | `/transcripts/:id` | ✅ | Delete transcript |

### Response Format

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recording fetched",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Recording not found",
  "errors": []
}
```

---

## Cloudinary Storage Pattern

Every upload generates a unique `public_id`:
```
users/<userId>/audio/<timestamp>-<random6hex>
```

- No file is ever overwritten (`overwrite: false`)
- `resource_type: 'video'` is used (Cloudinary's type for audio files)
- Deleting a recording also deletes the Cloudinary asset

---

## Transcript Engine Contract

Your STT service must:

**Accept:** `POST { audio_url: string }`

**Return:**
```json
{
  "text": "transcript text here",
  "language": "en",
  "confidence": 0.95,
  "keywords": ["word1", "word2"],
  "summary": "brief summary"
}
```

If the engine is unavailable or fails, the transcript status is set to `failed` but the recording upload still returns `201`.

---

## Health Check

```
GET /health
→ { "status": "ok", "timestamp": "..." }
```
