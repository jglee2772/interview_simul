"""
앱: interview (면접 시뮬레이션)
파일: models.py
역할: 데이터베이스 모델 구조 정의
설명:
- 면접 시뮬레이션 앱의 핵심 데이터 모델을 정의합니다.
- '성격'을 가진 여러 면접관, 실제 면접 '세션', '질문/답변 쌍'을 중심으로 구조화합니다.
- Django ORM을 사용하여 데이터베이스 테이블을 생성합니다.
- 모델 목록:
  - Interviewer: 고유한 면접관 정보 (성격, 역할, GPT 시스템 프롬프트 등)
  - InterviewSession: 하나의 전체 면접 세션 (랜덤 면접관이 배정됨)
  - InterviewExchange: 세션 내에서 특정 면접관이 한 질문과 사용자의 답변을 기록
"""

from django.db import models
from django.contrib.auth.models import User # (선택) 나중에 사용자 로그인을 붙일 경우 대비
import random

class Interviewer(models.Model):
    """
    총 8명의 고유한 면접관 정보를 저장합니다.
    이 정보는 관리자 페이지(admin)에서 미리 생성해두어야 합니다.
    """
    
    # 면접관의 성격 유형을 미리 정의합니다.
    PERSONALITY_CHOICES = [
        ('friendly', '우호적'),        # (예: HR, 문화 적합성 중시)
        ('aggressive', '압박형'),     # (예: 스트레스 테스트)
        ('technical', '기술 집착형'),  # (예: 시니어 개발자, CS 기본기 중시)
        ('practical', '실무형'),      # (예: 팀 리드, 문제 해결 능력 중시)
        ('silent', '과묵형'),         # (예: 답변을 유도하는 유형)
        ('beginner', '주니어형'),     # (예: 실무 지식이 조금 부족한 면접관)
        ('cto_level', 'CTO 수준'),    # (예: 아키텍처, 비전 중시)
        ('hr_focused', '인사팀'),     # (예: 인성, 조직 문화 중시)
    ]

    name = models.CharField(max_length=100, help_text="면접관 이름 (예: 김OO 팀장)")
    role = models.CharField(max_length=100, help_text="면접관 직무 (예: 시니어 백엔드 개발자)")
    personality = models.CharField(max_length=20, choices=PERSONALITY_CHOICES, unique=True)
    
    # 핵심: 이 면접관의 GPT 프롬프트를 정의하는 필드
    system_prompt = models.TextField(
        help_text="GPT API에 시스템 메시지로 주입할 프롬프트 (예: '당신은 매우 꼼꼼한 시니어 개발자입니다...')"
    )

    def __str__(self):
        return f"{self.name} ({self.get_personality_display()})"

class InterviewSession(models.Model):
    """
    하나의 전체 면접 세션을 관리합니다.
    """
    # user = models.ForeignKey(User, on_delete=models.CASCADE) # (선택)
    job_topic = models.CharField(max_length=100, help_text="면접 주제 (예: React, Django)")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('started', '시작됨'), ('completed', '완료됨')], default='started')
    total_questions = models.IntegerField(default=10, help_text="이 세션에서 진행할 총 질문 횟수")

    # 핵심: 이 세션에 참여하는 면접관들 (4명이 할당될 필드)
    interviewers = models.ManyToManyField(
        Interviewer, 
        related_name="interview_sessions",
        help_text="이 세션에 배정된 면접관들"
    )

    def __str__(self):
        return f"면접 세션 #{self.id} ({self.job_topic})"
    
    # (참고) 이 메서드는 views.py에서 호출하게 됩니다.
    def set_random_interviewers(self, count=4):
        """
        views.py에서 이 세션이 생성된 직후 호출할 메서드.
        모든 면접관 중 'count' 만큼 랜덤으로 뽑아 이 세션에 할당합니다.
        """
        all_interviewers = list(Interviewer.objects.all())
        # 면접관 수가 4명보다 적으면 샘플링 에러가 나므로, 가능한 만큼만 뽑습니다.
        if len(all_interviewers) > count:
            selected = random.sample(all_interviewers, count)
        else:
            selected = all_interviewers
            
        self.interviewers.set(selected)

class InterviewExchange(models.Model):
    """
    면접 세션 내에서 오고 간 '질문-답변' 한 턴(Turn)을 저장합니다.
    """
    session = models.ForeignKey(
        InterviewSession, 
        related_name="exchanges", 
        on_delete=models.CASCADE,
        help_text="이 대화가 속한 전체 면접 세션"
    )
    
    # 핵심: 이 질문을 '누가' 했는지 기록
    interviewer = models.ForeignKey(
        Interviewer, 
        on_delete=models.CASCADE,
        help_text="이 질문을 한 면접관"
    )
    
    question_text = models.TextField()
    answer_text = models.TextField(blank=True, null=True) # 사용자가 답변하면 채워짐
    feedback_text = models.TextField(blank=True, null=True) # (선택) AI의 피드백
    
    created_at = models.DateTimeField(auto_now_add=True) # 대화 순서 정렬용

    class Meta:
        ordering = ['created_at'] # 항상 시간순으로 정렬

    def __str__(self):
        return f"[Q] {self.interviewer.name}: {self.question_text[:30]}..."
