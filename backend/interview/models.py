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
import random

class Interviewer(models.Model):
    # 팀 구분을 위한 선택지 (이 값이 중요합니다!)
    ROLE_CHOICES = [
        ('hr', '인사팀 (인성/문화)'),       # 3명
        ('tech', '기술팀 (직무/지식)'),     # 2명
        ('exp', '관련경험팀 (실무/경험)'),  # 3명
    ]

    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100, help_text="직함 (예: 인사팀장, 수석 개발자)")
    
    # personality 필드를 '소속 팀' 구분자로 사용합니다.
    personality = models.CharField(
        max_length=10, 
        choices=ROLE_CHOICES, 
        help_text="소속 팀 (hr, tech, exp 중 선택)"
    )
    
    system_prompt = models.TextField()

    def __str__(self):
        return f"[{self.get_personality_display()}] {self.name}"


class InterviewSession(models.Model):
    # ... (기존 필드들: job_topic, total_questions, status 등 동일) ...
    job_topic = models.CharField(max_length=100)
    total_questions = models.IntegerField(default=10)
    status = models.CharField(max_length=20, default='started')
    created_at = models.DateTimeField(auto_now_add=True)
    final_feedback = models.TextField(blank=True, null=True)

    interviewers = models.ManyToManyField(Interviewer, related_name="sessions")

    # [핵심 수정] 팀별로 TO에 맞춰 랜덤 뽑기 로직
    def set_random_interviewers(self):
        """
        총 4명 선발: 인사팀 2명 + 기술팀 1명 + 경험팀 1명
        각 팀 풀에서 랜덤으로 뽑아서 섞습니다.
        """
        # 1. 각 팀의 전체 인원 가져오기 (DB 쿼리)
        hr_pool = list(Interviewer.objects.filter(personality='hr'))   # 인사팀 3명
        tech_pool = list(Interviewer.objects.filter(personality='tech')) # 기술팀 2명
        exp_pool = list(Interviewer.objects.filter(personality='exp'))   # 경험팀 3명

        selected_interviewers = []

        # 2. 팀별 정원만큼 랜덤 뽑기 (예외 처리 포함)
        # 인사팀: 2명
        if len(hr_pool) >= 2:
            selected_interviewers.extend(random.sample(hr_pool, 2))
        else:
            selected_interviewers.extend(hr_pool) # 인원 부족하면 다 넣음

        # 기술팀: 1명
        if len(tech_pool) >= 1:
            selected_interviewers.extend(random.sample(tech_pool, 1))
        else:
            selected_interviewers.extend(tech_pool)

        # 경험팀: 1명
        if len(exp_pool) >= 1:
            selected_interviewers.extend(random.sample(exp_pool, 1))
        else:
            selected_interviewers.extend(exp_pool)

        # 3. 뽑힌 4명의 순서를 섞음 (누가 먼저 질문할지 랜덤)
        random.shuffle(selected_interviewers)

        # 4. 저장
        self.interviewers.set(selected_interviewers)

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
