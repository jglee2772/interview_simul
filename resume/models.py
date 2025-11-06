"""
앱: resume (이력서)
파일: models.py
역할: 데이터베이스 모델 작성
설명:
- 이력서 관련 데이터베이스 모델을 정의합니다
- Django ORM을 사용하여 MySQL 테이블 구조를 정의합니다
- 모델 예시:
  - Resume: 이력서 정보
  - Education: 학력 정보
  - Experience: 경력 정보
  - Certificate: 자격증 정보
"""

from django.db import models
from django.contrib.auth.models import User

# 이력서 모델 작성
class Resume(models.Model):
    # 이력서 필드 정의 (개인정보, 자기소개서 등)
    pass

# 학력 모델 작성
class Education(models.Model):
    # 학력 필드 정의
    pass

# 경력 모델 작성
class Experience(models.Model):
    # 경력 필드 정의
    pass

# 자격증 모델 작성
class Certificate(models.Model):
    # 자격증 필드 정의
    pass

