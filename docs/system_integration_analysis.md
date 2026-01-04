# C.O.P.S. System Integration Analysis

## 📊 Database Schema (Prisma)

| Model | Fields | Relationships |
|-------|--------|---------------|
| **Bureau** | id, name, code | → Province[] |
| **Province** | id, name, code, bureauId | ← Bureau, → Station[] |
| **Station** | id, name, code, address, **latitude**, **longitude**, provinceId | ← Province, → User[], RiskZone[] |
| **User** | id, username, password, firstName, lastName, rank, role, stationId | ← Station, → PatrolRoute[], CheckIn[], Incident[] |
| **PatrolRoute** | id, userId, startedAt, endedAt, isActive | → PatrolLocation[] |
| **PatrolLocation** | id, patrolRouteId, latitude, longitude, accuracy, speed, timestamp | ← PatrolRoute |
| **CheckIn** | id, userId, riskZoneId, latitude, longitude, note, photo | ← User, RiskZone |
| **RiskZone** | id, name, latitude, longitude, radius, riskLevel, stationId | ← Station, → CheckIn[] |
| **Incident** | id, type, userId, latitude, longitude, description, photos, isResolved | ← User, → IncidentItem[] |
| **Notification** | id, title, message, type, isRead, userId, stationId | - |

---

## 🔗 Backend → Frontend API Mapping

### Organization API ✅
| Backend Endpoint | Frontend Call | Status |
|-----------------|---------------|--------|
| `GET /organization/bureaus` | `organizationApi.getBureaus()` | ✅ Match |
| `GET /organization/provinces` | `organizationApi.getProvinces()` | ✅ Match |
| `GET /organization/stations` | `organizationApi.getStations()` | ✅ Match |
| `GET /organization/hierarchy` | `organizationApi.getHierarchy()` | ✅ Match |
| `GET /organization/stats` | `organizationApi.getStats()` | ✅ Match |

### Tracking API ✅
| Backend Endpoint | Frontend Call | Status |
|-----------------|---------------|--------|
| `POST /tracking/start` | `trackingApi.startPatrol()` | ✅ Match |
| `POST /tracking/end` | `trackingApi.endPatrol()` | ✅ Match |
| `POST /tracking/location` | `trackingApi.updateLocation()` | ✅ Match |
| `GET /tracking/active` | `trackingApi.getActivePatrols()` | ✅ Match |
| `GET /tracking/latest` | `trackingApi.getLatestLocations()` | ✅ Match |

### RiskZone API ✅
| Backend Endpoint | Frontend Call | Status |
|-----------------|---------------|--------|
| `GET /riskzones` | `riskzoneApi.getAll()` | ✅ Match |
| `POST /riskzones` | `riskzoneApi.create()` | ✅ Match |
| `GET /riskzones/heatmap` | `riskzoneApi.getHeatmap()` | ✅ Match |
| `GET /riskzones/geojson` | `riskzoneApi.getGeoJSON()` | ✅ Match |

### Incident API ✅
| Backend Endpoint | Frontend Call | Status |
|-----------------|---------------|--------|
| `GET /incidents` | `incidentApi.getAll()` | ✅ Match |
| `POST /incidents` | `incidentApi.create()` | ✅ Match |
| `GET /incidents/feed` | `incidentApi.getFeed()` | ✅ Match |
| `GET /incidents/stats` | `incidentApi.getStats()` | ✅ Match |
| `PATCH /incidents/:id/resolve` | `incidentApi.resolve()` | ✅ Match |

---

## 🗺️ Map Data Flow

```mermaid
graph LR
    subgraph Database
        ST[(Station)]
        PL[(PatrolLocation)]
        RZ[(RiskZone)]
    end
    
    subgraph Backend
        API[NestJS API]
    end
    
    subgraph Frontend
        DM[DashboardMap.tsx]
    end
    
    ST -->|getStations| API
    PL -->|getActivePatrols| API
    RZ -->|getAll| API
    
    API -->|stations[]| DM
    API -->|patrols[] with locations| DM
    API -->|riskZones[]| DM
    
    DM -->|Display| MAP((Leaflet Map))
```

---

## ⚠️ Issues Found

### 1. Province/Bureau Lack lat/lng ❌
| Model | latitude | longitude | Impact |
|-------|----------|-----------|--------|
| Bureau | ❌ None | ❌ None | Cannot center on bureau |
| Province | ❌ None | ❌ None | Cannot center on province |
| Station | ✅ Has | ✅ Has | Works correctly |

**Fix Applied:** Calculate center from stations in province/bureau.

### 2. RiskZone Missing Category Field ⚠️
Database `RiskZone` model doesn't have a `category` field for threat type filtering:
```prisma
model RiskZone {
  // ❌ Missing: category String? (DRUGS, WEAPONS, TRAFFIC, etc.)
}
```
**Impact:** Threat category filters on map won't work until added.

### 3. Incident Type Mismatch ⚠️
Frontend `PriorityFeed.tsx` expects incident `category` but database uses `IncidentItem.category`:
- DB: `Incident` → `IncidentItem[]` → `category`
- FE: Expects `incident.category` directly

---

## ✅ Correctly Working Features

| Feature | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| Login/Auth | ✅ | ✅ | ✅ | ✅ Working |
| Display Stations on Map | ✅ | ✅ | ✅ | ✅ Working |
| Display Patrols on Map | ✅ | ✅ | ✅ | ✅ Working |
| Display Risk Zones | ✅ | ✅ | ✅ | ✅ Working |
| Station Search | ✅ | ✅ | ✅ | ✅ Working |
| Province/Bureau Filter | ✅ Fixed | ✅ | ⚠️ No lat/lng | ✅ Working (via stations) |
| Stats HUD | ✅ | ✅ | ✅ | ✅ Working |
| Layer Toggle | ✅ Client | - | - | ✅ Working |
| Threat Category Filter | ⚠️ UI exists | - | ❌ No field | ⚠️ Partial |
| Time Mode Toggle | ⚠️ UI exists | ❌ No history API | ❌ | ⚠️ Not functional |

---

## 📋 Recommendations

### High Priority
1. **Add `category` field to RiskZone model** for threat filtering
2. **Add historical data API** for Time Mode (24h view)

### Medium Priority  
3. **Add lat/lng to Province model** for better accuracy
4. **Add Incident category mapping** for Priority Feed

### Low Priority
5. **Cache GeoJSON** province boundaries locally
