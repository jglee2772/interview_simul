"""
앱: resume (이력서)
파일: admin.py
역할: Django Admin 설정
설명:
- Django Admin에서 이력서 관련 모델을 관리할 수 있도록 설정합니다
- 관리자 페이지에서 이력서를 조회하고 관리할 수 있습니다
"""

from django.contrib import admin
from .models import Resume, Education, Experience, Certificate

# Django Admin 설정 작성
# @admin.register(Resume)
# class ResumeAdmin(admin.ModelAdmin):
#     pass

