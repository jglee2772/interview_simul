import api from './apiConfig';

const resumeAPI = {
  analyzeSection: (section, content) => api.post('/resume/analyze/', { section, content }),
  analyzeFull: (resumeData) => api.post('/resume/analyze-full/', { resumeData }),
};

export default resumeAPI;

