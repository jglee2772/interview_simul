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
    
    시크릿 키 형식:
    - API 개별: test_sk_xxx:xxx 또는 live_sk_xxx:xxx (사용 중)
    - 결제위젯: test_gsk_xxx:xxx 또는 live_gsk_xxx:xxx (사업자 등록 필요)
    
    시크릿 키는 항상 "키:비밀번호" 형태로 제공되므로 Base64 인코딩 필요
    """
    if not TOSS_SECRET_KEY:
        return None
    
    # 시크릿 키는 "키:비밀번호" 형태로 제공됨
    # Base64 인코딩하여 Basic 인증 헤더 생성
    encoded = base64.b64encode(TOSS_SECRET_KEY.encode()).decode()
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
        payment_key = request.data.get('paymentKey')
        order_id = request.data.get('orderId')
        amount = request.data.get('amount')
        
        if not payment_key or not order_id or not amount:
            return Response(
                {"error": "필수 정보가 누락되었습니다."},
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
        if donation.amount != int(amount):
            return Response(
                {"error": "결제 금액이 일치하지 않습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # amount가 없으면 DB에서 조회
        if not amount:
            amount = donation.amount
        
        # 토스페이먼츠 결제 승인
        if TOSS_SECRET_KEY:
            try:
                response = requests.post(
                    f'{TOSS_API_URL}/payments/{payment_key}/confirm',
                    json={
                        'amount': int(amount),
                        'orderId': order_id,
                    },
                    headers={
                        'Authorization': get_toss_auth_header(),
                        'Content-Type': 'application/json'
                    }
                )
                
                if response.status_code == 200:
                    payment_data = response.json()
                    
                    # 후원 기록 업데이트
                    donation.payment_key = payment_key
                    donation.payment_status = 'DONE'
                    donation.payment_method = payment_data.get('method', '')
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
                        {"error": "결제 승인 실패", "details": response.text},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                donation.payment_status = 'FAILED'
                donation.save()
                return Response(
                    {"error": f"결제 승인 중 오류: {str(e)}"},
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

