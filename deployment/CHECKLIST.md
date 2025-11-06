# 배포 체크리스트

## 사전 준비
- [ ] AWS 계정 생성
- [ ] GitHub 저장소 준비
- [ ] 도메인 준비 (선택사항)

## Lightsail 인스턴스 설정
- [ ] Lightsail 인스턴스 생성 (Ubuntu 22.04 LTS)
- [ ] 고정 IP 주소 할당
- [ ] SSH 키 다운로드

## 서버 초기 설정
- [ ] SSH 접속 성공
- [ ] `setup-lightsail.sh` 스크립트 실행
- [ ] 필수 패키지 설치 확인
- [ ] 프로젝트 디렉토리 생성 확인

## 데이터베이스 설정
- [ ] MySQL 설치 확인
- [ ] 데이터베이스 생성 (`interview_simulation`)
- [ ] 사용자 생성 및 권한 부여
- [ ] 데이터베이스 연결 테스트

## 백엔드 설정
- [ ] Python 가상환경 생성
- [ ] 패키지 설치 (`requirements.txt`)
- [ ] `.env` 파일 생성 및 설정
- [ ] Django 마이그레이션 실행
- [ ] 관리자 계정 생성
- [ ] 정적 파일 수집 (`collectstatic`)
- [ ] Gunicorn 서비스 시작

## 프론트엔드 설정
- [ ] Node.js 설치 확인
- [ ] 패키지 설치 (`npm install`)
- [ ] React 앱 빌드 (`npm run build`)
- [ ] 빌드 파일 확인

## 웹 서버 설정
- [ ] Nginx 설치 확인
- [ ] Nginx 설정 파일 생성
- [ ] Nginx 서비스 시작
- [ ] 웹사이트 접속 확인

## 자동 배포 설정 (선택사항)
- [ ] 서버에서 SSH 키 생성
- [ ] GitHub Secrets 설정
- [ ] GitHub Actions 워크플로우 테스트

## 도메인 및 SSL (선택사항)
- [ ] DNS 설정 (A 레코드)
- [ ] SSL 인증서 설치 (Let's Encrypt)
- [ ] HTTPS 접속 확인

## 최종 확인
- [ ] 웹사이트 접속 확인
- [ ] API 엔드포인트 확인
- [ ] Admin 페이지 접속 확인
- [ ] 기능 테스트 (면접 시뮬레이션, 인적성검사, 이력서)

## 보안 확인
- [ ] `.env` 파일이 Git에 포함되지 않았는지 확인
- [ ] `DEBUG=False` 설정 확인
- [ ] 강력한 `SECRET_KEY` 사용 확인
- [ ] 방화벽 설정 확인

