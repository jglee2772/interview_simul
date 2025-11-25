# Homepage 앱 - 토스페이먼츠 결제 연동

## 🔑 키 종류 및 사용법

⚠️ **중요**: 결제위젯 연동 키는 **사업자 등록이 필수**입니다.

이 프로젝트는 **API 개별 연동 키**를 사용합니다 (사업자 등록 없이 사용 가능).

### 키 종류
- **API 개별 연동 키**: 결제창 SDK용 (ck, sk) ✅ **사용 중**
  - 클라이언트 키: `test_ck_xxx` 또는 `live_ck_xxx`
  - 시크릿 키: `test_sk_xxx:xxx` 또는 `live_sk_xxx:xxx`
  
- ~~**결제위젯 연동 키**: 결제위젯 SDK용 (gck, gsk) - 사업자 등록 필수~~
  - ~~클라이언트 키: `test_gck_xxx` 또는 `live_gck_xxx`~~
  - ~~시크릿 키: `test_gsk_xxx:xxx` 또는 `live_gsk_xxx:xxx`~~

### ⚠️ 중요 사항
1. **테스트 키는 `test`로 시작**: 테스트 환경에서는 실제 결제 정보를 사용해도 가상 결제로 처리됩니다.
2. **키는 세트로 사용**: 클라이언트 키와 시크릿 키는 같은 세트(테스트/라이브)를 사용해야 합니다.
3. **시크릿 키는 외부 노출 금지**: GitHub, 클라이언트 코드에 절대 추가하지 마세요.

## 환경 변수 설정

### 백엔드 (`.env`)

```env
# 토스페이먼츠 API 개별 연동 시크릿 키 (사업자 등록 없이 사용 가능)
# 테스트: test_sk_xxx:xxx 형태
# 실서비스: live_sk_xxx:xxx 형태 (사업자 등록 필요)
TOSS_SECRET_KEY=test_sk_xxx:xxx
```

### 프론트엔드 (`.env` 또는 빌드 시)

```env
# 토스페이먼츠 API 개별 연동 클라이언트 키 (사업자 등록 없이 사용 가능)
# 테스트: test_ck_xxx
# 실서비스: live_ck_xxx (사업자 등록 필요)
REACT_APP_TOSS_CLIENT_KEY=test_ck_26DIbXAaV0webj9q6nxd3qY50Q9R
```

## 토스페이먼츠 API 키 발급

### 테스트 모드 (사업자 등록 불필요) ✅

테스트 모드는 **사업자 등록 없이** 사용할 수 있습니다.

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) 접속
2. 회원가입 및 로그인 (개인 계정으로 가능)
3. **API 개별 연동 키** 사용 (이미 발급되어 있음)
   - API 키 관리 페이지에서 "API 개별 연동 키" 섹션 확인
   - 클라이언트 키: `test_ck_xxx` (프론트엔드용) - 이미 발급됨
   - 시크릿 키: `test_sk_xxx:xxx` (백엔드용) - "보기" 버튼 클릭하여 확인
4. 환경 변수에 각각 설정

⚠️ **주의**: 
- 결제위젯 연동 키는 사업자 등록이 필요하므로 사용하지 않습니다.
- API 개별 연동 키를 사용합니다 (이미 발급되어 있음).

### 라이브 모드 (사업자 등록 필수)

실서비스 환경에서는 **사업자 등록이 필수**입니다.
- 사업자등록증 제출 필요
- 계약서 작성 및 승인 절차 필요
- 라이브 키 발급 후 실제 결제 가능

### 현재 상태 확인

이미지에서 보이는 것처럼:
- **결제위젯 연동 키**: 아직 발급되지 않음 → "이용 신청하기" 클릭 필요
- **API 개별 연동 키**: 이미 발급됨 (`test_ck_xxx`, `test_sk_xxx`)

⚠️ **주의**: 결제위젯 SDK를 사용하므로 **결제위젯 연동 키**를 사용해야 합니다.
API 개별 연동 키(`ck`, `sk`)는 사용하지 마세요.

## API 엔드포인트

### 1. 결제 요청
```
POST /api/homepage/payment/request/
```

**요청 본문:**
```json
{
  "amount": 1000,
  "donor_name": "홍길동",
  "message": "응원 메시지"
}
```

**응답:**
```json
{
  "paymentKey": "tgen_xxx",
  "orderId": "donation_xxx",
  "amount": 1000,
  "donation_id": 1
}
```

### 2. 결제 승인
```
POST /api/homepage/payment/confirm/
```

**요청 본문:**
```json
{
  "paymentKey": "tgen_xxx",
  "orderId": "donation_xxx",
  "amount": 1000
}
```

**응답:**
```json
{
  "message": "후원해주셔서 감사합니다!",
  "donation": {
    "id": 1,
    "amount": 1000,
    "payment_status": "DONE",
    ...
  }
}
```

## 마이그레이션

모델이 변경되었으므로 마이그레이션을 실행하세요:

```bash
cd backend
source venv/bin/activate
python manage.py makemigrations homepage
python manage.py migrate
```

## 테스트 모드

### 토스페이먼츠 테스트 키 사용
- **사업자 등록 없이** 테스트 키(`test_`로 시작)를 사용할 수 있습니다.
- 테스트 키를 사용하면 실제 결제 없이 가상 결제로 처리됩니다.
- 카드 번호, 휴대폰 번호 등 실제 정보를 사용해도 금액이 차감되지 않습니다.
- 테스트용 카드 번호: `4242-4242-4242-4242` (유효기간, CVC는 임의 입력 가능)

### 키 미설정 시
`TOSS_SECRET_KEY`가 설정되지 않은 경우:
- 실제 결제 없이 DB에 저장
- 결제 상태는 'DONE'으로 설정
- 결제 수단은 'TEST'로 저장

## 🔒 보안 주의사항

1. **시크릿 키는 절대 외부 노출 금지**
   - GitHub에 커밋하지 마세요
   - 클라이언트 코드에 포함하지 마세요
   - `.env` 파일은 `.gitignore`에 추가되어 있어야 합니다

2. **키 검증**
   - 클라이언트 키와 시크릿 키는 같은 세트(테스트/라이브)를 사용해야 합니다
   - 다른 세트를 섞어 사용하면 `INVALID_API_KEY` 오류가 발생합니다

## 결제 플로우

1. 사용자가 후원 금액 선택
2. "후원하기" 클릭 → 주문 정보 생성 (`/api/homepage/payment/request/`)
3. 토스페이먼츠 결제위젯 팝업 표시
4. 결제 진행 (카드 등)
5. 결제 성공 → `successUrl`로 리다이렉트 (paymentKey 포함)
6. 백엔드에서 결제 승인 처리 (`/api/homepage/payment/confirm/`)
7. 후원 완료 메시지 표시

