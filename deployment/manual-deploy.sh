#!/bin/bash

# 수동 배포 스크립트
# 서버에 SSH 접속 후 이 스크립트를 실행하면 배포됩니다
# 사용법: ./deployment/manual-deploy.sh

set -e

PROJECT_DIR="/var/www/interview-simulation/interview_simul"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 배포를 시작합니다..."

# 백엔드 배포
echo "📦 백엔드 배포 중..."
cd $BACKEND_DIR
source venv/bin/activate
git pull --no-rebase --no-edit origin main
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn
echo "✅ 백엔드 배포 완료"

# 프론트엔드 빌드 및 배포
echo "📦 프론트엔드 배포 중..."
cd $FRONTEND_DIR
git pull --no-rebase --no-edit origin main

# Node.js 버전 설정 (nvm 사용)
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 18
fi

npm install

# 스왑 메모리 확인 및 추가 (없는 경우)
if [ ! -f /swapfile ]; then
    echo "💾 스왑 메모리 추가 중..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 메모리 옵션과 함께 빌드 (메모리 부족 방지)
echo "🔨 React 앱 빌드 중..."
NODE_OPTIONS="--max-old-space-size=2048" npm run build
sudo systemctl reload nginx
echo "✅ 프론트엔드 배포 완료"

echo "🎉 배포가 완료되었습니다!"

