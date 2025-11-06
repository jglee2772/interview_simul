# AWS Lightsail 배포 가이드

## 배포 방법

### 방법 1: GitHub Actions (권장) ⭐

Railway와 유사한 Git push 자동 배포를 원한다면 이 방법을 권장합니다.

**설정 방법:**

1. **Lightsail 서버 초기 설정**
   ```bash
   # 서버에 SSH 접속
   ssh ubuntu@your-lightsail-ip
   
   # 초기 설정 스크립트 실행
   chmod +x deployment/setup-lightsail.sh
   ./deployment/setup-lightsail.sh
   ```

2. **GitHub Secrets 설정**
   
   GitHub 저장소 → Settings → Secrets and variables → Actions에서 다음 추가:
   - `LIGHTSAIL_HOST`: 서버 IP 주소
   - `LIGHTSAIL_USER`: 서버 사용자명 (보통 `ubuntu`)
   - `LIGHTSAIL_SSH_KEY`: SSH 개인키 (서버의 `~/.ssh/id_rsa` 내용)

3. **SSH 키 생성 (서버에서)**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   # 생성된 공개키를 authorized_keys에 추가
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   # 개인키를 복사해서 GitHub Secrets에 추가
   cat ~/.ssh/id_rsa
   ```

4. **자동 배포 활성화**
   - `.github/workflows/deploy.yml` 파일이 있으면 자동으로 작동
   - `main` 브랜치에 push하면 자동 배포

### 방법 2: 수동 배포

**배포 스크립트 사용:**
```bash
# 서버에 SSH 접속 후
cd /var/www/interview-simulation
chmod +x deployment/manual-deploy.sh
./deployment/manual-deploy.sh
```

## 초기 설정 단계

### 1. Lightsail 인스턴스 생성
- Ubuntu 22.04 LTS 선택
- 적어도 2GB RAM 권장
- 고정 IP 주소 할당

### 2. 서버 초기 설정
```bash
# 서버에 SSH 접속
ssh -i your-key.pem ubuntu@your-lightsail-ip

# 초기 설정 스크립트 실행
cd /var/www/interview-simulation
chmod +x deployment/setup-lightsail.sh
./deployment/setup-lightsail.sh
```

### 3. 환경 변수 설정
```bash
# 백엔드 .env 파일 생성
cd /var/www/interview-simulation/backend
nano .env
```

`.env` 파일 내용:
```env
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=mysql://interview_user:password@localhost/interview_simulation
ALLOWED_HOSTS=your-domain.com,your-lightsail-ip
OPENAI_API_KEY=your-openai-api-key
DB_NAME=interview_simulation
DB_USER=interview_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=3306
```

### 4. Django 초기 설정
```bash
cd /var/www/interview-simulation/backend
source venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 5. SSL 인증서 설치 (도메인 사용 시)
```bash
sudo certbot --nginx -d your-domain.com
```

## 배포 구조

```
Internet
  ↓
Nginx (80, 443)
  ├─→ React 빌드 파일 (정적 파일)
  └─→ Gunicorn (Django API) → 8000 포트

MySQL (3306) → 데이터베이스
```

## 모니터링

### 서비스 상태 확인
```bash
# Gunicorn 상태
sudo systemctl status gunicorn

# Nginx 상태
sudo systemctl status nginx

# MySQL 상태
sudo systemctl status mysql

# 로그 확인
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/error.log
```

## 문제 해결

### MySQL 연결 오류
- 데이터베이스 사용자 권한 확인
- `.env` 파일의 데이터베이스 정보 확인
- MySQL 서비스 상태 확인

### CORS 오류
- `settings.py`에서 `CORS_ALLOWED_ORIGINS` 확인
- Nginx 설정에서 프록시 헤더 확인

### 정적 파일 404 오류
- `python manage.py collectstatic` 실행
- Nginx 설정에서 정적 파일 경로 확인
