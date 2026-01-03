# C.O.P.S. - ระบบสายตรวจอัจฉริยะ 🚔

**Command Operations for Patrol Surveillance** - ระบบติดตามและควบคุมสายตรวจตำรวจแบบ Real-time

## 🌟 Features

### Mobile App (PWA)
- ✅ GPS Tracking - ติดตามตำแหน่งแบบ Real-time
- ✅ Digital Check-in - เช็คอินจุดตรวจ
- ✅ Incident Reporting - รายงานเหตุการณ์
  - งานป้องกัน (Prevention)
  - งานปราบปราม (Suppression)
- ✅ Speech-to-Text - บันทึกเสียง

### Control Room Dashboard
- ✅ Live Tactical Map - แผนที่ยุทธวิธีแบบ Real-time
- ✅ Feed Stream - กิจกรรมล่าสุด
- ✅ Risk Zone Management - จัดการพื้นที่เสี่ยง
- ✅ Heatmap Visualization - ความหนาแน่นการตรวจ
- ✅ Frequency Analytics - สถิติความถี่การตรวจ

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS + TypeScript |
| Frontend | Next.js 14 + React 18 |
| Database | PostgreSQL |
| ORM | Prisma |
| Maps | Leaflet + OpenStreetMap |
| Real-time | Socket.io |
| Styling | TailwindCSS |
| Deployment | Docker Compose |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Development

```bash
# Clone repository
git clone https://github.com/your-username/cops.git
cd cops

# Backend setup
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Production (Docker)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📱 Access

| Service | URL |
|---------|-----|
| Frontend Dashboard | http://localhost:3000 |
| Patrol PWA | http://localhost:3000/patrol |
| Backend API | http://localhost:4000/api |
| Prisma Studio | npx prisma studio |

## 👤 Demo Accounts

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| HQ Admin | admin | 1234 | ดูทุกอย่าง |
| Station Commander | commander | 1234 | ดูเฉพาะสถานี |
| Patrol Officer | patrol1 | 1234 | ใช้ PWA |
| Patrol Officer | patrol2 | 1234 | ใช้ PWA |

## 📁 Project Structure

```
cops/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # JWT Authentication
│   │   ├── users/          # User management
│   │   ├── tracking/       # GPS tracking module
│   │   ├── checkin/        # Check-in module
│   │   ├── incident/       # Incident reporting
│   │   ├── riskzone/       # Risk zone management
│   │   ├── notification/   # Real-time notifications
│   │   ├── organization/   # Bureau/Province/Station
│   │   └── upload/         # File uploads
│   └── prisma/             # Database schema
├── frontend/               # Next.js Frontend
│   ├── app/
│   │   ├── login/         # Login page
│   │   ├── dashboard/     # Control room
│   │   └── patrol/        # Mobile PWA
│   ├── components/        # Shared components
│   └── lib/               # Utilities & stores
├── docker-compose.yml
└── nginx.conf
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Tracking
- `POST /api/tracking/start` - Start patrol
- `POST /api/tracking/end` - End patrol
- `POST /api/tracking/location` - Update location
- `GET /api/tracking/active` - Get active patrols

### Check-in
- `POST /api/checkin` - Create check-in
- `GET /api/checkin/frequency` - Get frequency stats

### Incidents
- `POST /api/incidents` - Create incident
- `GET /api/incidents/feed` - Get feed
- `GET /api/incidents/stats` - Get statistics

## 📄 License

MIT License - สร้างด้วย ❤️ สำหรับข้าราชการตำรวจไทย
