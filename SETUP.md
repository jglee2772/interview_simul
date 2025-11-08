# 프로젝트 설정 가이드

## 기술 스택

- **Frontend**: React + JavaScript + Axios
- **Backend**: Python + Django REST Framework
- **Database**: MySQL
- **배포**: AWS Lightsail

## 로컬 개발 환경 설정

> **참고**  
> 백엔드 관련 명령은 항상 저장소 루트에서 `cd backend` 후 실행합니다.  
> 프론트엔드는 `cd frontend` 후 진행합니다.

### 1. 사전 요구사항

- Python 3.10 이상
- Node.js 18 이상
- MySQL 8.0 이상
- Git

### 2. MySQL 데이터베이스 설정

#### 방법 1: MySQL 명령줄 사용

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE interview_simulation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'interview_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON interview_simulation.* TO 'interview_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 방법 2: MySQL Workbench 사용

1. MySQL Workbench 실행
2. "Local instance MySQL80" 연결 클릭
3. 좌측 Navigator에서 "SCHEMAS" 우클릭 → "Create Schema"
4. Schema name: `interview_simulation`
5. Default Collation: `utf8mb4_unicode_ci` 선택
6. "Apply" 클릭

**MySQL Workbench 연결 정보**:
- Hostname: `127.0.0.1` 또는 `localhost`
- Port: `3306`
- Username: `root`
- Password: `1234` (또는 설정한 비밀번호)
- Database: `interview_simulation`

### 3. Backend 설정

#### Windows

```cmd
REM 백엔드 디렉토리로 이동
cd backend

REM (선택) 기존 가상환경 재사용 또는 새로 생성
python -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**문제 발생 시**: Python 설치 확인 및 가상환경 활성화 확인

#### Linux/Mac

```bash
# 백엔드 디렉토리로 이동
cd backend

# (선택) 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

# 환경 변수 파일 생성
cp .env.example .env
# .env 파일을 열어서 데이터베이스 정보와 API 키 설정

# 데이터베이스 마이그레이션
python manage.py makemigrations
python manage.py migrate

# 관리자 계정 생성
python manage.py createsuperuser

# 서버 실행
python manage.py runserver
```

**`.env` 파일 예시:**
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL Workbench 연결 정보와 동일하게 설정
DB_NAME=interview_simulation
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

OPENAI_API_KEY=your-openai-api-key
```

**중요**: 
- `DB_PASSWORD`는 MySQL root 비밀번호를 입력하세요
- MySQL Workbench 연결 정보와 동일하게 설정해야 합니다
- 자세한 MySQL Workbench 설정은 `backend/MYSQL_WORKBENCH_SETUP.md` 참조

### 4. Frontend 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 패키지 설치
npm install

# 환경 변수 파일 생성 (선택사항)
cp .env.example .env
# .env 파일에 API URL 설정 (기본값: http://localhost:8000/api)

# 개발 서버 실행
npm start
```

**`.env` 파일 예시:**
```env
REACT_APP_API_URL=http://localhost:8000/api
```

## 파일별 역할

### Frontend

#### `src/pages/`
- **Home.js** - 메인 홈페이지 UI 컴포넌트 작성
- **Interview.js** - 면접 시뮬레이션 페이지 UI 및 로직 작성 (Axios 사용)
- **Assessment.js** - 인적성검사 페이지 UI 및 로직 작성 (Axios 사용)
- **AssessmentResult.js** - 인적성검사 결과 페이지 UI 작성 (Axios 사용)
- **Resume.js** - 이력서 작성 페이지 UI 및 로직 작성 (Axios 사용)

#### `src/components/`
- **Navbar.js** - 네비게이션 바 컴포넌트 작성

#### `src/services/`
- **api.js** - API 서비스 레이어 작성 (Axios를 사용한 API 통신)

### Backend

#### 각 앱별 파일 구조

**models.py** - 데이터베이스 모델 작성 (Django ORM)
**views.py** - API 뷰(컨트롤러) 작성 (Django REST Framework)
**serializers.py** - API 시리얼라이저 작성 (요청/응답 데이터 변환)
**urls.py** - URL 라우팅 설정
**admin.py** - Django Admin 설정

#### 앱별 역할

- **interview** - 면접 시뮬레이션 관련 API
- **assessment** - 인적성검사 관련 API
- **resume** - 이력서 관련 API
- **accounts** - 인증 관련 API

## API 엔드포인트

### 면접 시뮬레이션
- `POST /api/interview/start/` - 면접 시작
- `POST /api/interview/{id}/message/` - 메시지 전송
- `GET /api/interview/{id}/result/` - 결과 조회

### 인적성검사
- `POST /api/assessment/start/` - 인적성검사 시작
- `GET /api/assessment/{id}/questions/` - 질문 조회
- `POST /api/assessment/{id}/submit/` - 답변 제출
- `GET /api/assessment/{id}/result/` - 결과 조회

### 이력서
- `POST /api/resume/` - 이력서 생성
- `GET /api/resume/{id}/` - 이력서 조회
- `PUT /api/resume/{id}/` - 이력서 수정
- `DELETE /api/resume/{id}/` - 이력서 삭제

## 배포

AWS Lightsail 배포는 `deployment/README.md` 참조
