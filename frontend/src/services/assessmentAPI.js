/**
 * 파일: assessmentAPI.js
 * 역할: 인적성검사 API 서비스
 * 설명:
 * - 인적성검사 관련 API 함수들을 작성합니다
 * - Assessment.js, AssessmentResult.js 페이지에서 사용합니다
 * - apiConfig.js에서 설정한 Axios 인스턴스를 사용합니다
 * - API 엔드포인트:
 *   - POST /api/assessment/start/ - 인적성검사 시작
 *   - GET /api/assessment/{id}/questions/ - 질문 조회
 *   - POST /api/assessment/{id}/submit/ - 답변 제출
 *   - GET /api/assessment/{id}/result/ - 결과 조회
 */

import api from './apiConfig';

const assessmentAPI = {
  // 인적성검사 시작 API 함수 작성
  startAssessment: (data) => api.post('/assessment/start/', data),
  
  // 질문 조회 API 함수 작성
  getQuestions: (assessmentId) => 
    api.get(`/assessment/${assessmentId}/questions/`),
  
  // 답변 제출 API 함수 작성
  submitAnswer: (assessmentId, answers) => 
    api.post(`/assessment/${assessmentId}/submit/`, { answers }),
  
  // 결과 조회 API 함수 작성
  getResult: (assessmentId) => 
    api.get(`/assessment/${assessmentId}/result/`),
  
  // 결과 히스토리 조회 API 함수 작성 (필요시)
  getHistory: () => api.get('/assessment/history/'),

// AI 직업 추천 API
getRecommendedJob: (comm, resp, prob, grow, stre, adap) =>
  api.get(`/assessment/recommend/`, {
    params: { comm, resp, prob, grow, stre, adap }
  }),
};

export default assessmentAPI;

