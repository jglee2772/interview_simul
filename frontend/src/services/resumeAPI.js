/**
 * 파일: resumeAPI.js
 * 역할: 이력서 API 서비스
 * 설명:
 * - 이력서 관련 API 함수들을 작성합니다
 * - Resume.js 페이지에서 사용합니다
 * - apiConfig.js에서 설정한 Axios 인스턴스를 사용합니다
 * - API 엔드포인트:
 *   - POST /api/resume/ - 이력서 생성
 *   - GET /api/resume/{id}/ - 이력서 조회
 *   - PUT /api/resume/{id}/ - 이력서 수정
 *   - DELETE /api/resume/{id}/ - 이력서 삭제
 */

import api from './apiConfig';

const resumeAPI = {
  saveResume: (data) => {
    if (data instanceof FormData) {
      return api.post('/resume/', data, {
        headers: { 'Content-Type': undefined }
      });
    }
    return api.post('/resume/', data);
  },
  
  getResume: (resumeId) => api.get(`/resume/${resumeId}/`),
  getResumeList: () => api.get('/resume/'),
  updateResume: (resumeId, data) => api.put(`/resume/${resumeId}/`, data),
  deleteResume: (resumeId) => api.delete(`/resume/${resumeId}/`),
  
  // AI 분석 API
  analyzeSection: (section, content) => 
    api.post('/resume/analyze/', { section, content }),
};

export default resumeAPI;

