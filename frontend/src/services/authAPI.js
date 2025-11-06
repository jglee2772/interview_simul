/**
 * 파일: authAPI.js
 * 역할: 인증 API 서비스
 * 설명:
 * - 인증 관련 API 함수들을 작성합니다
 * - 모든 페이지에서 필요시 사용할 수 있습니다
 * - apiConfig.js에서 설정한 Axios 인스턴스를 사용합니다
 * - API 엔드포인트:
 *   - POST /api/auth/register/ - 회원가입
 *   - POST /api/auth/login/ - 로그인
 *   - GET /api/auth/user/ - 현재 사용자 정보
 */

import api from './apiConfig';

const authAPI = {
  // 회원가입 API 함수 작성
  register: (data) => api.post('/auth/register/', data),
  
  // 로그인 API 함수 작성
  login: (credentials) => api.post('/auth/login/', credentials),
  
  // 현재 사용자 정보 조회 API 함수 작성
  getCurrentUser: () => api.get('/auth/user/'),
  
  // 로그아웃 API 함수 작성 (필요시)
  logout: () => api.post('/auth/logout/'),
};

export default authAPI;

