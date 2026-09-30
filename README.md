<div align="center">

# 🧿 FreelanceHub

### *Connect freelancers with clients, seamlessly*

A full-stack MERN freelancing marketplace with real-time chat, escrow-backed payments, escrow disputes, reviews, and a complete admin moderation suite.

![Mongoose](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-764ABC?style=flat-square&logo=redux&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

[**Live Demo**](#-demo) · [**Architecture**](#-system-architecture) · [**Installation**](#-installation) · [**API Suites**](#-testing--quality-assurance)

</div>

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Objectives](#-objectives)
4. [Features](#-features)
5. [User Roles](#-user-roles)
6. [Technology Stack](#-technology-stack)
7. [System Architecture](#-system-architecture)
8. [MVC Architecture](#-mvc-architecture)
9. [Database Models](#-database-models)
10. [Authentication Flow](#-authentication-flow)
11. [Client Workflow](#-client-workflow)
12. [Freelancer Workflow](#-freelancer-workflow)
13. [Admin Workflow](#-admin-workflow)
14. [Installation](#-installation)
15. [Environment Variables](#-environment-variables)
16. [Run Instructions](#-run-instructions)
17. [Testing & Quality Assurance](#-testing--quality-assurance)
18. [Screenshots](#-screenshots)
19. [Demo & Repository](#-demo--repository)
20. [Future Enhancements](#-future-enhancements)

---

## 🌟 Project Overview

**FreelanceHub** is a production-shaped freelancing platform where clients post projects, freelancers bid on them, both parties collaborate through real-time chat, and work flows through a guarded lifecycle:

```
Open → In Progress → Submitted → Completed
         (revision loop: Submitted → In Progress ⇄ Submitted)
```

Payments are modeled as **escrow transactions** (Pending → Completed / Refunded / Failed), disputes go through an **admin-moderated state machine** (Open → Under Review → Resolved → Closed), and both parties rate each other after completion. A full **admin console** handles user verification, project moderation, transaction oversight, and dispute resolution.

> **Stack:** React 19 · Redux Toolkit · Vite · Bootstrap 5 · MUI icons · ReactBits animations · Express 5 · Mongoose · Socket.IO · JWT · Multer

## ❗ Problem Statement

Hiring remotely is fragmented: clients struggle to find verified talent, freelancers struggle to find legitimate work, and once hired, communication, milestone tracking, payment safety, and accountability are scattered across disconnected tools. Trust breaks down — there is no structured way to submit work, request revisions, hold payment in escrow, resolve disputes, or build a portable reputation.

FreelanceHub solves this with **one platform** that carries a project from posting to payment — with real-time communication, guarded state transitions, escrow-style transactions, mutual reviews, and admin oversight built in.

## 🎯 Objectives

- Provide a **secure, role-based marketplace** (Client / Freelancer / Admin) authenticated with JWT + bcrypt.
- Give clients a complete **project lifecycle**: post, review bids, select talent, chat, review submitted work, request revisions, complete, and rate.
- Give freelancers **discoverability**: search/filter projects, bid, track applications, submit work, and grow a reputation score.
- Guarantee **trust & safety**: guarded workflow states, escrow-style transactions, disputes, admin moderation, and verification.
- Deliver **real-time UX**: Socket.IO chat with unread tracking and 7 notification types with live counts.
- Keep the codebase **clean, testable, and documented**: MVC separation, centralized error handling, paginated + indexed queries, automated API test suites.

## ✨ Features

### 🔐 Authentication & Security
- Register / Login / Logout with **JWT** (30-day expiry) and **bcryptjs** (10 salt rounds)
- Public registration restricted to **Client** and **Freelancer** (admins are seeded, never self-registered)
- `protect` middleware (token → user hydration → `isActive` check) and `authorize(...roles)` role gate
- Passwords excluded from every API projection (`select: false`)
- Centralized error handler: JSON 404s, validation → 400, CastError → 404, multer → 400, expired JWT → 401
- Global frontend 401 interceptor → silent logout + "session expired" toast

### 👤 Client
- Project CRUD (title, description, category, required skills, budget, duration, deadline) — starts **Open**
- Application management: view bids, **approve one freelancer**, reject others (double-approval blocked)
- Approval auto-creates **escrow transaction (Pending)**, a chat room, and freelancer notification
- Chat with the approved freelancer (text + file attachments, read/unread)
- Work review loop: **request revision** → resubmit → **mark completed** → escrow released
- Mutual **1–5★ reviews** after completion (duplicate + self-review guards, rating aggregation)
- Browse freelancers, browse/review own applications, transaction history + summary

### 💼 Freelancer
- Rich profile: skills, experience, bio, portfolio items
- Browse/search/filter projects (text search, category, skill, budget range, pagination)
- Bid with proposal + amount + duration (**duplicate-bid guard**), track application status
- Real-time chat with the client once approved
- **Submit work** (link + description) → project enters `Submitted`
- Ratings, review history, personalized dashboard

### 🛡️ Admin
- Seeded on boot from environment variables
- Dashboard stats (users, projects, applications, transactions, disputes) + analytics page with CSS charts
- User management: search, **verify**, activate/deactivate (deactivation blocks login **and** invalidates live tokens)
- Project moderation: suspend (→ Cancelled) / restore (→ Open); active & completed projects are protected and routed to disputes
- Transaction monitoring with status filters; dispute lifecycle with **enforced transitions** and history
- Full-text **audit trail** — every dispute change is appended to its history

### 🔔 Real-Time
- Socket.IO authenticated with the same JWT (handshake verification)
- Chat rooms per project, message persistence, unread counts, "read" receipts
- Notifications for: `application_approved`, `work_submitted`, `revision_requested`, `project_completed`, `payment_released`, `new_review`, `dispute_updated` — with live bell counts and React Toastify toasts

### 📎 File Uploads
- Multer disk storage for chat attachments: **10 MB limit**, MIME allow-list (images, PDF, Office, text, archives)
- Served statically from `/uploads`, validated server-side with clean 400s

## 👥 User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **Client** | `/client/*` | Post/manage projects, approve/reject bids, chat, review work, request revisions, complete projects, rate freelancers, raise disputes |
| **Freelancer** | `/freelancer/*` | Build profile/portfolio, search projects, bid, chat, submit work, resubmit after revisions, rate clients |
| **Admin** | `/admin/*` | Verify/deactivate users, moderate projects, monitor applications & transactions, resolve disputes, view stats & analytics |
| **Guest** | public pages | Home, public project feed (Open only), register/login |

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | **React 19 + Vite 8** | SPA with fast HMR and production builds |
| State | **Redux Toolkit** | Global slices: auth, projects, freelancer, notifications, app health |
| Routing | **react-router-dom 7** | Public + role-protected route tables |
| Styling | **Bootstrap 5 · MUI icons · custom design system** | Responsive layouts, `fh-*` component kit |
| Animation | **ReactBits** (vendored) · **GSAP** · **Motion** | SplitText hero, spotlight cards, fade/scroll reveals |
| HTTP | **Axios** | JWT request interceptor, response normalization, 401 handler |
| Backend | **Express 5 (Node.js)** | REST API + Socket.IO server |
| Database | **MongoDB + Mongoose 8** | 9 models, compound + text indexes |
| Realtime | **Socket.IO** | Authenticated chat + notification rooms |
| Auth | **jsonwebtoken + bcryptjs** | Stateless JWT, salted password hashing |
| Uploads | **Multer** | Disk storage with type/size validation |
| Testing | **Node test scripts + jsdom** | 5 API suites + SSR render smoke harness |

## 🏛 System Architecture

```
┌───────────────────────────────┐         ┌──────────────────────────────────┐
│   React SPA (Vite :5173)      │  REST   │      Express API (:5000)         │
│  ┌─────────────────────────┐  │◄───────►│  ┌────────────────────────────┐  │
│  │ Redux Toolkit slices    │  │  JSON   │  │ Routes → Middleware →      │  │
│  │ Axios + JWT interceptor │  │         │  │ Controllers (MVC)          │  │
│  │ Role-protected routes   │  │  WS     │  ├────────────────────────────┤  │
│  │ Toastify + toasts       │◄─┼────────►│  │ Socket.IO (JWT handshake)  │  │
│  └─────────────────────────┘  │Socket.IO│  ├────────────────────────────┤  │
└───────────────────────────────┘         │  │ Mongoose models + indexes  │  │
                                          │  ├────────────────────────────┤  │
                                          │  │ Multer → /uploads/chat     │  │
                                          │  └─────────────┬──────────────┘  │
                                          └────────────────┼─────────────────┘
                                                           ▼
                                                ┌────────────────────┐
                                                │  MongoDB (freelance│
                                                │  hub)  ·  Mongoose │
                                                └────────────────────┘
```

![Technical Architecture](./Project%20Architecture/Technical%20Architecture/Architecture.png)

The browser talks to one origin: Vite proxies `/api` and `/uploads` and upgrades `/socket.io` to the Express server, so the SPA never hardcodes a backend host.

## 🧩 MVC Architecture

Every feature follows the same clean pipeline:

```
route  →  middleware(protect / authorize)  →  controller  →  model  →  JSON response
              │                                    │
              └─ JWT verify + role gate            └─ business logic only (no HTTP leakage)
```

| MVC Layer | Location | Responsibility |
|-----------|----------|----------------|
| **Models** | `Server/models/` | Schemas, validation, indexes, password hooks, rating aggregation |
| **Views** | `Client/src/` (pages + components) | Role-based pages, `fh-*` design system, states (loading/error/empty) |
| **Controllers** | `Server/controllers/` | Request handling + business rules, `try/catch → next(error)` |
| **Routes** | `Server/routes/` | URL mapping + middleware chains |
| **Middleware** | `Server/middleware/` | `authMiddleware` (protect/authorize), `errorHandler` (JSON 404/5xx/400) |
| **Config/Utils** | `Server/config`, `Server/utils` | DB connection, token generation, admin seeding |

![MVC Architecture](./Project%20Architecture/MVC%20diagram/MVC.png)

## 🗄 Database Models

| Model | Key Fields | Indexes |
|-------|-----------|---------|
| **User** | name, email *(unique)*, password *(select:false)*, role, skills, experience, portfolio, rating, totalReviews, isVerified, isActive | text(`name, skills, bio`), `{role, rating}`, email unique |
| **Project** | client, title, description, category, requiredSkills, budget, duration, deadline, status, selectedFreelancer | text(`title, description, category`), `{status, createdAt}`, `{category, status}`, `{client, status}` |
| **Application** | project, freelancer, proposal, bidAmount, estimatedDuration, status | **unique** `{project, freelancer}`, `{project, status}`, `{freelancer, status}`, `{createdAt}` |
| **Chat** | project, client, freelancer, participants[], lastMessage | **unique** `{project, client, freelancer}`, `{participants}`, `{updatedAt}` |
| **Message** | chat, sender, message, attachments[], read, readAt | `{chat, createdAt}`, `{chat, read}`, `{sender, createdAt}` |
| **Notification** | recipient, type, title, message, isRead, relatedProject | `{recipient, isRead, createdAt}` |
| **Transaction** | project, client, freelancer, amount, status, provider, refund reasons | `{client, createdAt}`, `{freelancer, createdAt}`, `{project, status}` |
| **Dispute** | project, raisedBy, reason, description, status, resolution, history[] | `{status, createdAt}`, `{project, status}` |
| **Review** | project, reviewer, reviewedUser, rating, comment | **unique** `{project, reviewer}`, `{reviewedUser, createdAt}` |

> 🔎 **Performance:** every list endpoint is paginated (`page`/`limit` + `total`/`totalPages`), chat history returns the most recent window by default, hot fields are covered by compound indexes, and password fields are excluded from all projections.

## 🔑 Authentication Flow

```
Register ──► bcrypt.hash(password, 10) ──► User saved ──► JWT sign {id, role} (30d)
Login     ──► find(+password) ──► bcrypt.compare ──► isActive? ──► token + user JSON
                                                    (403 if deactivated)

Subsequent requests:
  Axios ──► Authorization: Bearer <jwt>
              ──► protect:  jwt.verify ──► User.findById(decoded.id, -password)
                                            ──► 401 if missing/inactive/expired
              ──► authorize('Admin', ...): 403 if role mismatch
              ──► controller

Socket.IO handshake ──► handshake.auth.token ──► jwt.verify ──► socket.userId / userRole
Global 401 (frontend) ──► Axios interceptor ──► local logout + toast
```

- **Refresh-free rehydration**: on app load the token in `localStorage` re-fetches `/api/auth/me`.
- **Deactivation is instant**: `protect` re-reads the user on every request, so a revoked account loses access mid-session.

## 🔄 Client Workflow

```
Register/Login ──► Post Project (Open)
       ──► Applications list (bids stream in, freelancer notified)
       ──► Approve one freelancer ──► project = In Progress
             ├─► escrow Transaction created (Pending)
             ├─► Chat room created (both participants)
             ──► Chat ⇄ exchange messages + attachments
       ──► Work submitted (project = Submitted) ──► notify client
             ├─► Request Revision ──► In Progress ──► resubmit ──► Submitted
             ──► Mark Completed ──► escrow Released (Completed) ──► notify freelancer
       ──► Rate the freelancer 1–5★ + comment (once)
       ──► (optional) Raise dispute before completion
```

## 💼 Freelancer Workflow

```
Register/Login ──► Complete profile (skills / experience / portfolio)
       ──► Browse projects ──► search / category / skill / budget filters
       ──► Open project ──► Submit bid (proposal + amount + duration)
             └─► duplicate bid blocked (400)
       ──► Track applications (Pending / Approved / Rejected)
       ──► On approval: chat opens with the client
       ──► Submit work (link + description) ──► project = Submitted
             └─► only the selected freelancer may submit (403 otherwise)
       ──► Revise on request, resubmit
       ──► Payment released automatically on completion (notification)
       ──► Rate the client 1–5★ ──► rating aggregated onto profile
```

## 🛡 Admin Workflow

```
Seeded on boot (ADMIN_EMAIL / ADMIN_PASSWORD)
       ──► Dashboard stats + Analytics page (CSS charts, no chart lib)
       ──► Users: search → verify / deactivate / reactivate
             └─► deactivation blocks login AND invalidates live JWTs
       ──► Projects: monitor → suspend (Open → Cancelled) / restore
             └─► In Progress / Submitted / Completed protected → dispute route
       ──► Transactions: filter by status, audit escrow volume
       ──► Disputes: Open → Under Review → Resolved → Closed
             └─► invalid jumps rejected (e.g. Open → Closed = 400)
             └─► every transition appends to history + notifies both parties
```

![ER Diagram](./Project%20Architecture/Er%20Diagram/user%20flow.png)

## 📦 Installation

**Prerequisites:** Node.js **20 LTS or newer**, npm, MongoDB **6+** (local service or Atlas URI).

```bash
# 1. Clone the repository
git clone https://github.com/lavanyabhiste/FreelanceHub---Connect-freelancers-with-clients-seamlessly.git
cd FreelanceHub---Connect-freelancers-with-clients-seamlessly

# 2. Install backend dependencies
cd Server
npm install

# 3. Configure the backend environment
copy .env.example .env      # Windows  (macOS/Linux: cp .env.example .env)
#    → edit .env and set a strong JWT_SECRET + ADMIN_PASSWORD

# 4. Install frontend dependencies (new terminal)
cd ../Client
npm install
```

> ⚙️ `.env` is listed in `.gitignore` — **never commit it**. `.env.example` documents every variable with safe placeholders.

## 🔐 Environment Variables

`Server/.env` (all keys documented in `Server/.env.example`):

| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Express + Socket.IO port |
| `NODE_ENV` | `development` | `production` hides stack traces in errors |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/freelancehub` | MongoDB connection string |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin (Vite dev server) |
| `JWT_SECRET` | *(strong random string)* | **Required** — server refuses to boot without it |
| `JWT_EXPIRE` | `30d` | Token lifetime |
| `ADMIN_NAME` | `FreelanceHub Admin` | Seeded admin display name |
| `ADMIN_EMAIL` | `admin@freelancehub.com` | Seeded admin login |
| `ADMIN_PASSWORD` | *(strong random string)* | **Required** — admin seeding fails without it |

The frontend needs **no** environment file (Vite proxies `/api` → `http://localhost:5000`).

## ▶️ Run Instructions

**Terminal 1 — backend** (auto-seeds the admin account on boot):

```bash
cd Server
npm run dev        # or: node server.js
# ✓ MongoDB Connected · ✓ [Admin Seeder] · Server running on port 5000
```

**Terminal 2 — frontend:**

```bash
cd Client
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** — or run the seeded admin console at `/login` with the credentials from your `.env`.

<details>
<summary><b>Other useful scripts</b></summary>

```bash
# Client
npm run dev          # Vite dev server (:5173)
npm run build        # Production build
npm run lint         # oxlint (0 errors)
npm run test:ui      # 30-page SSR render smoke suite

# Server (with the API running on :5000)
node e2e-full-test.js       # 118 checks: auth, roles, CRUD, chat, uploads, admin
node e2e-workflow-test.js   # 20 checks: full client ↔ freelancer lifecycle
node e2e-admin-test.js      # 43 checks: admin console + dispute state machine
node e2e-txn-paths-test.js  # 11 checks: refund/release/failure transaction paths
node e2e-ui-apis-test.js    # 14 checks: public feed + client aggregate APIs
```
</details>

## 🧪 Testing & Quality Assurance

| Suite | Scope | Result |
|-------|-------|--------|
| `e2e-full-test.js` | Auth (hashing, JWT tamper, role matrix), client/freelancer/admin APIs, chat, uploads, notifications, API error shapes | **118/118 ✅** |
| `e2e-workflow-test.js` | Register → bid → approve → chat → submit → revise → complete → reviews | **20/20 ✅** |
| `e2e-admin-test.js` | Users, verification, moderation, transactions, dispute state machine | **43/43 ✅** |
| `e2e-txn-paths-test.js` | Refund, release, gateway failure, authorization | **11/11 ✅** |
| `e2e-ui-apis-test.js` | Public feed safety + client aggregate endpoints | **14/14 ✅** |
| `npm run test:ui` | SSR-renders all 30 pages/components (catches render crashes) | **30/30 ✅** |
| `npm run lint` | oxlint static analysis | **0 errors ✅** |
| `npm run build` | Production bundle | **✅** |

**Code quality checklist:** centralized JSON error handling · paginated + indexed queries · no hardcoded secrets (fail-fast env validation) · `.env` git-ignored · role gates on every protected route · loading/error/empty states on every page · responsive from 360px → desktop.

## 📸 Screenshots

> Capture these from the running app and drop them into a `screenshots/` folder:

| Page | What to capture |
|------|-----------------|
| 🏠 Home | Hero, features grid, closing CTA |
| 🔐 Auth | Login / Register split layout |
| 📋 Browse | Public project feed + filters |
| 🧑‍💼 Client | Dashboard, project creation, applications, approve → chat |
| 💼 Freelancer | Search/filter, bid form, submit work |
| 💬 Chat | Real-time messaging with attachments |
| ⭐ Reviews | Post-completion rating modal |
| 🛡 Admin | Dashboard, user verification, disputes, analytics |
| 📱 Mobile | Responsive sidebar + offcanvas navigation |

### 📐 Architecture Diagrams

| | |
|---|---|
| ![Architecture](./Project%20Architecture/Technical%20Architecture/Architecture.png) | ![MVC](./Project%20Architecture/MVC%20diagram/MVC.png) |
| *Technical architecture* | *MVC pipeline* |

📄 [Key Features & Roles (PDF)](./Project%20Architecture/feature%20and%20roles/Key%20Features%20%20and%20role%20of%20Freelancing%20Application.pdf)

## 🔗 Demo & Repository

| | |
|---|---|
| 🌐 **Live Demo** | `https://<your-deployment>.onrender.com` *(add your Vercel/Netlify/Render link)* |
| 📦 **GitHub** | https://github.com/lavanyabhiste/FreelanceHub---Connect-freelancers-with-clients-seamlessly |
| 🎥 **Video walkthrough** | `https://youtu.be/<video-id>` *(optional)* |

## 🔮 Future Enhancements

- 💳 **Real payment gateway** (Stripe/Razorpay) — the provider-agnostic `paymentService` already isolates the mock provider behind one interface
- 🔑 **OAuth / password reset** — Google & GitHub sign-in, email-based reset tokens
- 📱 **Mobile app** — React Native client sharing the same REST API
- 🧠 **Smart matching** — skill-based recommendations for clients and freelancers
- 📧 **Email digests** — weekly summaries of new projects matching a freelancer's skills
- 🌍 **i18n** — multi-language support with RTL layouts
- ⚙️ **CI/CD** — GitHub Actions running all five API suites + lint + build on push
- 📊 **Advanced analytics** — revenue trends, hiring velocity, category heatmaps (Chart.js/D3)

---

<div align="center">

**FreelanceHub** — built with the MERN stack · ReactBits · Bootstrap · Redux Toolkit

*If you find this project useful, give it a ⭐ on GitHub!*

</div>
