# ByteVoice — AI Voice Receptionist for Healthcare

ByteVoice is an intelligent, real-time voice receptionist designed for healthcare clinics. Built specifically to handle natural conversations in spoken Bangla with colloquial English code-switching, ByteVoice automates front-desk telephone operations—booking appointments, answering clinic inquiries, handling triage, and extracting structured clinical data into an administrative portal.

---

## Features

- **Real-Time Voice Receptionist:** In-browser low-latency voice calling powered by WebSockets, speech-to-text, and natural text-to-speech.
- **Bilingual & Colloquial Bangla Support:** Understands spoken Bangla alongside common English clinical loanwords (*"doctor"*, *"scaling"*, *"root canal"*).
- **Multi-Agent Orchestration:** LangGraph.js-powered routing for appointment booking/rescheduling/cancellation, clinic FAQ retrieval, and emergency triage.
- **Post-Call Intelligence:** Automatic transcription, audio merging, LLM-based structured data extraction, and Bangladeshi phone number normalization.
- **Clinical Admin Portal:** Secure dashboard to review call logs, listen to recordings, view appointments, and manage doctor schedules.

---

## Tech Stack

### Frontend (`apps/web`)
- **Framework:** Next.js 16 (App Router) & React 19
- **Styling & UI:** Tailwind CSS v4, Radix UI primitives, Lucide React, Framer Motion
- **Authentication:** Better Auth
- **State & Data Fetching:** TanStack React Query

### Backend & AI Pipeline (`apps/api`)
- **Server:** Express 5 & Node.js
- **Real-Time Communication:** Socket.io & WebSockets
- **Agent Orchestration:** LangGraph.js v1 (`StateGraph`) & LangChain
- **LLM:** OpenAI (`gpt-4o-mini`)
- **Speech-to-Text (STT):** Deepgram Nova-3 (Bangla `bn` model)
- **Text-to-Speech (TTS):** Sarvam AI Bulbul (Bengali voice)
- **Audio Processing:** Fluent-ffmpeg (audio stitching & format conversion)
- **Email Alerts:** Resend (urgent emergency alerts)

### Database & Infrastructure
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Object Storage:** AWS S3 (call audio recordings)
- **Monorepo Tooling:** pnpm Workspaces, TypeScript (strict mode)

---

## Repository Structure

```
byte-care/
├── apps/
│   ├── api/          # Express server, Socket.io gateway, LangGraph agent pipeline
│   └── web/          # Next.js frontend, voice call UI, admin dashboard
├── packages/
│   ├── shared/       # Shared TypeScript types, schemas, and socket contracts
│   ├── eslint-config/
│   └── typescript-config/
└── docs/             # Technical specifications and documentation
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** `>= 20.9.0`
- **pnpm:** `>= 9.0.0`
- **PostgreSQL:** A running PostgreSQL database instance (local or hosted via Neon/Supabase)

---

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd byte-care
pnpm install
```

---

### 2. Environment Configuration

Copy the example environment files for both the API and Web applications:

#### Backend (`apps/api/.env`)
Create `apps/api/.env` (or copy from `apps/api/.env.example`):
```ini
# Database & Server
DATABASE_URL="postgresql://user:password@localhost:5432/byte_care?sslmode=disable"
PORT=5500
WEB_ORIGIN="http://localhost:3000"

# AI & Voice Providers
OPENAI_API_KEY="sk-..."
DEEPGRAM_API_KEY="your-deepgram-key"
SARVAM_API_KEY="your-sarvam-key"
SARVAM_SPEAKER="roopa_bn_conversational"

# Optional: Notifications & Storage
RESEND_API_KEY="your-resend-key"
EMERGENCY_EMAIL="owner@clinic.com"
CLINIC_NAME="Dhaka Dental Care"
# AWS_REGION="us-east-1"
# S3_BUCKET="your-bucket-name"
# AWS_ACCESS_KEY_ID="..."
# AWS_SECRET_ACCESS_KEY="..."
```

#### Frontend (`apps/web/.env`)
Create `apps/web/.env` (or copy from `apps/web/.env.example`):
```ini
# Endpoints
NEXT_PUBLIC_API_URL="http://localhost:5500/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5500"

# Database & Authentication
DATABASE_URL="postgresql://user:password@localhost:5432/byte_care?sslmode=disable"
BETTER_AUTH_SECRET="your-64-character-hex-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Initial Admin User (for seeding)
ADMIN_EMAIL="admin@clinic.com"
ADMIN_PASSWORD="YourSecurePassword123!"
```

> **Tip:** You can generate a random `BETTER_AUTH_SECRET` by running:
> ```bash
> openssl rand -hex 32
> ```

---

### 3. Database Setup & Seeding

Run the database migrations and seed default data (doctors, schedules, mock calls, and the admin user):

```bash
# Push Prisma schema to your database
pnpm -F api exec prisma db push

# Seed clinic doctors, schedules, and mock call records
pnpm -F api seed

# Seed the admin user account for dashboard login
pnpm -F web seed:admin
```

---

### 4. Run the Development Server

Start both the backend and frontend concurrently:

```bash
pnpm dev
```

Once started:
- **Web App / Landing Page:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3000/sign-in](http://localhost:3000/sign-in)
- **Backend API:** [http://localhost:5500](http://localhost:5500)

---

## Available Scripts

From the repository root:

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start both web and API in development mode |
| `pnpm dev:web` | Start only the frontend Next.js app |
| `pnpm dev:api` | Start only the backend Express app |
| `pnpm build` | Build shared packages, API, and Web for production |
| `pnpm lint` | Run ESLint across all workspace packages |
| `pnpm check-types` | Run TypeScript type checking across all workspace packages |
| `pnpm test` | Run backend test suite |
