# C.O.P.S. - ระบบสายตรวจอัจฉริยะ Phase 1

ระบบติดตามและควบคุมสายตรวจตำรวจแบบ Real-time พร้อม Dashboard สำหรับห้องบังคับการ โดยเน้น Web-first approach

## User Review Required

> [!IMPORTANT]
> **Tech Stack Selection**: ใช้ Next.js + NestJS + PostgreSQL/PostGIS + Docker ซึ่งเป็น Stack ที่คุณคุ้นเคยจากโปรเจกต์ JAGA Security ERP

> [!WARNING]
> **GPS Tracking บน Web**: เนื่องจากเริ่มจาก Web ก่อน จะใช้ HTML5 Geolocation API สำหรับ Mobile PWA ซึ่งต้องมี HTTPS และผู้ใช้ต้องอนุญาตให้เข้าถึง Location

---

## Proposed Changes

### Backend (NestJS)

#### [NEW] [backend](file:///d:/COPS/backend)
สร้าง Backend API ด้วย NestJS + PostgreSQL + PostGIS:

**Database Entities:**
- `User` - ผู้ใช้งาน (สายตรวจ, ผู้บังคับบัญชา)
- `Station` - สถานีตำรวจ
- `Province` - จังหวัด
- `Bureau` - กองบัญชาการ
- `PatrolRoute` - เส้นทางสายตรวจ (GPS breadcrumb)
- `CheckIn` - บันทึกการเช็คอิน
- `RiskZone` - พื้นที่เสี่ยง
- `Incident` - รายงานเหตุการณ์
- `IncidentItem` - รายละเอียดของกลาง (ยาเสพติด, อาวุธ, ยานพาหนะ)

**API Modules:**
- `AuthModule` - JWT Authentication + Role-based access (4 levels)
- `TrackingModule` - GPS location updates via WebSocket
- `CheckInModule` - Digital check-in with frequency calculation
- `IncidentModule` - Prevention/Suppression reporting
- `RiskZoneModule` - CRUD risk zones + heatmap data
- `UploadModule` - Photo evidence storage
- `NotificationModule` - Real-time alerts via WebSocket

---

### Frontend - Web Dashboard (Next.js)

#### [NEW] [frontend](file:///d:/COPS/frontend)
สร้าง Web Dashboard ด้วย Next.js:

**Pages:**
- `/login` - หน้า Login
- `/dashboard` - Live Tactical Map + Feed Stream
- `/risk-zones` - จัดการพื้นที่เสี่ยง
- `/analytics` - สถิติและ Heatmap
- `/patrol` - Mobile PWA สำหรับสายตรวจ

**Components:**
- `TacticalMap` - แผนที่ Leaflet แสดงตำแหน่งสายตรวจ Real-time
- `FeedStream` - รายการโพสต์รูปภาพ/ผลจับกุม
- `RiskZoneLayer` - Overlay พื้นที่เสี่ยง
- `Heatmap` - ความหนาแน่นการตรวจ
- `FrequencyProgress` - Progress bar ความถี่การตรวจ
- `NotificationCenter` - แจ้งเตือนเหตุสำคัญ

---

### Mobile PWA (Next.js)

#### [NEW] [frontend/app/patrol](file:///d:/COPS/frontend/app/patrol)
สร้าง Mobile-responsive PWA สำหรับสายตรวจ:

**Features:**
- GPS Tracking (Background location)
- Check-in Button
- Incident Reporting Form
  - Prevention Mode (ถ่ายรูป + ข้อความสั้น)
  - Suppression Mode (Checklist + ภาพของกลาง)
- Speech-to-Text (Web Speech API)

---

### Docker & Deployment

#### [NEW] [docker-compose.yml](file:///d:/COPS/docker-compose.yml)
```yaml
services:
  - postgres (with PostGIS)
  - redis (real-time caching)
  - backend (NestJS)
  - frontend (Next.js)
  - nginx (reverse proxy)
```

---

## Verification Plan

### Automated Tests

