/**
 * 파일: homepageAPI.js
 * 역할: 홈페이지 API 서비스
 * 설명:
 * - 홈페이지 관련 API 함수들을 작성합니다
 * - Home.js 페이지에서 사용합니다
 * - apiConfig.js에서 설정한 Axios 인스턴스를 사용합니다
 * - API 엔드포인트:
 *   - POST /api/homepage/payment/request/ - 결제 요청
 *   - POST /api/homepage/payment/confirm/ - 결제 승인
 */

import api from './apiConfig';

const homepageAPI = {
  // 결제 요청 API 함수
  requestPayment: (data) => api.post('/homepage/payment/request/', data),
  
  // 결제 승인 API 함수
  confirmPayment: (data) => api.post('/homepage/payment/confirm/', data),
};

export default homepageAPI;

