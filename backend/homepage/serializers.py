"""
앱: homepage (홈페이지)
파일: serializers.py
역할: 후원 API 직렬화
"""

from rest_framework import serializers
from .models import Donation


class DonationSerializer(serializers.ModelSerializer):
    """
    후원 직렬화
    """
    class Meta:
        model = Donation
        fields = [
            'id', 'amount', 'donor_name', 'message', 
            'payment_key', 'order_id', 'payment_status', 'payment_method',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'payment_key', 'payment_status', 'created_at', 'updated_at']

