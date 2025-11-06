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

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at", "is_completed")
    list_filter = ("is_completed",)
    search_fields = ("name",)


@admin.register(AssessmentQuestion)
class AssessmentQuestionAdmin(admin.ModelAdmin):
    list_display = ("number", "dimension", "is_reverse", "text")
    list_filter = ("dimension", "is_reverse")
    search_fields = ("text",)


@admin.register(AssessmentAnswer)
class AssessmentAnswerAdmin(admin.ModelAdmin):
    list_display = ("assessment", "question", "value")
    list_filter = ("question__dimension",)


@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = (
        "assessment",
        "communication",
        "responsibility",
        "problem_solving",
        "growth",
        "stress",
        "adaptation",
        "attention_check_pass",
        "exaggeration_flag",
        "type_label",
    )
    list_filter = ("attention_check_pass", "exaggeration_flag")