**Backend Tests (NestJS):**
```bash
cd d:\COPS\backend
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

**Frontend Tests:**
```bash
cd d:\COPS\frontend
npm run test        # Component tests
npm run build       # Build verification
```

### Browser Tests

1. **Login Flow**: เข้าสู่ระบบด้วย user แต่ละ level
2. **GPS Tracking**: เปิด PWA บนมือถือ ดูตำแหน่งบน Dashboard
3. **Check-in**: กดเช็คอิน ดูบันทึกบน Dashboard
4. **Incident Reporting**: สร้างรายงานทั้ง 2 โหมด
5. **Real-time Updates**: ดู Feed และ Notification

### Manual Verification (Deploy to Linux VM)
- [x] **Backend Rebuild**: Fixed OpenSSL/Alpine issue with new Dockerfile
- [x] **Database Seed**: Executed successfully (`npx prisma db seed`)
- [x] **Access**:
  - Web: `http://[VM_IP]:8085`
  - SSL: `https://[VM_IP]:9443`
  - Backend API: `http://[VM_IP]:4005`

---

## Project Structure

```
d:\COPS\
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── tracking/       # GPS tracking module
│   │   ├── checkin/        # Check-in module
│   │   ├── incident/       # Incident reporting
│   │   ├── riskzone/       # Risk zone management
│   │   ├── upload/         # File uploads
│   │   └── notification/   # WebSocket notifications
│   ├── prisma/             # Database schema
│   └── Dockerfile
├── frontend/               # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/        # Login pages
│   │   ├── (dashboard)/   # Dashboard pages
│   │   └── patrol/        # Mobile PWA
│   ├── components/        # Shared components
│   └── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

---

## Timeline Estimate

| Phase | งาน | ระยะเวลาโดยประมาณ |
|-------|-----|-------------------|
| 1 | Backend Setup + Auth + Database | 2-3 ชั่วโมง |
| 2 | GPS Tracking + Check-in API | 2-3 ชั่วโมง |
| 3 | Incident Reporting API | 2-3 ชั่วโมง |
| 4 | Frontend Dashboard + Map | 3-4 ชั่วโมง |
| 5 | Mobile PWA | 2-3 ชั่วโมง |
| 6 | Docker + Deployment | 1-2 ชั่วโมง |

**Total: ~15-18 ชั่วโมงของการพัฒนา**

---

## Phase 6: Station Management System (Current Task)

### Goal
Implement a CRUD (Create, Read, Update, Delete) interface for managing Police Stations directly from the Dashboard. This eliminates the need for database seeding scripts for operational changes.

### Backend Changes

#### [MODIFY] [backend/src/organization/organization.controller.ts](file:///d:/COPS/backend/src/organization/organization.controller.ts)
- Add `PUT /organization/stations/:id`: Update station details (name, code, lat, lng, address).
- Add `DELETE /organization/stations/:id`: Delete a station (with validation).

#### [MODIFY] [backend/src/organization/organization.service.ts](file:///d:/COPS/backend/src/organization/organization.service.ts)
- Implement `updateStation(id, data)`: Handle Prisma update.
- Implement `deleteStation(id)`: Handle Prisma delete (ensure no cascading issues).

### Frontend Changes

#### [MODIFY] [frontend/app/dashboard/layout.tsx](file:///d:/COPS/frontend/app/dashboard/layout.tsx)
- Add "Station Management" (จัดการสถานี) to the Sidebar navigation.

#### [NEW] [frontend/app/dashboard/stations/page.tsx](file:///d:/COPS/frontend/app/dashboard/stations/page.tsx)
- **Table View**: List all stations with pagination/search.
- **Columns**: Code, Name, Province, Bureau, Actions (Edit/Delete).
- **Functionality**:
    - "Add Station" button -> Opens Modal.
    - Edit button -> Opens Modal with data pre-filled.
    - Delete button -> Confirms and calls Delete API.

#### [NEW] [frontend/components/StationModal.tsx](file:///d:/COPS/frontend/components/StationModal.tsx)
- Reusable Modal for Create/Edit.
- **Form Fields**:
    - Station Name (Create/Update)
    - Station Code (Create only, readonly on Edit?) -> Maybe editable if needed.
    - Province (Dropdown selector)
    - Latitude/Longitude (Decimal inputs) - *Future: Map Picker*
    - Address (Text area)

