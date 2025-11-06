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
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

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

