#!/bin/bash

# Gunicorn 서비스 환경 변수 설정 수정 스크립트
# AWS 배포 환경에서 TOSS_SECRET_KEY 등 환경 변수가 로드되지 않는 문제 해결

set -e

echo "🔧 Gunicorn 서비스 환경 변수 설정을 수정합니다..."

# 실제 프로젝트 경로 확인
if [ -d "/var/www/interview-simulation/interview_simul/backend" ]; then
    PROJECT_DIR="/var/www/interview-simulation/interview_simul"
    BACKEND_DIR="$PROJECT_DIR/backend"
    echo "✅ 프로젝트 경로 확인: $BACKEND_DIR"
elif [ -d "/var/www/interview-simulation/backend" ]; then
    PROJECT_DIR="/var/www/interview-simulation"
    BACKEND_DIR="$PROJECT_DIR/backend"
    echo "✅ 프로젝트 경로 확인: $BACKEND_DIR"
else
    echo "❌ 프로젝트 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# .env 파일 확인
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "⚠️  .env 파일이 없습니다: $BACKEND_DIR/.env"
    echo "   .env 파일을 생성하고 TOSS_SECRET_KEY를 설정해주세요."
    exit 1
fi

echo "✅ .env 파일 확인: $BACKEND_DIR/.env"

# Gunicorn 서비스 파일 수정
echo "📝 Gunicorn 서비스 파일 수정 중..."
sudo tee /etc/systemd/system/gunicorn.service > /dev/null <<EOF
[Unit]
Description=Gunicorn daemon for interview-simulation
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$BACKEND_DIR
# .env 파일에서 환경 변수 로드 (절대 경로 사용)
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/venv/bin/gunicorn \
    --workers 3 \
    --bind 127.0.0.1:8000 \
    config.wsgi:application
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# systemd 데몬 리로드
echo "🔄 systemd 데몬 리로드 중..."
sudo systemctl daemon-reload

echo "✅ Gunicorn 서비스 파일이 수정되었습니다."
echo ""
echo "다음 단계:"
echo "1. $BACKEND_DIR/.env 파일에 TOSS_SECRET_KEY가 설정되어 있는지 확인"
echo "2. sudo systemctl restart gunicorn 실행"
echo "3. sudo systemctl status gunicorn 으로 상태 확인"
echo ""
echo ".env 파일 확인:"
echo "  cat $BACKEND_DIR/.env | grep TOSS_SECRET_KEY"

