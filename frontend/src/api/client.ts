import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Master Resumes ──────────────────────────────────────────────────────────
export const masterResumeApi = {
  list: () => api.get('/master-resumes/'),
  getActive: () => api.get('/master-resumes/active'),
  get: (id: number) => api.get(`/master-resumes/${id}`),
  upload: (file: File, name: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    return api.post('/master-resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: number, data: any) => api.put(`/master-resumes/${id}`, data),
  delete: (id: number) => api.delete(`/master-resumes/${id}`),
  activate: (id: number) => api.post(`/master-resumes/${id}/activate`),
  duplicate: (id: number) => api.post(`/master-resumes/${id}/duplicate`),
  getVersions: (id: number) => api.get(`/master-resumes/${id}/versions`),
};

// ── Job Analysis ────────────────────────────────────────────────────────────
export const jobAnalysisApi = {
  analyze: (data: { raw_text: string; company?: string; role?: string }) =>
    api.post('/job-analysis/analyze', data),
  get: (id: number) => api.get(`/job-analysis/${id}`),
  list: () => api.get('/job-analysis/'),
};

// ── ATS Score ───────────────────────────────────────────────────────────────
export const atsApi = {
  calculate: (masterResumeId: number, jobDescriptionId: number) =>
    api.post(`/ats-score?master_resume_id=${masterResumeId}&job_description_id=${jobDescriptionId}`),
};

// ── Resume Generation ───────────────────────────────────────────────────────
export const resumeApi = {
  generate: (data: { master_resume_id: number; job_description_id?: number; job_description_text?: string; template_id?: string }) =>
    api.post('/resumes/generate', data),
  list: () => api.get('/resumes/'),
  get: (id: number) => api.get(`/resumes/${id}`),
  update: (id: number, data: any) => api.put(`/resumes/${id}`, data),
  delete: (id: number) => api.delete(`/resumes/${id}`),
};

// ── Applications ────────────────────────────────────────────────────────────
export const applicationApi = {
  create: (data: any) => api.post('/applications/', data),
  list: (status?: string) => api.get('/applications/', { params: status ? { status } : {} }),
  kanban: () => api.get('/applications/kanban'),
  get: (id: number) => api.get(`/applications/${id}`),
  update: (id: number, data: any) => api.put(`/applications/${id}`, data),
  delete: (id: number) => api.delete(`/applications/${id}`),
};

export const timelineApi = {
  get: () => api.get('/timeline/'),
};

// ── Interviews ──────────────────────────────────────────────────────────────
export const interviewApi = {
  create: (data: any) => api.post('/interviews/', data),
  list: (applicationId?: number) => api.get('/interviews/', { params: applicationId ? { application_id: applicationId } : {} }),
  get: (id: number) => api.get(`/interviews/${id}`),
  update: (id: number, data: any) => api.put(`/interviews/${id}`, data),
  delete: (id: number) => api.delete(`/interviews/${id}`),
};

// ── Recruiters ──────────────────────────────────────────────────────────────
export const recruiterApi = {
  create: (data: any) => api.post('/recruiters/', data),
  list: () => api.get('/recruiters/'),
  get: (id: number) => api.get(`/recruiters/${id}`),
  update: (id: number, data: any) => api.put(`/recruiters/${id}`, data),
  delete: (id: number) => api.delete(`/recruiters/${id}`),
};

// ── Cover Letters ───────────────────────────────────────────────────────────
export const coverLetterApi = {
  generate: (data: any) => api.post('/cover-letters/generate', data),
  list: () => api.get('/cover-letters/'),
  get: (id: number) => api.get(`/cover-letters/${id}`),
  delete: (id: number) => api.delete(`/cover-letters/${id}`),
};

// ── LinkedIn ────────────────────────────────────────────────────────────────
export const linkedInApi = {
  generate: (data: any) => api.post('/linkedin/generate', data),
};

// ── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  summary: () => api.get('/analytics/summary'),
};

// ── PDF ─────────────────────────────────────────────────────────────────────
export const pdfApi = {
  generate: (resumeId: number, templateId?: string) =>
    api.post(`/pdf/generate/${resumeId}?template_id=${templateId || 'modern_ats'}`),
  download: (resumeId: number) => api.get(`/pdf/download/${resumeId}`, { responseType: 'blob' }),
};

// ── Skill Gap ───────────────────────────────────────────────────────────────
export const skillGapApi = {
  analyze: (masterResumeId: number, jobDescriptionId: number) =>
    api.post(`/skill-gap?master_resume_id=${masterResumeId}&job_description_id=${jobDescriptionId}`),
};

// ── System ──────────────────────────────────────────────────────────────────
export const systemApi = {
  health: () => api.get('/system/health'),
  latexStatus: () => api.get('/system/latex-status'),
  config: () => api.get('/system/config'),
  updateOpenAI: (apiKey: string, model?: string) =>
    api.post(`/system/config/openai?api_key=${apiKey}&model=${model || 'gpt-4o-mini'}`),
  backup: () => api.get('/system/backup', { responseType: 'blob' }),
  restore: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/system/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Authentication ──────────────────────────────────────────────────────────
export const authApi = {
  status: () => api.get('/auth/status'),
  setup: (password: string) => api.post('/auth/setup', { password }),
  unlock: (password: string) => api.post('/auth/unlock', { password }),
  lock: () => api.post('/auth/lock'),
};

// ── Settings ────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  updateApiKey: (provider: string, key: string) => api.post('/settings/keys', { provider, key }),
  deleteApiKey: (provider: string) => api.delete(`/settings/keys/${provider}`),
  getCosts: (params?: any) => api.get('/settings/costs', { params }),
  getCostsSummary: () => api.get('/settings/costs/summary'),
};

// ── Supporting Documents ─────────────────────────────────────────────────────
export const supportingDocumentsApi = {
  list: () => api.get('/supporting-documents/'),
  upload: (file: File, name: string, docType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('doc_type', docType);
    return api.post('/supporting-documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: number) => api.delete(`/supporting-documents/${id}`),
};

// ── Resume Memory Engine ─────────────────────────────────────────────────────
export const resumeMemoryApi = {
  list: () => api.get('/resume-memory/'),
  upsert: (key: string, value: string) => api.post('/resume-memory/', { key, value }),
  delete: (id: number) => api.delete(`/resume-memory/${id}`),
};

// ── Export ───────────────────────────────────────────────────────────────────
export const exportApi = {
  zip: (data: any) => api.post('/export/zip', data, { responseType: 'blob' }),
};

// ── Interview Intelligence Suite ─────────────────────────────────────────────
export const interviewIntelligenceApi = {
  getPrepPackageForApplication: (appId: number) => api.get(`/interviews/prep-packages/application/${appId}`),
  getPrepPackage: (pkgId: number) => api.get(`/interviews/prep-packages/${pkgId}`),
  listPrepPackages: () => api.get('/interviews/prep-packages/'),
  updatePerformance: (interviewId: number, data: { questions_asked: string; answers_given: string; lessons_learned: string }) => 
    api.put(`/interviews/track/${interviewId}`, data),
  askCoach: (data: { message: string; prep_package_id?: number; interview_id?: number; chat_history?: Array<{ role: string; content: string }> }) => 
    api.post('/interviews/coach', data),
};

export default api;
