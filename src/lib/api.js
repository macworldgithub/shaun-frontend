import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/share/')) {
        localStorage.removeItem('dc_token');
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  },
);

// ===== Auth =====
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password }).then((r) => r.data),
};

// ===== Clients =====
export const clientsApi = {
  list: (params) => api.get('/clients', { params }).then((r) => r.data),
  alerts: () => api.get('/clients/alerts').then((r) => r.data),
  get: (id) => api.get(`/clients/${id}`).then((r) => r.data),
  create: (data) => api.post('/clients', data).then((r) => r.data),
  update: (id, data) => api.patch(`/clients/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/clients/${id}`).then((r) => r.data),
  addComment: (id, body) => api.post(`/clients/${id}/comments`, { body }).then((r) => r.data),
  removeComment: (id, cid) => api.delete(`/clients/${id}/comments/${cid}`).then((r) => r.data),
  addAccessory: (id, data) => api.post(`/clients/${id}/accessories`, data).then((r) => r.data),
  syncInventory: (id) => api.post(`/clients/${id}/sync-inventory`).then((r) => r.data),
  updateAccessory: (id, aid, data) => api.patch(`/clients/${id}/accessories/${aid}`, data).then((r) => r.data),
  removeAccessory: (id, aid) => api.delete(`/clients/${id}/accessories/${aid}`).then((r) => r.data),
  listDocuments: (id) => api.get(`/clients/${id}/documents`).then((r) => r.data),
  addDocument: (id, data) => api.post(`/clients/${id}/documents`, data).then((r) => r.data),
  uploadDocument: (id, file, documentType, notes = '') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('document_type', documentType);
    if (notes) fd.append('notes', notes);
    return api.post(`/clients/${id}/documents/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  generatePack: (id) => api.post(`/clients/${id}/generate-pack`).then((r) => r.data),
  sendPack: (id) => api.post(`/clients/${id}/send-pack`).then((r) => r.data),
  generateClaimPack: (id) => api.post(`/clients/${id}/generate-claim-pack`).then((r) => r.data),
  createUploadLink: (id) => api.post(`/clients/${id}/upload-link`).then((r) => r.data),
  uploadLinkInfo: (token) => api.get(`/clients/upload/${token}`).then((r) => r.data),
  uploadViaLink: (token, file, documentType) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('document_type', documentType);
    return api.post(`/clients/upload/${token}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
  updateDocument: (id, documentId, data) => api.patch(`/clients/${id}/documents/${documentId}`, data).then((r) => r.data),
  downloadDocument: async (id, documentId, fileName = 'document') => {
    const response = await api.get(`/clients/${id}/documents/${documentId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },
  updateTradeIn: (id, data) => api.patch(`/clients/${id}/trade-in`, data).then((r) => r.data),
  updateActivation: (id, data) => api.patch(`/clients/${id}/activation`, data).then((r) => r.data),
  updateOfferStatus: (id, data) => api.patch(`/clients/${id}/offer-status`, data).then((r) => r.data),
  listOffers: () => api.get('/clients/offers').then((r) => r.data),
  offerMatches: (id) => api.get(`/clients/${id}/offer-matches`).then((r) => r.data),
  refreshOffers: () => api.post('/clients/offers/refresh').then((r) => r.data),
  fetchOfferSnapshot: () => api.post('/clients/offers/website-snapshot').then((r) => r.data),
  bulkImport: (items) => api.post('/clients/import/bulk', items).then((r) => r.data),
  getInspection: (id) => api.get(`/clients/${id}/inspection`).then((r) => r.data),
  updateInspection: (id, data) => api.put(`/clients/${id}/inspection`, data).then((r) => r.data),
  completeInspection: (id, data) => api.post(`/clients/${id}/inspection/complete`, data).then((r) => r.data),
  getInspectionPdfUrl: (id) => `${API_BASE}/clients/${id}/inspection/pdf`,
  downloadInspectionPdf: async (id, fileName = 'delivery-inspection.pdf') => {
    const response = await api.get(`/clients/${id}/inspection/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },
};

// ===== SMS =====
export const smsApi = {
  list: (params) => api.get('/messages', { params }).then((r) => r.data),
  send: (data) => api.post('/messages/send', data).then((r) => r.data),
  bulk: (data) => api.post('/messages/bulk', data).then((r) => r.data),
};

// ===== Templates =====
export const templatesApi = {
  list: () => api.get('/templates').then((r) => r.data),
  create: (data) => api.post('/templates', data).then((r) => r.data),
  update: (id, data) => api.patch(`/templates/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/templates/${id}`).then((r) => r.data),
};

// ===== Admin =====
export const adminApi = {
  listUsers: () => api.get('/admin/users').then((r) => r.data),
  createUser: (data) => api.post('/admin/users', data).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`).then((r) => r.data),
  deactivateUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  audit: (limit = 200) => api.get('/admin/audit', { params: { limit } }).then((r) => r.data),
  stats: () => api.get('/admin/stats').then((r) => r.data),
  importHarmony: (file, { replace = true, dryRun = false } = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('replace', String(replace));
    fd.append('dry_run', String(dryRun));
    return api.post('/admin/imports/harmony', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }).then((r) => r.data);
  },
};

// ===== Share links =====
export const shareApi = {
  list: () => api.get('/share-links').then((r) => r.data),
  create: (data) => api.post('/share-links', data).then((r) => r.data),
  revoke: (id) => api.delete(`/share-links/${id}`).then((r) => r.data),
  views: (id) => api.get(`/share-links/${id}/views`).then((r) => r.data),
  // Public viewer flow
  info: (token) => axios.get(`${API_BASE}/share/${token}/info`).then((r) => r.data),
  access: (token, email) => axios.post(`${API_BASE}/share/${token}/access`, { email }).then((r) => r.data),
  data: (token, accessToken) =>
    axios.get(`${API_BASE}/share/${token}/data`, { headers: { Authorization: `Bearer ${accessToken}` } }).then((r) => r.data),
};

// ===== Inbound queue =====
export const inboundQueueApi = {
  list: (limit = 100) => api.get('/clients/inbound-queue', { params: { limit } }).then((r) => r.data),
  resolve: (eventId, data) => api.post(`/clients/inbound-queue/${eventId}/resolve`, data).then((r) => r.data),
};

// ===== Offers admin =====
export const offersApi = {
  list: () => api.get('/clients/offers').then((r) => r.data),
  create: (data) => api.post('/clients/offers', data).then((r) => r.data),
  update: (id, data) => api.patch(`/clients/offers/${id}`, data).then((r) => r.data),
  expire: (id) => api.patch(`/clients/offers/${id}`, { active: false }).then((r) => r.data),
  activate: (id) => api.patch(`/clients/offers/${id}`, { active: true }).then((r) => r.data),
  refresh: () => api.post('/clients/offers/refresh').then((r) => r.data),
  websiteSnapshot: () => api.post('/clients/offers/website-snapshot').then((r) => r.data),
};

export default api;
