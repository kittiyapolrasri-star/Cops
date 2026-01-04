# 🗺️ Province Filter & Boundary Feature Analysis

**Date:** Jan 4, 2026

---

## 💡 Concept

เพิ่ม Dropdown เลือกจังหวัด → Map จะ:
1. Zoom ไปที่จังหวัดนั้น
2. แสดงขอบเขตจังหวัด (Polygon Boundary)
3. Filter ข้อมูล (สถานี/สายตรวจ/จุดเสี่ยง) เฉพาะจังหวัดที่เลือก

```
┌──────────────────────────────────────────┐
│  [🔍 ค้นหา] [จังหวัด: สระบุรี ▼]         │
├──────────────────────────────────────────┤
│                                          │
│    ╭──────────────╮  ← ขอบเขตจังหวัด     │
│   ╱                ╲                      │
│  │   🏢 สภ.เมือง    │                     │
│  │     🏢 สภ.แก่งคอย │                    │
│   ╲________________╱                      │
│                                          │
└──────────────────────────────────────────┘
```

---

## ✅ ข้อดี

| Benefit | Description |
|---------|-------------|
| **มุมมองชัดเจน** | ดูข้อมูลทีละจังหวัด ไม่รก |
| **Faster Loading** | โหลดเฉพาะข้อมูลที่ต้องการ |
| **Context Awareness** | รู้ว่าตัวเองกำลังดูพื้นที่ไหน |
| **Scalable** | รองรับหลายจังหวัดในอนาคต |

---

## ⚠️ ข้อควรระวัง

| Challenge | Solution |
|-----------|----------|
| **GeoJSON Boundary** | ต้องหา/สร้าง polygon ขอบเขตจังหวัด |
| **Data Size** | Simplify polygon ให้เล็กลง |
| **Multi-Province** | ตอนนี้มีแค่ 1 จังหวัด (สระบุรี) |

---

## 🔧 Technical Implementation

### A. Province Selector Component
```tsx
<select onChange={(e) => setSelectedProvince(e.target.value)}>
  <option value="">ทุกจังหวัด</option>
  {provinces.map(p => (
    <option key={p.id} value={p.id}>{p.name}</option>
  ))}
</select>
```

### B. Province Boundary (GeoJSON)
```tsx
import { GeoJSON } from 'react-leaflet';

// ถ้าไม่มี GeoJSON จริง ใช้ Approximate Rectangle
const provinceBounds = {
  saraburi: [[14.2, 100.5], [14.8, 101.3]]  // SW, NE corners
};

<Rectangle bounds={provinceBounds[selectedProvince]} />
```

### C. Data Filtering
```tsx
const filteredStations = useMemo(() => 
  selectedProvince 
    ? stations.filter(s => s.provinceId === selectedProvince)
    : stations,
  [stations, selectedProvince]
);
```

---

## 📊 Effort Estimate

| Task | Time |
|------|------|
| Province Selector Dropdown | ~1h |
| Filter logic (stations/patrols/zones) | ~1h |
| Province Boundary (Rectangle/Simple) | ~1h |
| Province Boundary (Real GeoJSON) | ~3h (optional) |
| **Total (Basic)** | **~3h** |
| **Total (with Real GeoJSON)** | **~5h** |

---

## 🎯 Recommendation

> **เหมาะสมที่จะทำ** เพราะระบบตำรวจใช้งานเป็น **ภาค → จังหวัด → สถานี**

### ลำดับการทำ:
1. ⭐ **Province Dropdown** + Filter → ทำก่อน (เร็ว)
2. **Simple Boundary** (Rectangle) → ใช้พิกัด SW/NE
3. **Real GeoJSON** → ถ้าต้องการขอบจริง (Phase 2)

---

## 💡 Quick Win Option

ถ้าไม่ต้องการ boundary จริงๆ สามารถทำแค่:
1. **Dropdown เลือกจังหวัด**
2. **Zoom ไปที่ศูนย์กลางจังหวัด**
3. **Filter สถานี/สายตรวจ เฉพาะจังหวัดนั้น**

**เวลา:** ~2 ชม.
