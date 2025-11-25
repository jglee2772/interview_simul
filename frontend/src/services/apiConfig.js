/**
 * 파일: apiConfig.js
 * 역할: Axios 공통 설정
 * 설명:
 * - Axios 인스턴스의 공통 설정을 정의합니다
 * - API 기본 URL, 공통 헤더, 인터셉터 등을 설정합니다
 * - 모든 API 서비스 파일에서 이 설정을 사용합니다
 * - 인증 토큰 관리, 에러 처리 등 공통 로직을 작성합니다
 */

import axios from 'axios';

// API 기본 URL 설정
// 환경 변수가 있으면 사용하고, 없으면 현재 호스트 기반으로 자동 결정
const getApiBaseUrl = () => {
  // 환경 변수가 설정되어 있으면 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 브라우저 환경에서 실행 중이면 현재 호스트 사용
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  
  // 기본값 (서버 사이드 렌더링 등)
  return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 작성 (토큰 추가 등)
api.interceptors.request.use(
  (config) => {
    // 인증 토큰 추가 로직 작성
    // 예: const token = localStorage.getItem('token');
    //     if (token) { config.headers.Authorization = `Bearer ${token}`; }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 작성 (에러 처리)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 에러 처리 로직 작성
    // 예: 401 에러 시 로그인 페이지로 리다이렉트
    //     if (error.response?.status === 401) { ... }
    return Promise.reject(error);
  }
);

export default api;

