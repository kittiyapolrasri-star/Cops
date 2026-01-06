import axios from 'axios';
import Cookies from 'js-cookie';

export const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove('token');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// API functions
export const authApi = {
    login: (username: string, password: string) =>
        api.post('/auth/login', { username, password }),
    getProfile: () => api.get('/auth/profile'),
};

export const trackingApi = {
    startPatrol: () => api.post('/tracking/start'),
    endPatrol: () => api.post('/tracking/end'),
    updateLocation: (data: { latitude: number; longitude: number; accuracy?: number }) =>
        api.post('/tracking/location', data),
    getActivePatrols: (stationId?: string) =>
        api.get('/tracking/active', { params: { stationId } }),
    getLatestLocations: (stationId?: string) =>
        api.get('/tracking/latest', { params: { stationId } }),
    getHistoricalPatrols: (stationId?: string, hours: number = 24) =>
        api.get('/tracking/historical', { params: { stationId, hours } }),
};

export const checkinApi = {
    create: (data: { latitude: number; longitude: number; note?: string; photo?: string }) =>
        api.post('/checkin', data),
    getMyCheckIns: (date?: string) =>
        api.get('/checkin/my', { params: { date } }),
    getFrequencyStats: (stationId: string, date?: string) =>
        api.get('/checkin/frequency', { params: { stationId, date } }),
    getRecent: (stationId?: string, limit?: number) =>
        api.get('/checkin/recent', { params: { stationId, limit } }),
};

export const incidentApi = {
    create: (data: any) => api.post('/incidents', data),
    getAll: (stationId?: string, type?: string, limit?: number) =>
        api.get('/incidents', { params: { stationId, type, limit } }),
    getFeed: (stationId?: string, limit?: number) =>
        api.get('/incidents/feed', { params: { stationId, limit } }),
    getStats: (stationId?: string) =>
        api.get('/incidents/stats', { params: { stationId } }),
    resolve: (id: string) => api.patch(`/incidents/${id}/resolve`),
};

export const riskzoneApi = {
    getAll: (stationId?: string) =>
        api.get('/riskzones', { params: { stationId } }),
    create: (data: any) => api.post('/riskzones', data),
    getHeatmap: (stationId?: string) =>
        api.get('/riskzones/heatmap', { params: { stationId } }),
    getGeoJSON: (stationId?: string) =>
        api.get('/riskzones/geojson', { params: { stationId } }),
};

export const organizationApi = {
    getBureaus: () => api.get('/organization/bureaus'),
    getProvinces: (bureauId?: string) => api.get('/organization/provinces', { params: { bureauId } }),
    getStations: (provinceId?: string) =>
        api.get('/organization/stations', { params: { provinceId } }),
    getHierarchy: () => api.get('/organization/hierarchy'),
    getStats: () => api.get('/organization/stats'),
};

