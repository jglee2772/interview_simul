# 배포 환경 업데이트 가이드 (후원 기능 추가)

## 🚀 배포 전 체크리스트

### 1. 백엔드 환경 변수 추가

서버의 `/var/www/interview-simulation/backend/.env` 파일에 다음 추가:

```env
# 토스페이먼츠 API 개별 연동 시크릿 키
TOSS_SECRET_KEY=test_sk_xxx:xxx
```

### 2. 프론트엔드 환경 변수 추가

서버의 `/var/www/interview-simulation/frontend/.env` 파일 생성 또는 수정:

```env
# 토스페이먼츠 API 개별 연동 클라이언트 키
REACT_APP_TOSS_CLIENT_KEY=test_ck_26DIbXAaV0webj9q6nxd3qY50Q9R
```

## 📋 배포 단계

### 방법 1: 수동 배포 스크립트 사용 (권장)

```bash
cd /var/www/interview-simulation
./deployment/manual-deploy.sh
```

이 스크립트는 자동으로:
- Git pull
- 마이그레이션 실행 (homepage 앱 포함)
- 프론트엔드 빌드
- 서비스 재시작

### 방법 2: 수동 배포

```bash
# 프로젝트 루트로 이동
cd /var/www/interview-simulation/interview_simul

# Git 업데이트
git pull origin main
# 또는
git pull --no-rebase --no-edit origin main

# ===== 백엔드 배포 =====
cd backend
source venv/bin/activate

# 새로운 Python 패키지가 생겼다면
pip install -r requirements.txt

# <cryptography 보안관련 혹시 백엔드 안될때>
# pip install cryptography --upgrade

# 모델 변경이 있다면
python manage.py migrate

# 정적 파일이 바뀌었으면
python manage.py collectstatic --noinput

# ===== 프론트엔드 빌드 =====
cd ../frontend

# Node.js 버전 설정
source ~/.nvm/nvm.sh && nvm use 18

# 패키지 설치
npm install

# 빌드 (메모리 옵션 포함 - 메모리 부족 방지)
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# ===== 서비스 재시작 =====
sudo systemctl restart gunicorn
sudo systemctl restart nginx

# ===== 문제가 있으면 =====
# Gunicorn 로그 확인
sudo journalctl -u gunicorn -f

# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/error.log
```

## ⚠️ 중요 사항

1. **마이그레이션 필수**: `homepage` 앱의 모델이 변경되었으므로 반드시 마이그레이션을 실행해야 합니다.

2. **환경 변수 확인**: 
   - 백엔드 `.env`에 `TOSS_SECRET_KEY` 추가 확인
   - 프론트엔드 `.env`에 `REACT_APP_TOSS_CLIENT_KEY` 추가 확인

3. **토스페이먼츠 키 발급**:
   - [토스페이먼츠 개발자센터](https://developers.tosspayments.com/)에서 키 발급
   - API 개별 연동 키 사용 (사업자 등록 없이 사용 가능)
   - 시크릿 키는 "보기" 버튼 클릭하여 확인

## 🔍 배포 후 확인

1. 웹사이트 접속 확인
2. 홈페이지에서 후원 섹션 확인
3. 후원 기능 테스트 (테스트 카드: `4242-4242-4242-4242`)
4. Django Admin에서 후원 내역 확인

## 🐛 문제 해결

### 마이그레이션 오류
```bash
# 마이그레이션 파일 생성 확인
python manage.py makemigrations homepage

# 마이그레이션 상태 확인
python manage.py showmigrations homepage

# 마이그레이션 실행
python manage.py migrate homepage
```

### 환경 변수 인식 안 됨
- 프론트엔드: `.env` 파일 위치 확인 (`frontend/.env`)
- 백엔드: `.env` 파일 위치 확인 (`backend/.env`)
- 빌드 후 환경 변수 반영 확인

### React 빌드가 멈추는 경우 (메모리 부족)

**증상**: `npm run build` 실행 시 "Creating an optimized production build..."에서 멈춤

**원인**: 서버 메모리 부족 (Lightsail 작은 인스턴스에서 흔함)

**해결 방법 1: 스왑 메모리 추가 (권장) - 한 번만 실행하면 영구 적용**

스왑 메모리는 한 번 설정하면 재부팅 후에도 자동으로 활성화됩니다.

```bash
# 스왑 파일 생성 (2GB) - 이미 생성했다면 건너뛰기
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구적으로 활성화 (한 번만 실행)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 메모리 확인
free -h
```

**✅ 배포 스크립트 업데이트**: `manual-deploy.sh`가 자동으로 스왑 메모리를 확인하고 빌드 시 메모리 옵션을 적용합니다.

**해결 방법 2: 메모리 제한 옵션 사용 (수동 빌드 시 필수)**

수동으로 빌드할 때는 항상 메모리 옵션을 포함하세요:

```bash
cd /var/www/interview-simulation/interview_simul/frontend
source ~/.nvm/nvm.sh && nvm use 18

# 메모리 옵션과 함께 빌드
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

**✅ 권장**: 수동 배포 시 항상 이 옵션을 사용하세요.

**해결 방법 3: 로컬에서 빌드 후 업로드**
```bash
# 로컬 개발 환경에서
cd frontend
npm run build

# 빌드된 파일을 서버로 업로드
scp -r build/* ubuntu@your-server-ip:/var/www/interview-simulation/frontend/build/
```

**해결 방법 4: 빌드 중단 후 재시도**
```bash
# Ctrl+C로 중단
# 메모리 정리
sudo sync
sudo sysctl vm.drop_caches=3

# 다시 빌드
npm run build
```

