# ⚽ NWU Soccer Institute — Player Management System

A full-stack Next.js application for managing the North-West University Soccer Institute's players, squads, matches, training, and medical records.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **MongoDB** (local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- **npm** or **yarn**

---

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/nwu-soccer
NEXTAUTH_SECRET=change-this-to-a-random-long-string
NEXTAUTH_URL=http://localhost:3000
```

> **Tip**: For `NEXTAUTH_SECRET`, run `openssl rand -base64 32` in your terminal.

### 3. Seed the database (demo data)
```bash
npm run db:seed
```

This creates demo accounts and sample players, squads, matches, and medical records.

### 4. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Demo Login Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@nwu.ac.za | password123 |
| **Coach** | coach@nwu.ac.za | password123 |
| **Physio** | physio@nwu.ac.za | password123 |
| **Support Staff** | support@nwu.ac.za | password123 |
| **Player** | player@nwu.ac.za | password123 |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth.js authentication
│   │   ├── players/              # Player CRUD + [id] routes
│   │   ├── teams/                # Squad management
│   │   ├── matches/              # Fixture & results
│   │   ├── medical/              # Injury records
│   │   ├── attendance/           # Training sessions
│   │   └── dashboard/            # Analytics aggregation
│   ├── login/                    # Login page
│   ├── dashboard/                # Main dashboard
│   ├── players/                  # Player management
│   ├── teams/                    # Squad management
│   ├── matches/                  # Fixtures & results
│   ├── training/                 # Training & attendance
│   ├── medical/                  # Medical records
│   └── performance/              # Analytics (extend here)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── Header.tsx            # Top header bar
│   └── forms/
│       └── AddPlayerModal.tsx    # Player registration modal
└── lib/
    ├── db.ts                     # MongoDB connection
    ├── models.ts                 # All Mongoose schemas
    └── auth.ts                   # Auth utilities & RBAC
scripts/
└── seed.js                       # Database seeding script
```

---

## 🗄️ Database Models

| Model | Description |
|-------|-------------|
| `User` | System users with roles (admin, coach, physio, support_staff, player) |
| `Player` | Player profiles with contact info, position, fitness status |
| `Team` | Squads with player/staff assignments |
| `Match` | Fixtures with scorelines and lineup |
| `PlayerStats` | Per-match performance stats |
| `MedicalRecord` | Injury and recovery records |
| `TrainingSession` | Training sessions with attendance tracking |

---

## 🔐 Role Permissions

| Feature | Admin | Coach | Physio | Support | Player |
|---------|:-----:|:-----:|:------:|:-------:|:------:|
| Full system access | ✅ | — | — | — | — |
| Manage players | ✅ | ✅ | — | 👁 | 👁 own |
| Manage squads | ✅ | ✅ | — | 👁 | 👁 |
| Record matches | ✅ | ✅ | — | — | 👁 |
| Medical records | ✅ | 👁 | ✅ | — | 👁 own |
| Training sessions | ✅ | ✅ | 👁 | ✅ | 👁 |
| View performance | ✅ | ✅ | — | — | 👁 own |

---

## 🧩 API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | Authentication |
| `/api/players` | GET, POST | List/create players |
| `/api/players/[id]` | GET, PUT, DELETE | Player CRUD |
| `/api/teams` | GET, POST | List/create squads |
| `/api/matches` | GET, POST | List/create fixtures |
| `/api/medical` | GET, POST | Injury records |
| `/api/attendance` | GET, POST | Training sessions |
| `/api/dashboard` | GET | Analytics summary |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js (JWT) |
| Forms | React Hook Form |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## 🔧 Production Deployment

### MongoDB Atlas (recommended)
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Copy your connection string to `MONGODB_URI`

### Vercel (recommended hosting)
```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard.

### Build for production
```bash
npm run build
npm start
```

---

## 📈 Extending the System

### Add Player Stats tracking
The `PlayerStats` model is in `src/lib/models.ts`. Add a stats page at `src/app/performance/page.tsx` and an API at `src/app/api/players/[id]/stats/route.ts`.

### Export to PDF/CSV
Install `jspdf` or `papaparse` and add export buttons to any list page.

### Push Notifications
Integrate with [Novu](https://novu.co) or [OneSignal](https://onesignal.com) for training reminders and match alerts.

---

## 🏫 About

Built for **North-West University Soccer Institute** — Mafikeng Campus.

NWU Colors: Purple `#4B0082` & White `#FFFFFF`

---

*For academic/assignment submissions or questions, refer to the project documentation above.*
