# 프로젝트 파일별 역할 가이드

## Frontend (React + JavaScript)

### 페이지 컴포넌트 (`src/pages/`)

#### 1. Home.js / Home.css
- **역할**: 메인 홈페이지 UI 컴포넌트 작성
- **작성 내용**: HTML 구조, React 컴포넌트, CSS 스타일

#### 2. Interview.js / Interview.css
- **역할**: 면접 시뮬레이션 페이지 UI 및 로직 작성
- **작성 내용**: 
  - HTML 구조 (채팅 인터페이스)
  - React 상태 관리 (메시지, 로딩 상태 등)
  - API 호출 로직
  - CSS 스타일

#### 3. Assessment.js / Assessment.css
- **역할**: 인적성검사 페이지 UI 및 로직 작성
- **작성 내용**:
  - HTML 구조 (질문/답변 인터페이스)
  - React 상태 관리 (질문 목록, 현재 질문, 답변 등)
  - API 호출 로직
  - CSS 스타일

#### 4. AssessmentResult.js / AssessmentResult.css
- **역할**: 인적성검사 결과 페이지 UI 작성
- **작성 내용**:
  - HTML 구조 (결과 표시)
  - React 상태 관리 (결과 데이터)
  - API 호출 로직 (결과 조회)
  - CSS 스타일 (차트, 그래프 등)

#### 5. Resume.js / Resume.css
- **역할**: 이력서 작성 페이지 UI 및 로직 작성
- **작성 내용**:
  - HTML 구조 (폼 입력 필드)
  - React 상태 관리 (폼 데이터)
  - API 호출 로직 (Axios 사용 - resumeAPI.js)
  - CSS 스타일

### 컴포넌트 (`src/components/`)

#### Navbar.js / Navbar.css
- **역할**: 네비게이션 바 컴포넌트 작성
- **작성 내용**: HTML 구조, CSS 스타일

### 서비스 (`src/services/`)

#### apiConfig.js
- **역할**: Axios 공통 설정 작성
- **작성 내용**:
  - Axios 인스턴스 설정
  - API 기본 URL 설정
  - 요청/응답 인터셉터 (토큰 관리, 에러 처리)
  - 모든 API 서비스 파일에서 공통으로 사용

#### interviewAPI.js
- **역할**: 면접 시뮬레이션 API 서비스 작성
- **작성 내용**: 면접 시뮬레이션 관련 API 함수들
- **사용 페이지**: Interview.js

#### assessmentAPI.js
- **역할**: 인적성검사 API 서비스 작성
- **작성 내용**: 인적성검사 관련 API 함수들
- **사용 페이지**: Assessment.js, AssessmentResult.js

#### resumeAPI.js
- **역할**: 이력서 API 서비스 작성
- **작성 내용**: 이력서 관련 API 함수들
- **사용 페이지**: Resume.js

#### authAPI.js
- **역할**: 인증 API 서비스 작성
- **작성 내용**: 인증 관련 API 함수들
- **사용 페이지**: 모든 페이지에서 필요시 사용

#### api.js (선택사항)
- **역할**: 통합 API 서비스 (레거시 호환용)
- **작성 내용**: 모든 API 서비스를 통합 export

### 설정 파일

#### App.js
- **역할**: 메인 앱 컴포넌트 및 라우팅 설정
- **작성 내용**: React Router 설정, 페이지 라우팅

#### index.js
- **역할**: React 앱 진입점
- **작성 내용**: ReactDOM 렌더링

#### index.css / App.css
- **역할**: 전역 스타일 작성
- **작성 내용**: CSS 스타일

## Backend (Django REST Framework)

### 각 앱별 파일 구조

#### models.py
- **역할**: 데이터베이스 모델 작성
- **작성 내용**: Django ORM 모델 정의 (MySQL 테이블 구조)

#### views.py
- **역할**: API 뷰(컨트롤러) 작성
- **작성 내용**:
  - Django REST Framework ViewSet 작성
  - API 엔드포인트 로직 구현
  - 비즈니스 로직 작성

#### serializers.py
- **역할**: API 시리얼라이저 작성
- **작성 내용**:
  - 모델 데이터를 JSON으로 변환
  - JSON을 모델 데이터로 변환
  - 데이터 검증

#### urls.py
- **역할**: URL 라우팅 설정
- **작성 내용**: API 엔드포인트 경로 정의

#### admin.py
- **역할**: Django Admin 설정
- **작성 내용**: 관리자 페이지에서 모델 관리 설정

### 앱별 역할

#### interview (면접 시뮬레이션)
- **models.py**: Interview, InterviewMessage, InterviewResult 모델
- **views.py**: 면접 시작, 메시지 전송, 결과 조회 API
- **serializers.py**: 면접 관련 시리얼라이저

#### assessment (인적성검사)
- **models.py**: Assessment, AssessmentQuestion, AssessmentAnswer, AssessmentResult 모델
- **views.py**: 검사 시작, 질문 조회, 답변 제출, 결과 조회 API
- **serializers.py**: 인적성검사 관련 시리얼라이저

#### resume (이력서)
- **models.py**: Resume, Education, Experience, Certificate 모델
- **views.py**: 이력서 생성, 조회, 수정, 삭제 API
- **serializers.py**: 이력서 관련 시리얼라이저

#### accounts (인증)
- **views.py**: 회원가입, 로그인, 사용자 정보 조회 API

### 설정 파일

#### config/settings.py
- **역할**: Django 프로젝트 설정 파일
- **작성 내용**: 데이터베이스, 미들웨어, 앱, 보안 설정

#### config/urls.py
- **역할**: 메인 URL 라우팅 설정
- **작성 내용**: 각 앱의 URL 연결

## 배포

### deployment/setup-lightsail.sh
- **역할**: AWS Lightsail 서버 초기 설정 스크립트
- **작용**: 서버 초기 설정 자동화

### deployment/manual-deploy.sh
- **역할**: 수동 배포 스크립트
- **작용**: 배포 프로세스 자동화

### .github/workflows/deploy.yml
- **역할**: GitHub Actions 자동 배포 워크플로우
- **작용**: Git push 시 자동 배포

