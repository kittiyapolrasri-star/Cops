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
