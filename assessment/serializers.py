"""
앱: assessment (인적성검사)
파일: serializers.py
역할: API 시리얼라이저 작성
설명:
- Django REST Framework의 Serializer를 작성합니다
- 모델 데이터를 JSON으로 변환하고, JSON을 모델 데이터로 변환합니다
- API 요청/응답 데이터의 검증과 변환을 처리합니다
"""

from rest_framework import serializers
from .models import Assessment, AssessmentQuestion, AssessmentAnswer, AssessmentResult

# 인적성검사 시리얼라이저 작성
class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'

# 질문 시리얼라이저 작성
class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = '__all__'

# 결과 시리얼라이저 작성
class AssessmentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentResult
        fields = '__all__'
