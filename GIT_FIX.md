# Git 저장소 문제 해결

## 현재 상황
- backend 폴더에 git 저장소가 있음
- 전체 프로젝트를 올리려고 했지만 backend만 올라감

## 해결 방법: 프로젝트 루트에 git 저장소 설정

### 1단계: backend의 원격 저장소 URL 확인

```cmd
cd "C:\Users\admin\Desktop\interview simulation web\backend"
git remote -v
```

원격 저장소 URL을 복사해두세요.

### 2단계: 프로젝트 루트에서 git 초기화

```cmd
cd "C:\Users\admin\Desktop\interview simulation web"
git init
```

### 3단계: 모든 파일 추가

```cmd
git add .
```

### 4단계: 첫 커밋

```cmd
git commit -m "Initial commit: 전체 프로젝트 구조"
```

### 5단계: 원격 저장소 연결

```cmd
git remote add origin <원격저장소URL>
```

또는 기존 저장소가 있다면:
```cmd
git remote set-url origin <원격저장소URL>
```

### 6단계: 푸시

```cmd
git branch -M main
git push -u origin main
```

## 또는: backend의 git을 루트로 이동

### 방법 1: .git 폴더 이동

```cmd
cd "C:\Users\admin\Desktop\interview simulation web"
move backend\.git .
git add .
git commit -m "프로젝트 전체 구조 추가"
git push
```

### 방법 2: 기존 커밋 유지하면서 루트로 이동

```cmd
cd "C:\Users\admin\Desktop\interview simulation web"

REM backend의 git 히스토리 가져오기
git init
git remote add origin <원격저장소URL>
git fetch origin
git checkout -b main origin/main

REM backend 내용을 루트로 이동
git mv backend/* .
git mv backend/.* . 2>nul
rmdir backend

REM frontend 등 추가 파일 커밋
git add .
git commit -m "프로젝트 구조를 루트로 이동"
git push
```

## 빠른 해결 방법 (권장)

```cmd
REM 1. 프로젝트 루트로 이동
cd "C:\Users\admin\Desktop\interview simulation web"

REM 2. git 초기화
git init

REM 3. 모든 파일 추가
git add .

REM 4. 커밋
git commit -m "Initial commit: 전체 프로젝트"

REM 5. 원격 저장소 연결 (기존 URL 사용)
git remote add origin <원격저장소URL>

REM 6. 푸시
git push -u origin main
```

## 확인

```cmd
git status
git ls-files
```

frontend, backend, deployment 폴더의 파일들이 모두 보여야 합니다.

