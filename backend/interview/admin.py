"""
앱: interview (면접 시뮬레이션)
파일: admin.py
역할: Django Admin 설정
설명:
- Django Admin에서 면접 시뮬레이션 관련 모델을 관리할 수 있도록 설정합니다
- 관리자 페이지에서 면접 세션, 메시지, 결과를 조회하고 관리할 수 있습니다
"""

from django.contrib import admin
from .models import Interview, InterviewMessage, InterviewResult

# Django Admin 설정 작성
# @admin.register(Interview)
# class InterviewAdmin(admin.ModelAdmin):
#     pass
