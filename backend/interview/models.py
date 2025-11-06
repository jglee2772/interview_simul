"""
앱: interview (면접 시뮬레이션)
파일: models.py
역할: 데이터베이스 모델 작성
설명:
- 면접 시뮬레이션 관련 데이터베이스 모델을 정의합니다
- Django ORM을 사용하여 MySQL 테이블 구조를 정의합니다
- 모델 예시:
  - Interview: 면접 세션 정보
  - InterviewMessage: 면접 대화 메시지
  - InterviewResult: 면접 결과 분석
"""

from django.db import models
from django.contrib.auth.models import User

# 면접 세션 모델 작성
class Interview(models.Model):
    # 면접 세션 필드 정의
    pass

# 면접 메시지 모델 작성
class InterviewMessage(models.Model):
    # 면접 메시지 필드 정의
    pass

# 면접 결과 모델 작성
class InterviewResult(models.Model):
    # 면접 결과 필드 정의
    pass
