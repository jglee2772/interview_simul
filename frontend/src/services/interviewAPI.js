/**
 * 파일: interviewAPI.js
 * 역할: 면접 시뮬레이션 API 서비스
 * 설명:
 * - 면접 시뮬레이션 관련 API 함수들을 작성합니다
 * - Interview.js 페이지에서 사용합니다
 * - apiConfig.js에서 설정한 Axios 인스턴스를 사용합니다
 * - API 엔드포인트:
 *   - POST /api/interview/start/ - 면접 시작
 *   - POST /api/interview/{id}/message/ - 메시지 전송
 *   - GET /api/interview/{id}/result/ - 결과 조회
 */

import api from './apiConfig';

const interviewAPI = {
  // 면접 시작 API 함수 작성
  startInterview: (data) => api.post('/interview/start/', data),
  
  // 면접 메시지 전송 API 함수 작성
  sendMessage: (interviewId, message) => 
    api.post(`/interview/${interviewId}/message/`, { message }),
  
  // 면접 결과 조회 API 함수 작성
  getResult: (interviewId) => api.get(`/interview/${interviewId}/result/`),
  
  // 면접 히스토리 조회 API 함수 작성 (필요시)
  getHistory: () => api.get('/interview/history/'),
};

export default interviewAPI;

