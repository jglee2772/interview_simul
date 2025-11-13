"""
앱: interview (면접 시뮬레이션)
파일: admin.py
역할: Django Admin 사이트 등록
설명:
- models.py에서 정의한 모델들을 Django Admin 페이지에서
- 조회하고 관리(CRUD)할 수 있도록 등록합니다.
"""

from django.contrib import admin
# ↓↓↓↓↓↓ 여기를 수정했습니다! ↓↓↓↓↓↓
from .models import Interviewer, InterviewSession, InterviewExchange

# (보너스) Admin 페이지에서 모델을 더 보기 좋게 관리하기 위한 클래스
class InterviewerAdmin(admin.ModelAdmin):
    """
    면접관(Interviewer) 모델을 어드민에서 관리합니다.
    (여기서 8명의 면접관과 그들의 프롬프트를 미리 생성해야 합니다)
    """
    list_display = ('name', 'role', 'personality')
    list_filter = ('personality', 'role')
    search_fields = ('name', 'role', 'system_prompt')
    # ↑↑↑↑↑↑ GPT 프롬프트 내용으로도 검색할 수 있게 합니다.

class InterviewExchangeInline(admin.TabularInline):
    """
    (보너스 기능)
    면접 세션(InterviewSession) 상세 페이지에서 
    해당 세션의 질문/답변(Exchange) 내역을 함께 보여줍니다.
    """
    model = InterviewExchange
    extra = 0 # 기본으로 비어있는 추가 폼 없음
    fields = ('interviewer', 'question_text', 'answer_text', 'created_at')
    readonly_fields = ('interviewer', 'question_text', 'answer_text', 'created_at') # 세션 상세에서 수정 불가

class InterviewSessionAdmin(admin.ModelAdmin):
    """
    면접 세션(InterviewSession) 모델을 어드민에서 관리합니다.
    """
    list_display = ('id', 'job_topic', 'status', 'created_at')
    list_filter = ('status', 'job_topic')
    search_fields = ('job_topic',)
    readonly_fields = ('created_at',)
    
    # ↓↓↓↓↓↓ (보너스 기능) 위에서 만든 Inline을 여기에 연결
    inlines = [InterviewExchangeInline] 

# --- Admin 사이트에 모델들을 최종 등록 ---
admin.site.register(Interviewer, InterviewerAdmin)
admin.site.register(InterviewSession, InterviewSessionAdmin)

# Exchange 모델은 Session을 통해 주로 확인하므로, 간단하게만 등록하거나 생략해도 됩니다.
admin.site.register(InterviewExchange)

# Django Admin 설정 작성
# @admin.register(Interview)
# class InterviewAdmin(admin.ModelAdmin):
#     pass
