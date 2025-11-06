# API 서비스 파일 구조

## 파일 구조

```
services/
├── apiConfig.js          # Axios 공통 설정 (모든 API에서 사용)
├── interviewAPI.js       # 면접 시뮬레이션 API (Interview.js에서 사용)
├── assessmentAPI.js      # 인적성검사 API (Assessment.js, AssessmentResult.js에서 사용)
├── resumeAPI.js          # 이력서 API (Resume.js에서 사용)
├── authAPI.js            # 인증 API (필요한 모든 페이지에서 사용)
└── api.js                # 통합 export (레거시 호환용, 선택사항)
```

## 사용 방법

### 방법 1: 개별 import (권장) ⭐

각 페이지에서 필요한 API만 import합니다.

```javascript
// Interview.js
import interviewAPI from '../services/interviewAPI';

// Assessment.js
import assessmentAPI from '../services/assessmentAPI';

// Resume.js
import resumeAPI from '../services/resumeAPI';
```

### 방법 2: 통합 import

모든 API를 한 번에 import합니다.

```javascript
import { interviewAPI, assessmentAPI, resumeAPI, authAPI } from '../services/api';
```

## 각 담당자 작업 가이드

### 면접 시뮬레이션 담당자
- `interviewAPI.js` 파일 수정
- `apiConfig.js`의 공통 설정은 수정하지 않음

### 인적성검사 담당자
- `assessmentAPI.js` 파일 수정
- `apiConfig.js`의 공통 설정은 수정하지 않음

### 이력서 담당자
- `resumeAPI.js` 파일 수정
- `apiConfig.js`의 공통 설정은 수정하지 않음

### 공통 설정 수정이 필요한 경우
- `apiConfig.js` 파일 수정
- 모든 API 서비스에 영향을 주므로 팀과 협의 후 수정

## 장점

1. **독립적 작업**: 각 담당자가 자신의 API 파일만 수정
2. **파일 충돌 최소화**: Git 병합 충돌 가능성 감소
3. **코드 관리 용이**: 각 페이지별로 API가 명확히 분리
4. **재사용성**: 필요한 API만 import하여 사용

