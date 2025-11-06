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
  // 이력서 저장(생성) API 함수 작성
  saveResume: (data) => api.post('/resume/', data),
  
  // 이력서 조회 API 함수 작성
  getResume: (resumeId) => api.get(`/resume/${resumeId}/`),
  
  // 이력서 목록 조회 API 함수 작성 (필요시)
  getResumeList: () => api.get('/resume/'),
  
  // 이력서 수정 API 함수 작성
  updateResume: (resumeId, data) => api.put(`/resume/${resumeId}/`, data),
  
  // 이력서 삭제 API 함수 작성
  deleteResume: (resumeId) => api.delete(`/resume/${resumeId}/`),
};

export default resumeAPI;

