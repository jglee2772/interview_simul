"""
앱: homepage (홈페이지)
파일: urls.py
역할: 후원 API URL 라우팅
"""

from django.urls import path
from .views import PaymentRequestView, PaymentConfirmView

urlpatterns = [
    path('payment/request/', PaymentRequestView.as_view(), name='payment-request'),
    path('payment/confirm/', PaymentConfirmView.as_view(), name='payment-confirm'),
]

