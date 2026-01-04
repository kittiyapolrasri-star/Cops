# God's Eye Dashboard Redesign - Implementation Plan

## Overview

Transform the current Dashboard from a compartmentalized layout to a **Map-Centric Command Center** optimized for high-level situational awareness (God's Eye View).

![Current Dashboard Layout](file:///C:/Users/ThugCom/.gemini/antigravity/brain/13de2e2f-9c59-48d7-bb2a-d52c10516434/uploaded_image_1767528651612.jpg)

---

## User Requirements Summary

> [!IMPORTANT]
> **War Room Ready**: The dashboard must look professional on large projector screens (ศปก.ตร.) with borderless full-screen map.

### Core Principles
1. **God's Eye View**: Maximize map real estate for national-level situational awareness
2. **Reduce Visual Noise**: Replace static stat boxes with floating HUD elements
3. **Drill-down Capability**: Country → Bureau → Province → Station navigation
4. **Priority Focus**: Show only high-priority incidents to commanders

---

## Proposed Changes

### 1. Full-Screen Map Canvas

#### [MODIFY] [frontend/app/dashboard/page.tsx](file:///d:/COPS/frontend/app/dashboard/page.tsx)
- Remove the top Stats Card grid (currently ~20% of screen)
- Map component fills 100% of the content area
- Dark-mode map style (already implemented in DashboardMap)

**Before:**
```
┌─────────────────────────────────────┐
│ [Stats Cards - 4 boxes]             │  ← REMOVE
├────────────────────────┬────────────┤
│ [Map - ~70%]           │ [Feed]     │
└────────────────────────┴────────────┘
```

**After:**
```
┌─────────────────────────────────────┐
│ ┌──────────────────────────────────┐│
│ │ [Floating Stats HUD]             ││  ← NEW
│ │ [100% Full Map Canvas]           ││
│ │ [Priority Feed Overlay]          ││
│ └──────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

### 2. Floating Glassmorphism Stats Bar

#### [NEW] [frontend/components/FloatingStatsHUD.tsx](file:///d:/COPS/frontend/components/FloatingStatsHUD.tsx)
- Semi-transparent cards with backdrop blur
- Positioned at top of map (absolute positioning)
- Shows: Active Patrols, Check-ins Today, Incidents, Risk Zones
- Optional: Response Time KPI

**Style:**
```css
.floating-stat {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
```

---

### 3. Collapsible Sidebar Enhancement

#### [MODIFY] [frontend/app/dashboard/layout.tsx](file:///d:/COPS/frontend/app/dashboard/layout.tsx)
- Already has collapse functionality ✅
- When collapsed: Width reduces to ~60px (icon-only mode)
- Consider adding keyboard shortcut (e.g., `[` key)

---

### 4. Priority Live Feed with Auto-Fly

#### [NEW] [frontend/components/PriorityFeed.tsx](file:///d:/COPS/frontend/components/PriorityFeed.tsx)
- Floating panel (bottom-right or collapsible)
- Shows ONLY High Priority incidents (filter by severity)
- Click on item → Map auto-flies to incident location
- Uses `setCenter()` and `setZoom()` from map context

---

### 5. Hierarchical Filter System

#### [MODIFY] [frontend/components/DashboardMap.tsx](file:///d:/COPS/frontend/components/DashboardMap.tsx)

**A. Command Hierarchy Filter:**
| Level | View | Click Action |
|-------|------|--------------|
| Country | Heatmap/Cluster by Bureau | Click → Zoom to Bureau |
| Bureau (ภาค) | Province boundaries | Click → Zoom to Province |
| Province (จังหวัด) | Station dots (Red/Green status) | Click → Zoom to Station |
| Station (สภ.) | Individual patrol positions | Click → Show patrol details |

**B. Threat Category Toggles:**
- 🔵 Blue Force (ฝ่ายเรา): Patrol positions, Checkpoints
- 🔴 Red Force (อาชญากรรม): Crime heatmap by type
  - Drugs (ยาเสพติด)
  - Violent (ประทุษร้าย)
  - Traffic (อุบัติเหตุ)
- ⚠️ Critical Alerts: Blinking icons for national-level incidents

**C. Time Dimension Toggle:**
- **Live Operations**: Real-time positions (default)
- **Intelligence Mode**: Historical data (24h/7d) for pattern analysis

---

## Implementation Order

| Step | Task | Complexity |
|------|------|------------|
| 1 | Refactor `page.tsx` to full-screen map | Medium |
| 2 | Create `FloatingStatsHUD.tsx` component | Low |
| 3 | Integrate HUD into `page.tsx` | Low |
| 4 | Create `PriorityFeed.tsx` with auto-fly | Medium |
| 5 | Add Hierarchy filter controls to map | High |
| 6 | Implement Threat Category toggles | Medium |
| 7 | Add Time Dimension switch | Medium |

**Estimated Time: 4-6 hours**

---

## Verification Plan

1. **Visual Check**: Map fills entire content area
2. **Floating Stats**: Semi-transparent, readable, non-intrusive
3. **Auto-Fly**: Click feed item → Map zooms to location
4. **Filter Drill-down**: Can navigate from Country → Station level
5. **War Room Test**: Full-screen browser mode looks professional
