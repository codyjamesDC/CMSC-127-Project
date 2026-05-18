import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── DRIVERS ──────────────────────────────────────────────
export const driversApi = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  getVehicles: (id) => api.get(`/drivers/${id}/vehicles`),
};

// ── VEHICLES ─────────────────────────────────────────────
export const vehiclesApi = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  getExpired: (date) => api.get('/vehicles/expired', { params: { date } }),
};

// ── REGISTRATIONS ────────────────────────────────────────
export const registrationsApi = {
  getAll: (params) => api.get('/registrations', { params }),
  getByVehicle: (vehicleId) => api.get(`/registrations/vehicle/${vehicleId}`),
  create: (data) => api.post('/registrations', data),
  update: (id, data) => api.put(`/registrations/${id}`, data),
  delete: (id) => api.delete(`/registrations/${id}`),
};

// ── VIOLATIONS (tickets) ─────────────────────────────────
export const violationsApi = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getByDriver: (driverId, params) => api.get(`/tickets/driver/${driverId}`, { params }),
};

// ── REPORTS ──────────────────────────────────────────────
export const reportsApi = {
  driversByFilter: (data) => api.get('/reports/drivers', { params: data }),
  vehiclesByDriver: (driverId) => api.get(`/reports/vehicles/driver/${driverId}`),
  expiredRegistrations: (date) => api.get('/reports/registrations/expired', { params: { date } }),
  expiredLicenses: () => api.get('/reports/drivers/expired-licenses'),
  violationsByDriver: (driverId, params) => api.get(`/reports/violations/driver/${driverId}`, { params }),
  violationsByType: (year) => api.get('/reports/violations/by-type', { params: { year } }),
  vehiclesInViolations: (location) => api.get('/reports/vehicles/violations', { params: { location } }),
};

export default api;
