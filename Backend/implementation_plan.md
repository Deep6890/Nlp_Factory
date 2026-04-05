# Voice Recorder + Transcript + Finance Backend

A production-ready Node.js/Express REST API backend that supports user auth, audio upload → cloud storage, speech-to-text transcription, and a personal financial history module — all linked per-user.

---

## Architecture Overview

```
Client (Mobile / Web)
       │
       ▼
  Express Router  ──► Validation Middleware ──► Auth Middleware
       │
       ▼
  Controller  (only HTTP in/out)
       │
       ▼
  Service Layer  (all business logic lives here)
    ├── authService        → JWT + bcrypt
    ├── userService        → profile ops
    ├── storageService     → cloud upload / delete
    ├── recordingService   → save metadata to MongoDB
    ├── transcriptService  → STT call + save to MongoDB
    └── financeService     → CRUD on FinancialEntry
       │
       ▼
  Mongoose Models  (pure schema, no logic)
    ├── User
    ├── Recording
    ├── Transcript
    └── FinancialEntry
       │
       ▼
  MongoDB Atlas
```

**Data flow (audio upload):**
1. Client POSTs multipart audio with JWT header
2. Auth middleware validates token → attaches `req.user`
3. Multer middleware buffers the file in memory
4. `recordingController` calls `storageService.upload()` → gets public URL
5. `recordingService.create()` saves metadata doc to MongoDB
6. `transcriptService.generate()` sends URL to STT → saves transcript doc
7. Response: `{ recording, transcript }` returned to client

---

## Folder Structure

```
d:\services\
├── src/
│   ├── config/
│   │   ├── db.js            ← Mongoose connection
│   │   └── cloudinary.js    ← Cloudinary SDK init (or S3)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── recordingController.js
│   │   ├── transcriptController.js
│   │   ├── financeController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Recording.js
│   │   ├── Transcript.js
│   │   └── FinancialEntry.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── recordingRoutes.js
│   │   ├── transcriptRoutes.js
│   │   ├── financeRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── storageService.js
│   │   ├── recordingService.js
│   │   ├── transcriptService.js
│   │   └── financeService.js
│   ├── middlewares/
│   │   ├── authMiddleware.js    ← JWT guard
│   │   ├── uploadMiddleware.js  ← Multer config
│   │   ├── errorMiddleware.js   ← Global error handler
│   │   └── rateLimiter.js
│   ├── validations/
│   │   ├── authValidation.js
│   │   ├── recordingValidation.js
│   │   └── financeValidation.js
│   ├── utils/
│   │   ├── ApiError.js          ← Custom error class
│   │   ├── ApiResponse.js       ← Uniform response wrapper
│   │   └── logger.js            ← Morgan / winston wrapper
│   ├── app.js                   ← Express app + all middleware
│   └── server.js                ← HTTP server entry point
├── .env.example
├── package.json
└── README.md
```

---

## Complete API List

### Auth  `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | ✗ | Register new user |
| POST | `/login` | ✗ | Login, return JWT |
| GET | `/me` | ✔ | Get own profile |

### Recordings  `/api/v1/recordings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | ✔ | Upload audio, trigger STT |
| GET | `/` | ✔ | List all user recordings |
| GET | `/:id` | ✔ | Get single recording details |
| DELETE | `/:id` | ✔ | Delete recording + cloud file |

### Transcripts  `/api/v1/transcripts`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✔ | List all transcripts (+ date filter) |
| GET | `/:id` | ✔ | Get single transcript |
| GET | `/search` | ✔ | Search by keyword |
| DELETE | `/:id` | ✔ | Delete transcript |

### Financial History  `/api/v1/finance`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ✔ | Add financial entry |
| GET | `/` | ✔ | List all entries (+ date filter) |
| GET | `/:id` | ✔ | Get single entry |
| PUT | `/:id` | ✔ | Update entry |
| DELETE | `/:id` | ✔ | Delete entry |

### User Dashboard  `/api/v1/user`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | ✔ | Aggregated stats |
| PUT | `/profile` | ✔ | Update profile |

---

## Proposed Changes

### Config

#### [NEW] `src/config/db.js`
MongoDB connection with retry logic.

#### [NEW] `src/config/cloudinary.js`
Cloudinary SDK configured from env vars. (Can be swapped for S3 by changing `storageService.js` only.)

---

### Models

#### [NEW] `src/models/User.js`
Fields: `name`, `email` (unique), `passwordHash`, `createdAt`.
Methods: `comparePassword()`.

