# 프론트엔드만 수정한 경우 배포 가이드

프론트엔드 코드만 변경했을 때 필요한 최소 배포 단계입니다.

## 필수 단계

```bash
# 1. 최신 코드 가져오기
cd /var/www/interview-simulation/interview_simul
git pull origin main

# 2. 프론트엔드 빌드
cd frontend
source ~/.nvm/nvm.sh && nvm use 18
npm install
npm run build

# 3. Nginx만 재시작 (프론트엔드 정적 파일 갱신)
sudo systemctl restart nginx
```

## 단계별 설명

### 1. git pull
- 최신 프론트엔드 코드를 가져옵니다.

### 2. 프론트엔드 빌드
- `npm install`: 새로운 패키지가 있다면 설치
- `npm run build`: React 앱을 빌드하여 `build/` 폴더에 생성
- Nginx가 이 `build/` 폴더를 서빙합니다.

### 3. Nginx 재시작
- 새로 빌드된 정적 파일을 서빙하기 위해 Nginx만 재시작
- **Gunicorn 재시작 불필요** (백엔드 변경 없음)

## 불필요한 단계 (프론트엔드만 수정 시)

❌ `cd backend` - 불필요
❌ `pip install -r requirements.txt` - 불필요 (백엔드 변경 없음)
❌ `python manage.py migrate` - 불필요 (모델 변경 없음)
❌ `python manage.py collectstatic` - 불필요 (Django 정적 파일 변경 없음)
❌ `sudo systemctl restart gunicorn` - 불필요 (백엔드 변경 없음)

## 문제 발생 시

```bash
# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# Nginx 설정 테스트
sudo nginx -t
```

## 전체 배포 가이드

백엔드도 수정했거나 전체 배포가 필요한 경우:
→ `deployment/AWS_LIGHTSAIL_DEPLOYMENT.md` 참고

