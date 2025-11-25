"""
앱: homepage (홈페이지)
파일: models.py
역할: 후원 모델 정의
"""

from django.db import models


class Donation(models.Model):
    """
    후원 모델
    """
    amount = models.IntegerField(verbose_name='후원 금액')
    donor_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='후원자 이름')
    message = models.TextField(blank=True, null=True, verbose_name='응원 메시지')
    
    # 토스페이먼츠 결제 정보
    payment_key = models.CharField(max_length=200, blank=True, null=True, verbose_name='결제 키')
    order_id = models.CharField(max_length=200, unique=True, verbose_name='주문 ID')
    payment_status = models.CharField(
        max_length=20, 
        default='PENDING',
        choices=[
            ('PENDING', '대기중'),
            ('DONE', '완료'),
            ('CANCELED', '취소'),
            ('FAILED', '실패'),
        ],
        verbose_name='결제 상태'
    )
    payment_method = models.CharField(max_length=50, blank=True, null=True, verbose_name='결제 수단')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='후원 일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정 일시')
    
    class Meta:
        verbose_name = '후원'
        verbose_name_plural = '후원'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.amount}원 - {self.donor_name or "익명"} ({self.created_at.strftime("%Y-%m-%d")})'

