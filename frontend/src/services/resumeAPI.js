import api from './apiConfig';

const resumeAPI = {
  saveResume: (data) => api.post('/resume/', data),
  getResume: (resumeId) => api.get(`/resume/${resumeId}/`),
  getResumeList: () => api.get('/resume/'),
  updateResume: (resumeId, data) => api.put(`/resume/${resumeId}/`, data),
  deleteResume: (resumeId) => api.delete(`/resume/${resumeId}/`),
  analyzeSection: (section, content) => api.post('/resume/analyze/', { section, content }),
  analyzeFull: (resumeData) => api.post('/resume/analyze-full/', { resumeData }),
};

export default resumeAPI;

