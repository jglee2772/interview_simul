# 빠른 배포 가이드

## 1단계: Lightsail 인스턴스 생성
- AWS Lightsail → Create instance
- Ubuntu 22.04 LTS 선택
- $10/월 플랜 권장 (2GB RAM)
- 고정 IP 할당

## 2단계: 서버 초기 설정

```bash
# SSH 접속
ssh -i lightsail-key.pem ubuntu@your-lightsail-ip

# 프로젝트 클론
sudo mkdir -p /var/www/interview-simulation
sudo chown -R $USER:$USER /var/www/interview-simulation
cd /var/www/interview-simulation
git clone https://github.com/jglee2772/interview_simul.git .

# 초기 설정 실행
chmod +x deployment/setup-lightsail.sh
./deployment/setup-lightsail.sh
```

## 3단계: 환경 변수 설정

```bash
# 백엔드 .env 파일 생성
cd /var/www/interview-simulation/backend
nano .env
```

`.env` 파일 내용:
```env
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=your-domain.com,your-lightsail-ip
DB_NAME=interview_simulation
DB_USER=interview_user
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
OPENAI_API_KEY=your-openai-api-key
```

## 4단계: 데이터베이스 및 마이그레이션

```bash
cd /var/www/interview-simulation/backend
source venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

## 5단계: 프론트엔드 빌드

```bash
cd /var/www/interview-simulation/frontend
npm install
npm run build
```

## 6단계: 서비스 시작

```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl restart nginx
```

## 완료!

웹사이트 접속: `http://your-lightsail-ip`

자세한 내용은 `AWS_LIGHTSAIL_DEPLOYMENT.md` 참조

