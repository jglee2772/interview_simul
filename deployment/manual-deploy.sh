#!/bin/bash

# 수동 배포 스크립트
# 서버에 SSH 접속 후 이 스크립트를 실행하면 배포됩니다
# 사용법: ./deployment/manual-deploy.sh

set -e

PROJECT_DIR="/var/www/interview-simulation"
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
npm install
npm run build
sudo systemctl reload nginx
echo "✅ 프론트엔드 배포 완료"

echo "🎉 배포가 완료되었습니다!"

