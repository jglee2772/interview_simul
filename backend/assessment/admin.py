"""
앱: assessment (인적성검사)
파일: admin.py
역할: Django Admin 설정
설명:
- Django Admin에서 인적성검사 관련 모델을 관리할 수 있도록 설정합니다
- 관리자 페이지에서 검사 세션, 질문, 답변, 결과를 조회하고 관리할 수 있습니다
"""

from django.contrib import admin
from .models import Assessment, AssessmentQuestion, AssessmentAnswer, AssessmentResult

# Django Admin 설정 작성
# @admin.register(Assessment)
# class AssessmentAdmin(admin.ModelAdmin):
#     pass
