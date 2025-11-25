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
# 1. 백엔드 업데이트
cd /var/www/interview-simulation/backend
source venv/bin/activate
git pull origin main
pip install -r requirements.txt

# 2. 마이그레이션 실행 (중요!)
python manage.py makemigrations homepage
python manage.py migrate

# 3. 정적 파일 수집
python manage.py collectstatic --noinput

# 4. Gunicorn 재시작
sudo systemctl restart gunicorn

# 5. 프론트엔드 업데이트
cd /var/www/interview-simulation/frontend
git pull origin main
npm install
npm run build

# 6. Nginx 재시작
sudo systemctl reload nginx
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