#### [NEW] `src/models/Recording.js`
Fields: `userId` (ref User), `filename`, `cloudUrl`, `cloudPublicId`, `duration`, `mimeType`, `size`, `createdAt`.

#### [NEW] `src/models/Transcript.js`
Fields: `userId` (ref User), `recordingId` (ref Recording), `text`, `language`, `confidence`, `keywords[]`, `summary`, `createdAt`.

#### [NEW] `src/models/FinancialEntry.js`
Fields: `userId` (ref User), `transcriptId` (ref Transcript, nullable), `amount`, `type` (income|expense), `category`, `note`, `date`, `createdAt`.

---

### Services

#### [NEW] `src/services/authService.js`
`signUp()`, `logIn()`, `generateToken()`, `hashPassword()`, `comparePassword()`

#### [NEW] `src/services/storageService.js`
`uploadToCloud(buffer, mimetype)` → `{ url, publicId }`  
`deleteFromCloud(publicId)`

#### [NEW] `src/services/recordingService.js`
`createRecording(userId, meta)`, `getUserRecordings(userId, filters)`, `getRecordingById(id, userId)`, `deleteRecording(id, userId)`

#### [NEW] `src/services/transcriptService.js`
`generateTranscript(cloudUrl)` → calls AssemblyAI API  
`saveTranscript(userId, recordingId, data)`, `getUserTranscripts(userId, filters)`, `searchTranscripts(userId, keyword)`, `deleteTranscript(id, userId)`

#### [NEW] `src/services/financeService.js`
Full CRUD + date range filtering

#### [NEW] `src/services/userService.js`
`getUserById()`, `updateProfile()`, `getDashboardStats()` (aggregates counts)

---

### Middlewares

#### [NEW] `src/middlewares/authMiddleware.js`
Verifies JWT → attaches `req.user`. Returns 401 on failure.

#### [NEW] `src/middlewares/uploadMiddleware.js`
Multer `memoryStorage` for audio files up to 50 MB. Accepts `audio/*`.

#### [NEW] `src/middlewares/errorMiddleware.js`
Catches `ApiError` and generic errors, returns JSON with `success: false`.

#### [NEW] `src/middlewares/rateLimiter.js`
`express-rate-limit` — 100 req/15 min (stricter on auth routes).

---

### Utils

#### [NEW] `src/utils/ApiError.js`
Custom error class with `statusCode` + `message`.

#### [NEW] `src/utils/ApiResponse.js`
Uniform `{ success, statusCode, message, data }` response object.

---

### Entry Points

#### [NEW] `src/app.js`
Registers: helmet, cors, morgan, rate limiter, json parser, all routes, 404 handler, global error handler.

#### [NEW] `src/server.js`
Calls `connectDB()`, starts `app.listen()`.

#### [NEW] `.env.example`
All required environment variables documented.

#### [NEW] `package.json`
All dependencies + `dev` / `start` scripts.

---

## Open Questions

> [!IMPORTANT]
> **Cloud Storage Provider** – The plan uses **Cloudinary** (free tier, no credit card). Do you want to use **AWS S3** instead? Cloudinary can be swapped by editing only `storageService.js`.

> [!IMPORTANT]
> **Speech-to-Text Provider** – The plan uses **AssemblyAI** (generous free tier, simple REST API). Do you want **Google Cloud STT**, **OpenAI Whisper API**, or **Azure Cognitive Services** instead?

> [!NOTE]
> If you keep Cloudinary + AssemblyAI, you need free API keys at [cloudinary.com](https://cloudinary.com) and [assemblyai.com](https://www.assemblyai.com). Instructions will be in `.env.example`.

---

## Verification Plan

### Automated
- `npm install` — verify no dependency errors
- `node src/server.js` — verify server starts and DB connects

### Manual (via curl / Postman)
1. `POST /api/v1/auth/signup` → get JWT
2. `POST /api/v1/auth/login` → confirm token
3. `POST /api/v1/recordings/upload` (multipart) → confirm cloud URL + transcript saved
4. `GET /api/v1/transcripts` → confirm stored
5. `POST /api/v1/finance` → link to transcript
6. `GET /api/v1/user/dashboard` → aggregated stats

---

## Dependency Installation

```bash
npm install express mongoose dotenv bcryptjs jsonwebtoken multer \
  cloudinary assemblyai cors helmet morgan express-rate-limit \
  express-validator

npm install --save-dev nodemon
```
