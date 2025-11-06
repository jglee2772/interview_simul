# Git 저장소 설정 가이드

## 문제: backend만 깃에 올라간 경우

현재 상황을 확인하고 전체 프로젝트를 깃에 올리는 방법입니다.

## 해결 방법

### 방법 1: 프로젝트 루트에 git 저장소 초기화 (권장)

1. **프로젝트 루트로 이동**
   ```cmd
   cd "C:\Users\admin\Desktop\interview simulation web"
   ```

2. **git 저장소 초기화**
   ```cmd
   git init
   ```

3. **모든 파일 추가**
   ```cmd
   git add .
   ```

4. **첫 커밋**
   ```cmd
   git commit -m "Initial commit: 프로젝트 초기 설정"
   ```

5. **원격 저장소 연결 (GitHub 등)**
   ```cmd
   git remote add origin <your-repository-url>
   ```

6. **푸시**
   ```cmd
   git push -u origin main
   ```

### 방법 2: backend의 git 저장소를 루트로 이동

만약 backend 폴더에 git 저장소가 있다면:

1. **backend 폴더의 .git 폴더 확인**
   ```cmd
   cd "C:\Users\admin\Desktop\interview simulation web\backend"
   dir .git
   ```

2. **.git 폴더를 프로젝트 루트로 이동**
   ```cmd
   cd "C:\Users\admin\Desktop\interview simulation web"
   move backend\.git .
   ```

3. **전체 프로젝트 추가**
   ```cmd
   git add .
   git commit -m "프로젝트 전체 구조 추가"
   ```

## .gitignore 확인

프로젝트 루트의 `.gitignore` 파일이 올바르게 설정되어 있는지 확인하세요:

- `node_modules/` - 제외됨 ✅
- `venv/` - 제외됨 ✅
- `.env` - 제외됨 ✅
- `__pycache__/` - 제외됨 ✅

## Git에 올릴 파일 목록

다음 파일들이 Git에 포함되어야 합니다:

### 루트 파일
- `README.md`
- `SETUP.md`
- `PROJECT_GUIDE.md`
- `PROJECT_TREE.txt`
- `.gitignore`

### Frontend
- `frontend/package.json`
- `frontend/public/`
- `frontend/src/`
- `node_modules/`는 제외 (자동으로 제외됨)

### Backend
- `backend/manage.py`
- `backend/requirements.txt`
- `backend/config/`
- `backend/interview/`
- `backend/assessment/`
- `backend/resume/`
- `backend/accounts/`
- `venv/`는 제외 (자동으로 제외됨)
- `.env`는 제외 (자동으로 제외됨)

### Deployment
- `deployment/`
- `.github/workflows/`

## 확인 명령어

```cmd
# 현재 상태 확인
git status

# 추가된 파일 확인
git ls-files

# 원격 저장소 확인
git remote -v
```

## 문제 해결

### frontend가 추가되지 않는 경우

```cmd
# 강제로 추가
git add frontend/ -f

# 또는 특정 파일만 추가
git add frontend/package.json
git add frontend/src/
git add frontend/public/
```

### node_modules가 포함되는 경우

`.gitignore` 파일에 다음이 있는지 확인:
```
node_modules/
```

### .env 파일이 포함되는 경우

`.gitignore` 파일에 다음이 있는지 확인:
```
.env
```

## 완료 확인

```cmd
git status
```

출력에서 다음이 보여야 합니다:
- `frontend/src/` 파일들
- `backend/` 파일들
- `deployment/` 파일들
- `README.md`, `SETUP.md` 등

