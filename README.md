# SynapseAI

An AI-enhanced collaborative concept mapping tool. Teams share a workspace, build concept maps together in real time, and use Google Gemini to expand nodes, suggest connections, and summarize clusters of ideas.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Domain Model](#domain-model)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Realtime Events](#realtime-events)
- [Project Structure](#project-structure)
- [License](#license)

---

## Features

**Collaborative workspaces**
- Create workspaces ("links") and invite collaborators with a generated invite code.
- Two roles: `owner` and `member`. Only owners can delete a workspace or its boards.
- Every nested resource is access-checked against workspace membership.

**Hierarchical organization**
- Workspaces contain boards, boards contain charts, charts contain ideas.
- Charts store a full graph (`graphNodes` + `graphEdges`) that syncs to the backend.

**Rich idea nodes**
- Topic, description, idea space, GitHub link, progress (0–100), guiding points, constraints, contributors, and likes.
- Up to 5 images per idea, uploaded via Multer and stored on Cloudinary.

**AI assistance (Google Gemini)**
- **Expand node** — suggests 5 related concepts for a node, excluding ones already on the chart.
- **Suggest connections** — proposes up to 6 labeled edges between existing nodes with a confidence score, filtering out connections that already exist in either direction.
- **Summarize cluster** — writes a 2–3 sentence synthesis of a selected group of nodes.

**Realtime collaboration (Socket.IO)**
- Per-chart rooms with authenticated joins.
- Live graph updates, cursor presence, and join/leave notifications.

**Authentication**
- JWT access + refresh tokens delivered as httpOnly cookies.
- Registration, login, logout, token refresh, change password, and email-based forgot/reset password (Nodemailer + Mailgen).

---

## Tech Stack

### Backend (`server/`)

| Concern | Choice |
| --- | --- |
| Runtime | Node.js (ESM) |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Realtime | Socket.IO 4 |
| AI | `@google/generative-ai` (`gemini-1.5-flash`) |
| Auth | `jsonwebtoken`, `bcrypt`, `cookie-parser` |
| Uploads | `multer` → `cloudinary` |
| Email | `nodemailer` + `mailgen` |
| Validation | `express-validator` |

### Frontend (`client/`)

| Concern | Choice |
| --- | --- |
| Framework | React 19 + Vite |
| Routing | React Router 7 |
| State | Zustand |
| Graph canvas | React Flow, D3 |
| Styling | Tailwind CSS 3 |
| UI / motion | Headless UI, Framer Motion, Lucide icons |
| HTTP | Axios (`withCredentials`, refresh-on-401 interceptor) |
| Realtime | `socket.io-client` |
| Toasts | `react-hot-toast` |

---

## Domain Model

```
User
 └─ LinkMember (role: owner | member)
     └─ Link            "workspace" — has an inviteCode
         └─ Board       titles unique per workspace
             └─ Chart   holds graphNodes[] and graphEdges[]
                 └─ Idea
```

**Chart graph shape**

```jsonc
{
  "graphNodes": [
    {
      "nodeId": "n1",
      "label": "Concept",
      "x": 0, "y": 0,
      "color": "#6366f1",
      "size": 24,
      "ideaRef": null,          // optional link to an Idea document
      "isAIGenerated": false,
      "createdBy": "<userId>"
    }
  ],
  "graphEdges": [
    {
      "edgeId": "e1",
      "source": "n1",
      "target": "n2",
      "label": "relates to",
      "isAISuggested": false,
      "confidence": 0.0,
      "accepted": false
    }
  ]
}
```

Every API response is wrapped consistently:

```jsonc
{
  "statusCode": 200,
  "data": { },
  "message": "…",
  "success": true
}
```

Errors return the same envelope with `success: false` and an `errors` array (plus `stack` when `NODE_ENV !== 'production'`).

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or Atlas)
- A Google Gemini API key
- A Cloudinary account (for idea image uploads)
- SMTP credentials (for password-reset email)

### Installation

```bash
git clone <repo-url>
cd SynapseAI

# install both workspaces
npm run install-all

# or individually
cd server && npm install
cd ../client && npm install
```

### Configure the server

```bash
cd server
cp .env.example .env
# fill in the blanks — see below
```

---

## Environment Variables

### `server/.env`

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | HTTP port | `8000` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://127.0.0.1:27017/synapseai` |
| `CORS_ORIGIN` | Allowed origins, comma-separated | `http://localhost:5173` |
| `CLIENT_URL` | Used to build password-reset links | `http://localhost:5173` |
| `BASE_URL` | Public server URL | `http://localhost:8000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `ACCESS_TOKEN_SECRET` | JWT signing secret | — |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime | `1d` |
| `REFRESH_TOKEN_SECRET` | Refresh JWT secret | — |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime | `10d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | — |
| `SMTP_HOST` / `SMTP_PORT` | Mail server | `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | Mail credentials | — |
| `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | Sender identity | `SynapseAI` |
| `GEMINI_API_KEY` | Google Generative AI key | — |

### `client/.env`

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Server origin, used for both REST and Socket.IO | `http://localhost:8000` |

> `CORS_ORIGIN` must include the client origin exactly — the server sends credentialed responses, so a wildcard origin will be rejected by the browser.

---

## Running the App

Run each side in its own terminal:

```bash
# terminal 1 — API + Socket.IO on :8000
cd server
npm run dev      # nodemon
# npm start      # plain node

# terminal 2 — Vite dev server on :5173
cd client
npm run dev
```

Verify the backend with `GET http://localhost:8000/api/v1/healthcheck`.

Other client scripts:

```bash
npm run build     # production bundle
npm run preview   # serve the build
npm run lint      # eslint
```

---

## API Reference

Base path: `/api/v1`. All routes below the auth section require a valid `accessToken` cookie, and all nested routes additionally verify workspace membership.

### Health

| Method | Endpoint |
| --- | --- |
| `GET` | `/healthcheck` |

### Auth — `/users`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/register` | — | Create an account |
| `POST` | `/login` | — | Sets access + refresh cookies |
| `POST` | `/refreshAccessToken` | — | Rotate tokens from the refresh cookie |
| `POST` | `/forgot-password` | — | Email a reset link |
| `POST` | `/reset-password/:resetToken` | — | Consume the reset token |
| `POST` | `/logout` | ✅ | Clear cookies, drop stored refresh token |
| `GET` | `/getCurrentUser` | ✅ | Current session user |
| `POST` | `/change-password` | ✅ | Change password while logged in |

### Workspaces — `/links`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/` | Create a workspace (creator becomes `owner`) |
| `GET` | `/` | List workspaces the user belongs to, with role |
| `POST` | `/join` | Join via `inviteCode` |
| `GET` | `/:linkId` | Workspace detail with populated boards |
| `DELETE` | `/:linkId` | Owner only |

### Boards — `/links/:linkId/boards`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/` | Create a board |
| `GET` | `/` | List boards |
| `GET` | `/:boardId` | Board detail |
| `PATCH` | `/:boardId` | Update title/description |
| `DELETE` | `/:boardId` | Owner only |

### Charts — `/links/:linkId/boards/:boardId/charts`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/` | Create a chart |
| `GET` | `/` | List charts |
| `GET` | `/:chartId` | Chart detail including the graph |
| `PATCH` | `/:chartId/sync` | Persist `graphNodes` + `graphEdges` |
| `DELETE` | `/:chartId` | Delete a chart |

### Ideas — `.../charts/:chartId/ideas`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/` | Create an idea (`multipart/form-data`, field `images`, max 5) |
| `GET` | `/` | List ideas on the chart |
| `GET` | `/:ideaId` | Idea detail |
| `PATCH` | `/:ideaId` | Update (also accepts images) |
| `DELETE` | `/:ideaId` | Delete, broadcasting removal to the chart room |

### AI — `.../charts/:chartId/ai`

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| `POST` | `/expand-node` | `{ nodeLabel, chartContext? }` | `{ suggestions: string[5] }` |
| `POST` | `/suggest-connections` | — (reads chart nodes) | `{ suggestions: [{ source, target, label, confidence }] }` |
| `POST` | `/summarize-cluster` | `{ nodeIds: string[] }` (≥2) | `{ summary, concepts }` |

A Postman collection covering these endpoints is checked in at [SynapseAi.postman_collection.json](SynapseAi.postman_collection.json).

---

## Realtime Events

The Socket.IO handshake is authenticated from the `accessToken` cookie, falling back to `handshake.auth.token` for manual testing. Rooms are keyed by `chartId`, and joins are re-checked against `LinkMember` before admission.

**Client → Server**

| Event | Payload |
| --- | --- |
| `join-chart` | `chartId` |
| `leave-chart` | `chartId` |
| `graph-updated` | `{ chartId, graphNodes, graphEdges }` |
| `cursor-move` | `{ chartId, x, y }` |

**Server → Client**

| Event | Payload |
| --- | --- |
| `user-joined` | `{ userId, username, avatar }` |
| `user-left` | `{ userId, username }` |
| `graph-updated` | `{ graphNodes, graphEdges, updatedBy }` |
| `cursor-move` | `{ userId, username, x, y }` |
| `error` | `{ message }` |

Broadcasts are scoped with `socket.to(chartId)`, so the sender never echoes its own event.

---

## Project Structure

```
SynapseAI/
├── client/
│   └── src/
│       ├── api/axiosInstance.js     # base client + 401 refresh interceptor
│       ├── components/              # Navbar, Modal
│       ├── pages/                   # Login, Register, Dashboard, Workspace, Board, Chart, …
│       ├── store/useAuthStore.js    # Zustand auth state
│       ├── utils/socket.js          # shared Socket.IO client
│       └── App.jsx                  # routes + ProtectedRoute
├── server/
│   └── src/
│       ├── app.js                   # express app, route mounting, error handler
│       ├── index.js                 # http server, Socket.IO, DB bootstrap
│       ├── controllers/             # auth, link, board, chart, idea, ai, healthcheck
│       ├── middlewares/             # auth, link/board/chart access, multer, validate
│       ├── models/                  # user, link, linkMembers, board, chart, idea
│       ├── routes/                  # one router per resource, nested with mergeParams
│       ├── sockets/handlers.js      # realtime auth + chart rooms
│       ├── utils/                   # ApiError, ApiResponse, asyncHandler, cloudinary, mailer
│       └── validators/              # express-validator chains
├── SynapseAi.postman_collection.json
└── package.json                     # workspace-level scripts
```

Nested routers use `Router({ mergeParams: true })` so child routes can read parent params (`:linkId`, `:boardId`, `:chartId`) for their access checks.

---

## License

MIT — see [LICENSE](LICENSE).
