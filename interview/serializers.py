"""
앱: interview (면접 시뮬레이션)
파일: serializers.py
역할: API 시리얼라이저 작성
설명:
- Django REST Framework의 Serializer를 작성합니다
- 모델 데이터를 JSON으로 변환하고, JSON을 모델 데이터로 변환합니다
- API 요청/응답 데이터의 검증과 변환을 처리합니다
"""

from rest_framework import serializers
from .models import Interview, InterviewMessage, InterviewResult

# 면접 시리얼라이저 작성
class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = '__all__'

# 면접 메시지 시리얼라이저 작성
class InterviewMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewMessage
        fields = '__all__'

# 면접 결과 시리얼라이저 작성
class InterviewResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewResult
        fields = '__all__'
