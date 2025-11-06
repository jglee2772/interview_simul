# AWS Lightsail 배포 가이드

## 📚 배포 가이드 문서

### 🚀 빠른 시작
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - 빠른 배포 가이드 (5분 안에 배포)

### 📖 상세 가이드
- **[AWS_LIGHTSAIL_DEPLOYMENT.md](./AWS_LIGHTSAIL_DEPLOYMENT.md)** - 완전한 배포 가이드 (단계별 상세 설명)

## 배포 방법 선택

### 방법 1: GitHub Actions 자동 배포 (권장) ⭐

Git push만으로 자동 배포됩니다.

**설정 방법:**
1. 서버 초기 설정 (한 번만)
2. GitHub Secrets 설정
3. 자동 배포 완료!

자세한 내용: [AWS_LIGHTSAIL_DEPLOYMENT.md](./AWS_LIGHTSAIL_DEPLOYMENT.md)의 "6. 자동 배포 설정" 참조

### 방법 2: 수동 배포

서버에 SSH 접속 후 배포 스크립트 실행:

```bash
cd /var/www/interview-simulation
./deployment/manual-deploy.sh
```

## 주요 파일

- `setup-lightsail.sh` - 서버 초기 설정 스크립트
- `manual-deploy.sh` - 수동 배포 스크립트
- `AWS_LIGHTSAIL_DEPLOYMENT.md` - 완전한 배포 가이드
- `QUICK_DEPLOY.md` - 빠른 배포 가이드

## 빠른 참조

### 서비스 관리
```bash
# 서비스 상태 확인
sudo systemctl status gunicorn nginx mysql

# 서비스 재시작
sudo systemctl restart gunicorn nginx
```

### 로그 확인
```bash
# Gunicorn 로그
sudo journalctl -u gunicorn -f

# Nginx 로그
sudo tail -f /var/log/nginx/error.log
```

자세한 내용은 **AWS_LIGHTSAIL_DEPLOYMENT.md** 파일을 참조하세요!
