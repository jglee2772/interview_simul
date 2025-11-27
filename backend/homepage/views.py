"""
앱: homepage (홈페이지)
파일: views.py
역할: 후원 API 뷰
"""

import os
import uuid
import base64
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Donation
from .serializers import DonationSerializer

# 토스페이먼츠 API 설정
# API 개별 연동 키 사용 (sk) - 사업자 등록 없이 사용 가능
TOSS_SECRET_KEY = os.getenv('TOSS_SECRET_KEY', '')
TOSS_API_URL = 'https://api.tosspayments.com/v1'  # 실서비스
# TOSS_API_URL = 'https://sandbox-api.tosspayments.com/v1'  # 테스트 모드 (사용 안 함)

def get_toss_auth_header():
    """
    토스페이먼츠 인증 헤더 생성 (Base64 인코딩)
    
    토스페이먼츠 공식 문서:
    - 401 INCORRECT_BASIC_AUTH_FORMAT: ":를 포함해 인코딩해주세요"
    - 시크릿 키는 반드시 "키:" 형식으로 Base64 인코딩해야 함
    
    시크릿 키 형식:
    - API 개별: test_sk_xxx (콜론 없이 단일 문자열이지만, 인코딩 시 "키:" 형식 사용)
    - 결제위젯: test_gsk_xxx:xxx (이미 콜론 포함)
    """
    if not TOSS_SECRET_KEY:
        return None
    
    # 시크릿 키 정리
    secret_key = TOSS_SECRET_KEY.strip()
    
    # 토스페이먼츠 API는 시크릿 키를 "키:" 형식으로 Base64 인코딩해야 함
    # 공식 문서: "401 INCORRECT_BASIC_AUTH_FORMAT: :를 포함해 인코딩해주세요"
    # 콜론이 없으면 추가, 있으면 그대로 사용
    if ':' not in secret_key:
        secret_key_with_colon = f'{secret_key}:'
    else:
        secret_key_with_colon = secret_key
    
    # Base64 인코딩하여 Basic 인증 헤더 생성
    encoded = base64.b64encode(secret_key_with_colon.encode('utf-8')).decode('utf-8')
    return f'Basic {encoded}'


