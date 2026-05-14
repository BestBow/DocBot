import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:3001/api',
});

export const uploadDocument  = (formData, onProgress) =>
  api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  }).then(r => r.data);

export const listDocuments   = () => api.get('/documents').then(r => r.data.documents);
export const getDocument     = (id) => api.get(`/documents/${id}`).then(r => r.data);
export const deleteDocument  = (id) => api.delete(`/documents/${id}`);
export const exportDocument  = (id, format) =>
  api.get(`/documents/${id}/export?format=${format}`, { responseType: 'blob' }).then(r => r.data);