export const notificationApi = {
    getAll: (limit?: number) =>
        api.get('/notifications', { params: { limit } }),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const uploadApi = {
    uploadSingle: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/single', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    uploadMultiple: (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return api.post('/upload/multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const userApi = {
    getAll: (role?: string) => api.get('/users', { params: { role } }),
    getById: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
};

// ==================== POI API (Layer 2) ====================
export const poiApi = {
    getAll: (params?: { stationId?: string; category?: string; priority?: string }) =>
        api.get('/poi', { params }),
    getById: (id: string) => api.get(`/poi/${id}`),
    create: (data: any) => api.post('/poi', data),
    update: (id: string, data: any) => api.patch(`/poi/${id}`, data),
    delete: (id: string) => api.delete(`/poi/${id}`),
    getNearby: (lat: number, lng: number, radius?: number, category?: string) =>
        api.get('/poi/nearby', { params: { lat, lng, radius, category } }),
    getStats: (stationId?: string) =>
        api.get('/poi/stats', { params: { stationId } }),
};

// ==================== PATROL PLAN API (Layer 4) ====================
export const patrolPlanApi = {
    // Plans
    getAll: (params?: { stationId?: string; isActive?: boolean; fromDate?: string; toDate?: string }) =>
        api.get('/patrol-plans', { params }),
    getById: (id: string) => api.get(`/patrol-plans/${id}`),
    create: (data: any) => api.post('/patrol-plans', data),
    update: (id: string, data: any) => api.patch(`/patrol-plans/${id}`, data),
    delete: (id: string) => api.delete(`/patrol-plans/${id}`),
    getStats: (stationId?: string) =>
        api.get('/patrol-plans/stats', { params: { stationId } }),
    getProgress: (id: string, date?: string) =>
        api.get(`/patrol-plans/${id}/progress`, { params: { date } }),

    // Checkpoints
    addCheckpoint: (planId: string, data: any) =>
        api.post(`/patrol-plans/${planId}/checkpoints`, data),
    updateCheckpoint: (checkpointId: string, data: any) =>
        api.patch(`/patrol-plans/checkpoints/${checkpointId}`, data),
    deleteCheckpoint: (checkpointId: string) =>
        api.delete(`/patrol-plans/checkpoints/${checkpointId}`),
    reorderCheckpoints: (planId: string, checkpointIds: string[]) =>
        api.post(`/patrol-plans/${planId}/checkpoints/reorder`, { checkpointIds }),

    // Assignments
    assign: (planId: string, userId: string, scheduledDate: string) =>
        api.post(`/patrol-plans/${planId}/assign`, { userId, scheduledDate }),
    updateAssignmentStatus: (assignmentId: string, status: string) =>
        api.patch(`/patrol-plans/assignments/${assignmentId}/status`, { status }),
    getMyAssignments: (date?: string) =>
        api.get('/patrol-plans/my-assignments', { params: { date } }),

    // Checkpoint Completion
    recordVisit: (checkpointId: string, data: { latitude: number; longitude: number; photo?: string; note?: string }) =>
        api.post(`/patrol-plans/checkpoints/${checkpointId}/visit`, data),
    markLeft: (completionId: string) =>
        api.patch(`/patrol-plans/completions/${completionId}/leave`),
};

// ==================== CRIME API (Layer 3) ====================
export const crimeApi = {
    getAll: (params?: { stationId?: string; type?: string; source?: string; fromDate?: string; toDate?: string; isResolved?: boolean }) =>
        api.get('/crimes', { params }),
    getById: (id: string) => api.get(`/crimes/${id}`),
    create: (data: any) => api.post('/crimes', data),
    update: (id: string, data: any) => api.patch(`/crimes/${id}`, data),
    delete: (id: string) => api.delete(`/crimes/${id}`),
    resolve: (id: string) => api.patch(`/crimes/${id}/resolve`),
    bulkCreate: (records: any[]) => api.post('/crimes/bulk', records),

    // Heat Map & Cluster Data
    getHeatmap: (params?: { stationId?: string; type?: string; months?: number }) =>
        api.get('/crimes/heatmap', { params }),
    getClusters: (params?: { stationId?: string; type?: string; months?: number }) =>
        api.get('/crimes/clusters', { params }),
    getStats: (stationId?: string, months?: number) =>
        api.get('/crimes/stats', { params: { stationId, months } }),

    // Crime Clock (นาฬิกาอาชญากรรม)
    getCrimeClock: (params?: { stationId?: string; months?: number }) =>
        api.get('/crimes/clock', { params }),

    // Nearby Stations (Buffer Zone)
    getNearbyStations: (latitude: number, longitude: number, radius?: number) =>
        api.get('/crimes/nearby-stations', { params: { latitude, longitude, radius } }),
};

// ==================== CITIZEN TIP API (Layer 7) ====================
export const citizenTipApi = {
    // Public endpoints (no auth)
    submit: (data: { category: string; description: string; latitude?: number; longitude?: number; address?: string; photos?: string[]; contactPhone?: string; isAnonymous?: boolean }) =>
        api.post('/tips/submit', data),
    track: (tipCode: string) => api.get(`/tips/track/${tipCode}`),

    // Admin endpoints (with auth)
    getAll: (params?: { stationId?: string; status?: string; category?: string; priority?: number }) =>
        api.get('/tips', { params }),
    getById: (id: string) => api.get(`/tips/${id}`),
    update: (id: string, data: any) => api.patch(`/tips/${id}`, data),
    updateStatus: (id: string, status: string, actionNote?: string) =>
        api.patch(`/tips/${id}/status`, { status, actionNote }),
    assign: (id: string, userId: string) =>
        api.patch(`/tips/${id}/assign`, { userId }),
    delete: (id: string) => api.delete(`/tips/${id}`),
    getStats: (stationId?: string) =>
        api.get('/tips/stats', { params: { stationId } }),
};

// ==================== SOS API (Layer 6) ====================
export const sosApi = {
    // Create alert
    create: (data: { type?: string; latitude: number; longitude: number; address?: string; message?: string; audioUrl?: string; photos?: string[] }) =>
        api.post('/sos', data),

    // Get alerts
    getAll: (params?: { stationId?: string; status?: string; type?: string; userId?: string }) =>
        api.get('/sos', { params }),
    getActive: (stationId?: string) =>
        api.get('/sos/active', { params: { stationId } }),
    getById: (id: string) => api.get(`/sos/${id}`),

    // Respond
    respond: (id: string, data: { message?: string; latitude?: number; longitude?: number; eta?: number }) =>
        api.post(`/sos/${id}/respond`, data),

    // Resolve/Cancel
    resolve: (id: string, resolutionNote?: string) =>
        api.patch(`/sos/${id}/resolve`, { resolutionNote }),
    markFalseAlarm: (id: string, note?: string) =>
        api.patch(`/sos/${id}/false-alarm`, { note }),
    cancel: (id: string) => api.patch(`/sos/${id}/cancel`),

    // Stats
    getStats: (stationId?: string) =>
        api.get('/sos/stats', { params: { stationId } }),
};

// ==================== GPS COMPLIANCE API (Layer 5) ====================
export const gpsComplianceApi = {
    // GPS Logging
    logPosition: (data: { latitude: number; longitude: number; accuracy?: number; speed?: number; heading?: number; altitude?: number; battery?: number; isCharging?: boolean }) =>
        api.post('/gps-compliance/log', data),
    getUserHistory: (userId: string, hours?: number) =>
        api.get(`/gps-compliance/history/${userId}`, { params: { hours } }),
    getLatestPositions: (stationId?: string) =>
        api.get('/gps-compliance/latest', { params: { stationId } }),

    // Duty Zones
    createDutyZone: (data: { name: string; description?: string; coordinates: any; stationId: string }) =>
        api.post('/gps-compliance/zones', data),
    getDutyZones: (stationId?: string) =>
        api.get('/gps-compliance/zones', { params: { stationId } }),
    updateDutyZone: (id: string, data: any) =>
        api.patch(`/gps-compliance/zones/${id}`, data),
    deleteDutyZone: (id: string) =>
        api.delete(`/gps-compliance/zones/${id}`),

    // Violations
    getViolations: (params?: { userId?: string; stationId?: string; type?: string; isAcknowledged?: boolean }) =>
        api.get('/gps-compliance/violations', { params }),
    acknowledgeViolation: (id: string) =>
        api.patch(`/gps-compliance/violations/${id}/acknowledge`),

    // Stats
    getStats: (stationId?: string) =>
        api.get('/gps-compliance/stats', { params: { stationId } }),
};