class PaymentRequestView(APIView):
    """
    POST /api/homepage/payment/request/
    - 토스페이먼츠 결제 요청 (결제 키 발급)
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        amount = request.data.get('amount')
        donor_name = request.data.get('donor_name', '')
        message = request.data.get('message', '')
        
        # 금액 검증
        if not amount:
            return Response(
                {"error": "후원 금액을 선택해주세요."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = int(amount)
            if amount not in [1000, 2000, 3000, 4000, 5000]:
                return Response(
                    {"error": "올바른 후원 금액을 선택해주세요."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "올바른 금액 형식이 아닙니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 주문 ID 생성
        order_id = f"donation_{uuid.uuid4().hex[:16]}"
        
        # 후원 기록 생성 (결제 대기 상태)
        try:
            donation = Donation.objects.create(
                amount=amount,
                donor_name=donor_name if donor_name else None,
                message=message if message else None,
                order_id=order_id,
                payment_status='PENDING'
            )
            
            # 토스페이먼츠 결제창을 띄우기 위한 정보 반환
            # 실제 결제는 결제창에서 진행되며, paymentKey는 결제창에서 발급됨
            return Response(
                {
                    "orderId": order_id,
                    "amount": amount,
                    "donation_id": donation.id,
                    "orderName": f'사이트 후원 - {amount}원',
                    "customerName": donor_name or '익명',
                    "successUrl": f'{request.build_absolute_uri("/")}?payment=success&orderId={order_id}',
                    "failUrl": f'{request.build_absolute_uri("/")}?payment=fail&orderId={order_id}',
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"후원 처리 중 오류가 발생했습니다: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentConfirmView(APIView):
    """
    POST /api/homepage/payment/confirm/
    - 토스페이먼츠 결제 승인 (결제 검증 및 완료 처리)
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        # 프론트엔드에서 카멜케이스로 보내므로 그대로 받음
        payment_key = request.data.get('paymentKey') or request.data.get('payment_key')
        order_id = request.data.get('orderId') or request.data.get('order_id')
        amount = request.data.get('amount')
        
        if not payment_key or not order_id or not amount:
            return Response(
                {"error": "필수 정보가 누락되었습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = int(amount)
        except (ValueError, TypeError):
            return Response(
                {"error": "올바른 금액 형식이 아닙니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 주문 조회
        try:
            donation = Donation.objects.get(order_id=order_id)
        except Donation.DoesNotExist:
            return Response(
                {"error": "주문을 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 금액 검증
        if donation.amount != amount:
            return Response(
                {"error": "결제 금액이 일치하지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 토스페이먼츠 결제 승인
        # TOSS_SECRET_KEY가 없으면 테스트 모드로 처리
        # 디버깅: 환경 변수 확인 (프로덕션에서는 제거)
        if not TOSS_SECRET_KEY or not TOSS_SECRET_KEY.strip():
            donation.payment_status = 'FAILED'
            donation.save()
            return Response(
                {"error": "토스페이먼츠 시크릿 키가 설정되지 않았습니다. 서버 환경 변수를 확인해주세요."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if TOSS_SECRET_KEY and TOSS_SECRET_KEY.strip():
            try:
                auth_header = get_toss_auth_header()
            except ValueError as e:
                donation.payment_status = 'FAILED'
                donation.save()
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not auth_header:
                donation.payment_status = 'FAILED'
                donation.save()
                return Response(
                    {"error": "토스페이먼츠 인증 정보가 설정되지 않았습니다."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            try:
                # 멱등키 생성 (UUID 사용)
                idempotency_key = str(uuid.uuid4())
                
                # 디버깅: 요청 정보 로깅 (민감 정보 제외)
                print(f"[TOSS API 요청] URL: {TOSS_API_URL}/payments/confirm")
                print(f"[TOSS API 요청] orderId: {order_id}, amount: {amount}")
                print(f"[TOSS API 요청] Authorization 헤더 존재: {bool(auth_header)}")
                
                # 토스페이먼츠 API 호출
                response = requests.post(
                    f'{TOSS_API_URL}/payments/confirm',
                    json={
                        'paymentKey': payment_key,
                        'orderId': order_id,
                        'amount': amount,
                    },
                    headers={
                        'Authorization': auth_header,
                        'Content-Type': 'application/json',
                        'Idempotency-Key': idempotency_key
                    },
                    timeout=30
                )
                
                # 디버깅: 응답 상태 로깅
                print(f"[TOSS API 응답] HTTP {response.status_code}")
                
                # 응답 상태 확인
                if response.status_code == 200:
                    payment_data = response.json()
                    
                    # 결제 상태 확인
                    if payment_data.get('status') == 'DONE':
                        # 후원 기록 업데이트
                        donation.payment_key = payment_key
                        donation.payment_status = 'DONE'
                        donation.payment_method = payment_data.get('method', '카드')
                        donation.save()
                        
                        serializer = DonationSerializer(donation)
                        return Response(
                            {
                                "message": "후원해주셔서 감사합니다!",
                                "donation": serializer.data
                            },
                            status=status.HTTP_200_OK
                        )
                    else:
                        donation.payment_status = 'FAILED'
                        donation.save()
                        return Response(
                            {"error": "결제 승인 실패"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                else:
                    # HTTP 오류 응답 처리
                    try:
                        error_data = response.json()
                        error_message = error_data.get('message', f'결제 승인 API 오류 (HTTP {response.status_code})')
                        error_code = error_data.get('code', '')
                        # 디버깅을 위해 상세 오류 정보 포함
                        full_error = f"{error_message}"
                        if error_code:
                            full_error += f" (코드: {error_code})"
                        # 응답 본문 전체를 로깅 (디버깅용)
                        print(f"[TOSS API 오류] HTTP {response.status_code}: {error_data}")
                    except Exception as e:
                        error_message = f'결제 승인 API 오류 (HTTP {response.status_code})'
                        full_error = f"{error_message} - 응답 파싱 실패: {str(e)}"
                        print(f"[TOSS API 오류] HTTP {response.status_code}: {response.text}")
                    
                    donation.payment_status = 'FAILED'
                    donation.save()
                    return Response(
                        {"error": full_error if 'full_error' in locals() else error_message},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except requests.exceptions.RequestException as e:
                donation.payment_status = 'FAILED'
                donation.save()
                return Response(
                    {"error": f"결제 승인 중 오류가 발생했습니다: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                donation.payment_status = 'FAILED'
                donation.save()
                return Response(
                    {"error": f"결제 승인 중 예기치 않은 오류: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # 테스트 모드: 결제 승인 없이 완료 처리
            donation.payment_key = payment_key
            donation.payment_status = 'DONE'
            donation.payment_method = 'TEST'
            donation.save()
            
            serializer = DonationSerializer(donation)
            return Response(
                {
                    "message": "후원해주셔서 감사합니다! (테스트 모드)",
                    "donation": serializer.data
                },
                status=status.HTTP_200_OK
            )

