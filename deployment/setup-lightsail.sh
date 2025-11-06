#!/bin/bash

# AWS Lightsail 서버 초기 설정 스크립트
# 이 스크립트는 서버에 처음 접속했을 때 한 번만 실행

set -e

echo "🚀 AWS Lightsail 서버 초기 설정을 시작합니다..."

# 시스템 업데이트
echo "📦 시스템 패키지 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
echo "📦 필수 패키지 설치 중..."
sudo apt install -y \
    python3.10 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    nginx \
    git \
    mysql-server \
    mysql-client \
    supervisor \
    certbot \
    python3-certbot-nginx

# Node.js 버전 관리 (nvm 설치)
echo "📦 Node.js 버전 관리 설정 중..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

# 프로젝트 디렉토리 생성
echo "📁 프로젝트 디렉토리 생성 중..."
sudo mkdir -p /var/www/interview-simulation
sudo chown -R $USER:$USER /var/www/interview-simulation

# Git 저장소 클론 (또는 추후 수동으로)
echo "📥 Git 저장소 준비 중..."
cd /var/www/interview-simulation
# git clone https://github.com/yourusername/interview-simulation.git .

# Python 가상환경 생성
echo "🐍 Python 가상환경 생성 중..."
cd /var/www/interview-simulation/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install gunicorn

# Nginx 설정
echo "🌐 Nginx 설정 중..."
sudo tee /etc/nginx/sites-available/interview-simulation > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # React 빌드 파일 서빙
    location / {
        root /var/www/interview-simulation/frontend/build;
        try_files \$uri \$uri/ /index.html;
    }

    # Django API 프록시
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # 정적 파일
    location /static/ {
        alias /var/www/interview-simulation/backend/staticfiles/;
    }

    # 미디어 파일
    location /media/ {
        alias /var/www/interview-simulation/backend/media/;
    }
}
EOF

# Nginx 활성화
sudo ln -sf /etc/nginx/sites-available/interview-simulation /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# Gunicorn systemd 서비스 생성
echo "🔧 Gunicorn 서비스 설정 중..."
sudo tee /etc/systemd/system/gunicorn.service > /dev/null <<EOF
[Unit]
Description=Gunicorn daemon for interview-simulation
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=/var/www/interview-simulation/backend
ExecStart=/var/www/interview-simulation/backend/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gunicorn

# MySQL 설정
echo "🐬 MySQL 설정 중..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS interview_simulation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'interview_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';"
sudo mysql -e "GRANT ALL PRIVILEGES ON interview_simulation.* TO 'interview_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 방화벽 설정 (필요시)
echo "🔥 방화벽 설정 중..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ 초기 설정이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. /var/www/interview-simulation/backend/.env 파일 생성 및 환경 변수 설정"
echo "2. Django settings.py에서 데이터베이스 설정 확인"
echo "3. python manage.py migrate 실행"
echo "4. python manage.py createsuperuser 실행"
echo "5. SSL 인증서 설치: sudo certbot --nginx -d yourdomain.com"
echo "6. GitHub Actions에 SSH 키 추가 (배포 자동화용)"

