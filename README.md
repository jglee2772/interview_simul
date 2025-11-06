# 면접 시뮬레이션 웹사이트

면접 시뮬레이션, 인적성검사, 이력서 작성을 제공하는 웹 애플리케이션

## 기술 스택

### Frontend
- React 18+
- JavaScript
- React Router
- Axios

### Backend
- Python 3.10+
- Django 4.2+
- Django REST Framework

### Database
- MySQL

### 배포
- AWS Lightsail

## 프로젝트 구조

```
interview-simulation-web/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트 (5개 페이지)
│   │   ├── services/      # API 호출 서비스
│   │   ├── App.js         # 메인 앱 컴포넌트
│   │   └── index.js       # 진입점
│   └── package.json
│
├── backend/               # Django 백엔드
│   ├── config/            # Django 설정
│   ├── interview/         # 면접 시뮬레이션 앱
│   ├── assessment/        # 인적성검사 앱
│   ├── resume/            # 이력서 앱
│   ├── accounts/          # 인증 앱
│   └── requirements.txt
│
└── deployment/            # 배포 스크립트
```

## 페이지 구성

1. **메인 홈페이지** (`/`) - 프로젝트 소개 및 메인 화면
2. **면접 시뮬레이션 페이지** (`/interview`) - 면접 시뮬레이션 채팅 인터페이스
3. **인적성검사 페이지** (`/assessment`) - 인적성검사 질문/답변
4. **인적성검사 결과 페이지** (`/assessment-result/:id`) - 인적성검사 결과 표시
5. **이력서 작성 페이지** (`/resume`) - 이력서 작성 폼

## 개발 환경 설정

### Backend
```bash
cd backend
conda create -n interview python=3.12
conda activate interview
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm start
```

