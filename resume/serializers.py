"""
앱: resume (이력서)
파일: serializers.py
역할: API 시리얼라이저 작성
설명:
- Django REST Framework의 Serializer를 작성합니다
- 모델 데이터를 JSON으로 변환하고, JSON을 모델 데이터로 변환합니다
- API 요청/응답 데이터의 검증과 변환을 처리합니다
"""

from rest_framework import serializers
from .models import Resume, Education, Experience, Certificate

# 이력서 시리얼라이저 작성
class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = '__all__'

# 학력 시리얼라이저 작성
class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'

# 경력 시리얼라이저 작성
class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'

# 자격증 시리얼라이저 작성
class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = '__all__'

