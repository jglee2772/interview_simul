# Lightsail 실서버 배포 로그 (2025-11-12)

실제 진행한 작업 순서를 잊지 않도록 정리한 문서입니다.  
프로젝트 경로는 `/var/www/interview-simulation/interview_simul` 구조를 기준으로 작성했습니다.

---

## 1. AWS Lightsail 준비
- Lightsail 인스턴스 생성 (Ubuntu 22.04 LTS, ap-southeast-2, 고정 IP 연결).
- 기본 SSH 키 페어 다운로드 → 로컬 PC에서 `ssh -i … ubuntu@<고정 IP>`로 접속.
- ssh -i C:\Users\admin\Desktop\importantfile\interviewsimulweb.pem ubuntu@13.125.180.201

## 2. 서버 초기 세팅
1. 시스템 패키지 업데이트  
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. 필수 패키지 설치 (`setup-lightsail.sh` 실행 대신 수동 진행)  
   ```bash
   sudo apt install -y python3.10 python3-pip python3-venv nodejs npm nginx git mysql-server mysql-client ufw
   ```
3. nvm 및 Node 18 설치  
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.nvm/nvm.sh
   nvm install 18
   nvm use 18
   ```

## 3. 프로젝트 클론
```bash
sudo mkdir -p /var/www/interview-simulation
sudo chown -R $USER:$USER /var/www/interview-simulation
cd /var/www/interview-simulation
git clone https://github.com/jglee2772/interview_simul.git
```
- 이후 모든 작업은 `/var/www/interview-simulation/interview_simul` 경로에서 진행.

## 4. Python 가상환경 및 백엔드 설정
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn cryptography
```

### `.env` 작성
```bash
DEBUG=False
SECRET_KEY=<django-secret-key>
ALLOWED_HOSTS=13.125.180.201,localhost
DB_NAME=interview_simul
DB_USER=interview_user
DB_PASSWORD=<mysql-password>
DB_HOST=localhost
DB_PORT=3306
OPENAI_API_KEY=
```

### MySQL 설정
```bash
sudo mysql
CREATE DATABASE interview_simul CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'interview_user'@'localhost' IDENTIFIED BY '<mysql-password>';
GRANT ALL PRIVILEGES ON interview_simul.* TO 'interview_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Django 명령
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
deactivate
```

## 5. 프론트엔드 빌드
```bash
cd /var/www/interview-simulation/interview_simul/frontend
source ~/.nvm/nvm.sh && nvm use 18
npm install
npm run build
```

## 6. Gunicorn systemd 서비스
```bash
sudo tee /etc/systemd/system/gunicorn.service > /dev/null <<'EOF'
[Unit]
Description=Gunicorn daemon for interview-simulation
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/interview-simulation/interview_simul/backend
ExecStart=/var/www/interview-simulation/interview_simul/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
```

## 7. Nginx 설정
```bash
sudo tee /etc/nginx/sites-available/interview-simulation > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/interview-simulation/interview_simul/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    location /static/ {
        root /var/www/interview-simulation/interview_simul/frontend/build;
        try_files $uri $uri/ /django-static$uri;
    }

    location /django-static/ {
        alias /var/www/interview-simulation/interview_simul/backend/staticfiles/;
    }

    location /media/ {
        alias /var/www/interview-simulation/interview_simul/backend/media/;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/interview-simulation /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 8. 방화벽(UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## 9. 서비스 확인
```bash
sudo systemctl status gunicorn
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u gunicorn -f
```

정상 기동이 확인된 뒤 브라우저에서 `http://13.125.180.201` 접속하여 프론트/백엔드 모두 정상 동작하는 것까지 확인했습니다.

---

추후 변경 사항이 생기면 이 문서에 계속 추가 예정입니다.

