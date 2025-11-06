/**
 * 파일: api.js (레거시 호환용)
 * 역할: 통합 API 서비스 (선택사항)
 * 설명:
 * - 기존 코드와의 호환성을 위해 유지합니다
 * - 각 API 서비스를 통합 export합니다
 * - 새로운 코드에서는 개별 API 파일을 직접 import하는 것을 권장합니다
 * 
 * 사용 예시:
 * import { interviewAPI, assessmentAPI, resumeAPI, authAPI } from '../services/api';
 * 
 * 또는 개별 import (권장):
 * import interviewAPI from '../services/interviewAPI';
 */

import interviewAPI from './interviewAPI';
import assessmentAPI from './assessmentAPI';
import resumeAPI from './resumeAPI';
import authAPI from './authAPI';

// 통합 export (필요시)
export {
  interviewAPI,
  assessmentAPI,
  resumeAPI,
  authAPI,
};

// 기본 export는 apiConfig의 Axios 인스턴스
export { default } from './apiConfig';
