# AWS Lightsail 배포 완전 가이드

## 목차
1. [사전 준비](#1-사전-준비)
2. [Lightsail 인스턴스 생성](#2-lightsail-인스턴스-생성)
3. [서버 초기 설정](#3-서버-초기-설정)
4. [프로젝트 배포](#4-프로젝트-배포)
5. [데이터베이스 설정](#5-데이터베이스-설정)
6. [자동 배포 설정 (GitHub Actions)](#6-자동-배포-설정-github-actions)
7. [도메인 및 SSL 설정](#7-도메인-및-ssl-설정)
8. [모니터링 및 관리](#8-모니터링-및-관리)
9. [문제 해결](#9-문제-해결)

---

## 1. 사전 준비

### 필요한 것들
- AWS 계정
- GitHub 저장소 (프로젝트 코드)
- 도메인 (선택사항, IP 주소로도 접속 가능)

### 프로젝트 정보
- **프로젝트 이름**: interview-simulation-web
- **프론트엔드**: React (JavaScript, Axios)
- **백엔드**: Django REST Framework
- **데이터베이스**: MySQL
- **배포 위치**: `/var/www/interview-simulation`

---

## 2. Lightsail 인스턴스 생성

### 2.1 AWS Lightsail 접속
1. AWS 콘솔 로그인
2. Lightsail 서비스 선택
3. "Create instance" 클릭

### 2.2 인스턴스 설정
- **Platform**: Linux/Unix
- **Blueprint**: Ubuntu 22.04 LTS
- **Instance plan**: 
  - 최소: $5/월 (1GB RAM, 1 vCPU) - 테스트용
  - 권장: $10/월 (2GB RAM, 1 vCPU) - 프로덕션용
- **Instance name**: `interview-simulation-server` (원하는 이름)

### 2.3 고정 IP 주소 할당
1. 인스턴스 생성 후
2. "Networking" 탭 클릭
3. "Create static IP" 클릭
4. 고정 IP 주소 할당 (예: `3.34.123.45`)

### 2.4 SSH 키 다운로드
1. "Account" → "SSH keys" 메뉴
2. 기본 키 다운로드 또는 새 키 생성
3. `.pem` 파일 저장 (예: `lightsail-key.pem`)

---

## 3. 서버 초기 설정

### 3.1 SSH 접속

#### Windows (PowerShell)
```powershell
ssh -i C:\path\to\lightsail-key.pem ubuntu@your-lightsail-ip
```

#### Windows (CMD)
```cmd
ssh -i C:\path\to\lightsail-key.pem ubuntu@your-lightsail-ip
```

#### Linux/Mac
```bash
chmod 400 lightsail-key.pem
ssh -i lightsail-key.pem ubuntu@your-lightsail-ip
```

**참고**: `your-lightsail-ip`는 할당받은 고정 IP 주소입니다.

### 3.2 초기 설정 스크립트 실행

서버에 접속한 후:

```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/interview-simulation
sudo chown -R $USER:$USER /var/www/interview-simulation

# Git 저장소 클론
cd /var/www/interview-simulation
git clone https://github.com/jglee2772/interview_simul.git .

# 초기 설정 스크립트 실행
chmod +x deployment/setup-lightsail.sh
./deployment/setup-lightsail.sh
```

**중요**: 스크립트 실행 전에 `setup-lightsail.sh` 파일의 MySQL 비밀번호를 수정하세요!

---

## 4. 프로젝트 배포

### 4.1 백엔드 설정

#### 4.1.1 Python 가상환경 설정
```bash
cd /var/www/interview-simulation/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### 4.1.2 환경 변수 파일 생성
```bash
cd /var/www/interview-simulation/backend
nano .env
```

`.env` 파일 내용:
```env
# Django Settings
DEBUG=False
SECRET_KEY=your-very-secure-secret-key-here-generate-with-django-secret-key-generator
ALLOWED_HOSTS=your-domain.com,your-lightsail-ip,localhost

# Database (MySQL)
DB_NAME=interview_simulation
DB_USER=interview_user
DB_PASSWORD=your_secure_mysql_password_here
DB_HOST=localhost
DB_PORT=3306

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here
```

**SECRET_KEY 생성 방법**:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### 4.1.3 데이터베이스 마이그레이션
```bash
cd /var/www/interview-simulation/backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

### 4.2 프론트엔드 빌드

#### 4.2.1 Node.js 및 패키지 설치
```bash
cd /var/www/interview-simulation/frontend

# Node.js 18 설치 확인
node --version

# 패키지 설치
npm install

# 환경 변수 파일 생성 (선택사항)
nano .env
```

`.env` 파일 내용 (프론트엔드):
```env
REACT_APP_API_URL=http://your-lightsail-ip/api
# 또는 도메인 사용 시
# REACT_APP_API_URL=https://your-domain.com/api
```

#### 4.2.2 React 앱 빌드
```bash
cd /var/www/interview-simulation/frontend
npm run build
```

빌드된 파일은 `frontend/build/` 폴더에 생성됩니다.

### 4.3 서비스 시작

#### 4.3.1 Gunicorn 서비스 시작
```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl status gunicorn
```

#### 4.3.2 Nginx 재시작
```bash
sudo nginx -t  # 설정 파일 검증
sudo systemctl restart nginx
sudo systemctl status nginx
```

---

## 5. 데이터베이스 설정

### 5.1 MySQL 데이터베이스 생성

```bash
sudo mysql -u root -p
```

MySQL 콘솔에서:
```sql
CREATE DATABASE interview_simulation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'interview_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON interview_simulation.* TO 'interview_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5.2 데이터베이스 연결 확인

```bash
cd /var/www/interview-simulation/backend
source venv/bin/activate
python manage.py dbshell
```

연결이 성공하면 MySQL 프롬프트가 나타납니다.

---

## 6. 자동 배포 설정 (GitHub Actions)

### 6.1 서버에서 SSH 키 생성

```bash
# 서버에 SSH 접속
ssh -i lightsail-key.pem ubuntu@your-lightsail-ip

# SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions
# Enter 키를 여러 번 눌러서 비밀번호 없이 생성

# 공개키를 authorized_keys에 추가
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# 개인키 확인 (이것을 GitHub Secrets에 추가)
cat ~/.ssh/github_actions
```

### 6.2 GitHub Secrets 설정

1. GitHub 저장소 접속
2. Settings → Secrets and variables → Actions
3. "New repository secret" 클릭
4. 다음 Secrets 추가:

#### LIGHTSAIL_HOST
- Name: `LIGHTSAIL_HOST`
- Value: `your-lightsail-ip` (예: `3.34.123.45`)

#### LIGHTSAIL_USER
- Name: `LIGHTSAIL_USER`
- Value: `ubuntu`

#### LIGHTSAIL_SSH_KEY
- Name: `LIGHTSAIL_SSH_KEY`
- Value: 위에서 복사한 개인키 전체 내용 (`-----BEGIN OPENSSH PRIVATE KEY-----` 부터 `-----END OPENSSH PRIVATE KEY-----` 까지)

### 6.3 자동 배포 테스트

```bash
# 로컬에서 테스트 커밋
git add .
git commit -m "Test: 자동 배포 테스트"
git push origin main
```

GitHub Actions 탭에서 배포 진행 상황을 확인할 수 있습니다.

---

## 7. 도메인 및 SSL 설정

### 7.1 도메인 연결

1. 도메인 제공업체에서 DNS 설정
2. A 레코드 추가:
   - Type: A
   - Name: @ (또는 www)
   - Value: Lightsail 고정 IP 주소
   - TTL: 3600

### 7.2 SSL 인증서 설치 (Let's Encrypt)

```bash
# Certbot으로 SSL 인증서 설치
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 7.3 Nginx SSL 설정 확인

SSL 설치 후 Nginx 설정이 자동으로 업데이트됩니다:
- HTTP (80) → HTTPS (443) 리다이렉트
- SSL 인증서 경로 설정

---

## 8. 모니터링 및 관리

### 8.1 서비스 상태 확인

```bash
# Gunicorn 상태
sudo systemctl status gunicorn

# Nginx 상태
sudo systemctl status nginx

# MySQL 상태
sudo systemctl status mysql
```

### 8.2 로그 확인

```bash
# Gunicorn 로그
sudo journalctl -u gunicorn -f

# Nginx 에러 로그
sudo tail -f /var/log/nginx/error.log

# Nginx 액세스 로그
sudo tail -f /var/log/nginx/access.log

# Django 로그 (설정된 경우)
tail -f /var/www/interview-simulation/backend/logs/django.log
```

### 8.3 서비스 재시작

```bash
# Gunicorn 재시작
sudo systemctl restart gunicorn

# Nginx 재시작
sudo systemctl restart nginx

# MySQL 재시작
sudo systemctl restart mysql
```

### 8.4 디스크 사용량 확인

```bash
# 디스크 사용량
df -h

# 프로젝트 폴더 크기
du -sh /var/www/interview-simulation
```

---

## 9. 문제 해결

### 9.1 502 Bad Gateway 오류

**원인**: Gunicorn이 실행되지 않음

**해결**:
```bash
# Gunicorn 상태 확인
sudo systemctl status gunicorn

# Gunicorn 재시작
sudo systemctl restart gunicorn

# 로그 확인
sudo journalctl -u gunicorn -n 50
```

### 9.2 404 Not Found 오류

**원인**: Nginx 설정 문제 또는 빌드 파일 없음

**해결**:
```bash
# React 빌드 확인
ls -la /var/www/interview-simulation/frontend/build

# 빌드 파일이 없으면 재빌드
cd /var/www/interview-simulation/frontend
npm run build

# Nginx 설정 확인
sudo nginx -t
sudo systemctl restart nginx
```

### 9.3 MySQL 연결 오류

**원인**: 데이터베이스 설정 문제

**해결**:
```bash
# .env 파일 확인
cat /var/www/interview-simulation/backend/.env

# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 접속 테스트
mysql -u interview_user -p interview_simulation
```

### 9.4 CORS 오류

**원인**: Django CORS 설정 문제

**해결**:
```bash
# settings.py 확인
nano /var/www/interview-simulation/backend/config/settings.py

# CORS_ALLOWED_ORIGINS에 도메인 추가
# 예: CORS_ALLOWED_ORIGINS = ['https://your-domain.com']

# Gunicorn 재시작
sudo systemctl restart gunicorn
```

### 9.5 정적 파일 404 오류

**원인**: collectstatic 미실행 또는 경로 문제

**해결**:
```bash
cd /var/www/interview-simulation/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Nginx 설정 확인
sudo nginx -t
```

### 9.6 GitHub Actions 배포 실패

**원인**: SSH 키 또는 권한 문제

**해결**:
1. GitHub Secrets 확인
2. 서버에서 SSH 키 권한 확인:
   ```bash
   chmod 600 ~/.ssh/github_actions
   chmod 644 ~/.ssh/github_actions.pub
   ```
3. 수동으로 SSH 접속 테스트:
   ```bash
   ssh -i ~/.ssh/github_actions ubuntu@localhost
   ```

---

## 10. 배포 후 확인 사항

### 10.1 웹사이트 접속 확인

1. **프론트엔드 확인**
   - `http://your-lightsail-ip` 또는 `https://your-domain.com`
   - 5개 페이지가 정상적으로 표시되는지 확인

2. **API 확인**
   - `http://your-lightsail-ip/api/` 또는 `https://your-domain.com/api/`
   - Django REST Framework 브라우징 가능한 API 확인

3. **Admin 페이지 확인**
   - `http://your-lightsail-ip/admin/` 또는 `https://your-domain.com/admin/`
   - 관리자 계정으로 로그인 가능한지 확인

### 10.2 기능 테스트

1. **면접 시뮬레이션**
   - 면접 시작 기능
   - 메시지 전송 기능

2. **인적성검사**
   - 검사 시작 기능
   - 질문/답변 기능
   - 결과 조회 기능

3. **이력서 작성**
   - 이력서 저장 기능
   - 이력서 조회 기능

---

## 11. 유지보수

### 11.1 정기적인 업데이트

```bash
# 시스템 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# Python 패키지 업데이트
cd /var/www/interview-simulation/backend
source venv/bin/activate
pip install --upgrade -r requirements.txt

# Node.js 패키지 업데이트
cd /var/www/interview-simulation/frontend
npm update
```

### 11.2 백업

```bash
# 데이터베이스 백업
mysqldump -u interview_user -p interview_simulation > backup_$(date +%Y%m%d).sql

# 프로젝트 파일 백업
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/interview-simulation
```

### 11.3 로그 로테이션

Nginx와 Gunicorn 로그는 자동으로 로테이션되지만, 필요시 수동 설정 가능합니다.

---

## 12. 비용 관리

### Lightsail 요금제
- **$5/월**: 1GB RAM, 1 vCPU, 40GB SSD (테스트용)
- **$10/월**: 2GB RAM, 1 vCPU, 60GB SSD (권장)
- **$20/월**: 4GB RAM, 2 vCPU, 80GB SSD (고성능)

### 데이터 전송
- Lightsail은 월별 데이터 전송량이 포함되어 있습니다
- 초과 시 추가 요금 발생

---

## 13. 보안 체크리스트

- [ ] `.env` 파일이 Git에 포함되지 않았는지 확인
- [ ] `DEBUG=False` 설정 확인
- [ ] `SECRET_KEY`가 안전하게 생성되었는지 확인
- [ ] MySQL 비밀번호가 강력한지 확인
- [ ] 방화벽 설정 확인 (22, 80, 443 포트만 열림)
- [ ] SSL 인증서 설치 확인
- [ ] 정기적인 보안 업데이트

---

## 14. 빠른 참조 명령어

```bash
# 서비스 상태 확인
sudo systemctl status gunicorn nginx mysql

# 서비스 재시작
sudo systemctl restart gunicorn nginx

# 로그 확인
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/error.log

# 프로젝트 디렉토리로 이동
cd /var/www/interview-simulation

# 가상환경 활성화
cd backend && source venv/bin/activate

# 마이그레이션
python manage.py migrate

# 정적 파일 수집
python manage.py collectstatic --noinput
```

---

## 15. 추가 리소스

- [AWS Lightsail 문서](https://lightsail.aws.amazon.com/ls/docs/)
- [Django 배포 가이드](https://docs.djangoproject.com/en/4.2/howto/deployment/)
- [Nginx 문서](https://nginx.org/en/docs/)
- [Gunicorn 문서](https://docs.gunicorn.org/)

---

**문의사항이나 문제가 발생하면 이 가이드를 참조하거나 로그를 확인하세요.**

