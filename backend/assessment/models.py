"""
앱: assessment (인적성검사)
파일: models.py
역할: 데이터베이스 모델 작성
설명:
- 인적성검사 관련 데이터베이스 모델을 정의합니다
- Django ORM을 사용하여 MySQL 테이블 구조를 정의합니다
- 모델 예시:
  - Assessment: 인적성검사 세션
  - AssessmentQuestion: 질문
  - AssessmentAnswer: 답변
  - AssessmentResult: 결과 분석
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone  # 완료 시간 기록용


# 인적성검사 세션 모델 작성
class Assessment(models.Model):
    """
    인적성 검사 1회 세션
    - 메인 홈페이지에서 이름 입력 → 여기 name 필드에 저장
    """
    # 인적성검사 세션 필드 정의
    name = models.CharField(
        max_length=30,
        help_text="검사 응시자 이름",
        null=True,
        blank=True
    )
    # 생성 시각: 새로 만들어질 때 자동으로 now, 기존 row도 null 허용
    created_at = models.DateTimeField(null=True, blank=True)
    # 검사 완료 시각: 우리가 계산 끝낸 순간에 수동으로 채울 거라 auto_now_add 안 씀
    completed_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    # 완료 여부 플래그
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Assessment #{self.id} - {self.name}"

    # 계산 결과 생성 메서드 추가
    def calculate_result(self, answers):
        """
        20문항 답안 리스트를 받아 최종 결과를 계산하고 AssessmentResult를 생성한다.
        - answers: 길이 20인 리스트, 각 값은 1~5 (리커트 척도)
        """

        if len(answers) != 20:
            raise ValueError("answers 리스트는 20개의 값을 가져야 합니다.")

        # 역코딩 들어가는 문항 번호 (3,6,10,13,16,20)
        REVERSE_INDEXES = {3, 6, 10, 13, 16, 20}

        # 각 역량에 해당하는 문항 번호들
        DIMENSION_MAP = {
            "communication": [1, 2, 3],
            "responsibility": [4, 5, 6],
            "problem_solving": [8, 9, 10],
            "growth": [11, 12, 13],
            "stress": [15, 16, 17],
            "adaptation": [18, 19, 20],
        }

        # 1) 역코딩 처리
        scored = []
        for i, v in enumerate(answers, start=1):  # i: 1~20
            if i in REVERSE_INDEXES:
                scored.append(6 - v)  # 1→5, 2→4, 3→3, 4→2, 5→1
            else:
                scored.append(v)

        # 2) 역량별 평균 계산 함수
        def avg(indices):
            vals = [scored[i - 1] for i in indices]  # 문항번호 → 인덱스 변환
            return round(sum(vals) / len(vals), 2)   # 소수 둘째자리까지

        communication = avg(DIMENSION_MAP["communication"])
        responsibility = avg(DIMENSION_MAP["responsibility"])
        problem_solving = avg(DIMENSION_MAP["problem_solving"])
        growth = avg(DIMENSION_MAP["growth"])
        stress = avg(DIMENSION_MAP["stress"])
        adaptation = avg(DIMENSION_MAP["adaptation"])

        # 3) 타당도 체크
        # 7번: 주의력 체크 → 반드시 3점이어야 정상
        attention_check_pass = (answers[7 - 1] == 3)

        # 14번: "한 번도 약속 어긴 적 없다" → 4점 이상이면 과장 가능성
        exaggeration_flag = (answers[14 - 1] >= 4)

        # 4) 간단 타입 라벨 (나중에 규칙 넣어서 바꿔도 됨)
        type_label = "기본 유형"

        # 5) AssessmentResult 생성
        result, created = AssessmentResult.objects.update_or_create(
        assessment=self,
        defaults={
        "communication": communication,
        "responsibility": responsibility,
        "problem_solving": problem_solving,
        "growth": growth,
        "stress": stress,
        "adaptation": adaptation,
        "attention_check_pass": attention_check_pass,
        "exaggeration_flag": exaggeration_flag,
        "type_label": type_label,
    }
)

        # 6) 검사 완료 표시
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=["is_completed", "completed_at"])

        return result


# 질문 모델 작성
class AssessmentQuestion(models.Model):
    # 질문 필드 정의
    """
    20개 문항 정의
    - number: 1~20 문항 번호
    - dimension: 6개 역량 or 타당도
    - is_reverse: 역코딩 문항 여부
    """
    DIMENSION_CHOICES = [
        ("COMM", "커뮤니케이션·협업"),
        ("RESP", "책임감·성실성"),
        ("PROB", "문제해결·논리"),
        ("GROW", "성장지향·학습의지"),
        ("STRE", "스트레스·정서안정"),
        ("ADAP", "조직적응·대인관계"),
        ("VALI", "타당도(주의/과장)"),
    ]

    number = models.PositiveSmallIntegerField(
        unique=True,
        help_text="문항 번호 (1~20)"
    )
    text = models.CharField(
        max_length=255,
        help_text="문항 내용"
    )
    dimension = models.CharField(
        max_length=5,
        choices=DIMENSION_CHOICES,
        help_text="이 문항이 속한 역량 축"
    )
    is_reverse = models.BooleanField(
        default=False,
        help_text="역코딩 문항인지 여부 (3,6,10,13,16,20 등)"
    )

    def __str__(self):
        return f"Q{self.number}: {self.text[:20]}"


# 답변 모델 작성
class AssessmentAnswer(models.Model):
    # 답변 필드 정의
    """
    한 세션(Assessment)에서 각 문항에 대해 응답한 값
    """
    assessment = models.ForeignKey(
        Assessment,
        related_name="answers",
        on_delete=models.CASCADE,
    )
    question = models.ForeignKey(
        AssessmentQuestion,
        related_name="answers",
        on_delete=models.CASCADE,
    )
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1~5 리커트 척도 응답값"
    )

    class Meta:
        unique_together = ("assessment", "question")

    def __str__(self):
        return f"Assessment {self.assessment_id} - Q{self.question.number} = {self.value}"


# 결과 모델 작성
class AssessmentResult(models.Model):
    # 결과 필드 정의
    """
    20문항 응답 기반 최종 결과
    - 6개 역량 점수
    - 타당도 플래그
    - 유형 이름
    """
    assessment = models.OneToOneField(
        Assessment,
        related_name="result",
        on_delete=models.CASCADE,
    )

    # 6개 역량 점수 (1.00 ~ 5.00)
    communication = models.DecimalField(max_digits=3, decimal_places=2)
    responsibility = models.DecimalField(max_digits=3, decimal_places=2)
    problem_solving = models.DecimalField(max_digits=3, decimal_places=2)
    growth = models.DecimalField(max_digits=3, decimal_places=2)
    stress = models.DecimalField(max_digits=3, decimal_places=2)
    adaptation = models.DecimalField(max_digits=3, decimal_places=2)

    # 타당도
    attention_check_pass = models.BooleanField(default=True)
    exaggeration_flag = models.BooleanField(default=False)

    # 최종 유형 (예: "협업형 안정 실무자")
    type_label = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for Assessment {self.assessment_id}"
