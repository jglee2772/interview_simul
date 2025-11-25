from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# ======================================================
#  Assessment (검사 1회)
# ======================================================
class Assessment(models.Model):
    name = models.CharField(max_length=30, null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Assessment #{self.id} - {self.name}"

    # -------------------------------
    #   결과 계산 (핵심)
    # -------------------------------
    def calculate_result(self, answers):
        # 40문항 체크
        if len(answers) != 40:
            raise ValueError("answers 리스트는 반드시 40개의 값을 가져야 합니다.")

        # 모든 문항 불러오기 (번호 순)
        questions = AssessmentQuestion.objects.order_by("number")

        if questions.count() != 40:
            raise ValueError(
                f"DB에는 {questions.count()}개 문항이 존재합니다. 40개 문항이 필요합니다."
            )

        # 역량별 점수 저장 dict
        dim_values = {
            "COMM": [],
            "RESP": [],
            "PROB": [],
            "GROW": [],
            "STRE": [],
            "ADAP": [],
        }

        validity_raw = []  # VALI 원본 점수 저장용 (주의/일관성 체크)

        # -------------------------
        #   40개 문항 점수 계산
        # -------------------------
        for idx, value in enumerate(answers):
            q = questions[idx]
            score = int(value)

            # 역문항 처리
            if q.is_reverse:
                score = 6 - score   # 1↔5, 2↔4, 3=3

            # VALI 문항은 결과 평균에서 제외
            if q.dimension == "VALI":
                validity_raw.append(int(value))
                continue

            # 역량별 점수에 추가
            if q.dimension in dim_values:
                dim_values[q.dimension].append(score)

        # -------------------------
        #   평균 계산 함수
        # -------------------------
        def avg(lst):
            return round(sum(lst) / len(lst), 2) if lst else 0

        # -------------------------
        #   타당도 검증 (임시 로직)
        # -------------------------
        attention_check_pass = True
        exaggeration_flag = False

        # VALI 문항 중 1점 or 5점 극단값이 2개 이상이면 과장 플래그
        extreme = [v for v in validity_raw if v in [1, 5]]
        if len(extreme) >= 2:
            exaggeration_flag = True

        # VALI 응답이 전부 동일하면 주의 부족 판단
        if len(validity_raw) > 0 and len(set(validity_raw)) == 1:
            attention_check_pass = False

        # -------------------------
        #   DB 저장
        # -------------------------
        result, created = AssessmentResult.objects.update_or_create(
            assessment=self,
            defaults={
                "communication": avg(dim_values["COMM"]),
                "responsibility": avg(dim_values["RESP"]),
                "problem_solving": avg(dim_values["PROB"]),
                "growth": avg(dim_values["GROW"]),
                "stress": avg(dim_values["STRE"]),
                "adaptation": avg(dim_values["ADAP"]),
                "attention_check_pass": attention_check_pass,
                "exaggeration_flag": exaggeration_flag,
                "type_label": "기본 유형",
            },
        )

        # 검사 완료 처리
        self.completed_at = timezone.now()
        self.is_completed = True
        self.save(update_fields=["is_completed", "completed_at"])

        return result


# ======================================================
#  AssessmentQuestion (문항)
# ======================================================
class AssessmentQuestion(models.Model):
    DIMENSION_CHOICES = [
        ("COMM", "커뮤니케이션·협업"),
        ("RESP", "책임감·성실성"),
        ("PROB", "문제해결·논리"),
        ("GROW", "성장지향·학습의지"),
        ("STRE", "스트레스·정서안정"),
        ("ADAP", "조직적응·대인관계"),
        ("VALI", "타당도"),
    ]

    number = models.PositiveSmallIntegerField(unique=True)
    text = models.CharField(max_length=255)
    dimension = models.CharField(max_length=5, choices=DIMENSION_CHOICES)
    is_reverse = models.BooleanField(default=False)

    def __str__(self):
        return f"Q{self.number}: {self.text[:20]}"


# ======================================================
#  AssessmentAnswer (응답)
# ======================================================
class AssessmentAnswer(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        related_name="answers",
        on_delete=models.CASCADE
    )
    question = models.ForeignKey(
        AssessmentQuestion,
        related_name="answers",
        on_delete=models.CASCADE
    )
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        unique_together = ("assessment", "question")

    def __str__(self):
        return f"A{self.assessment_id} - Q{self.question.number} = {self.value}"


# ======================================================
#  AssessmentResult (결과)
# ======================================================
class AssessmentResult(models.Model):
    assessment = models.OneToOneField(
        Assessment,
        related_name="result",
        on_delete=models.CASCADE
    )

    communication = models.DecimalField(max_digits=3, decimal_places=2)
    responsibility = models.DecimalField(max_digits=3, decimal_places=2)
    problem_solving = models.DecimalField(max_digits=3, decimal_places=2)
    growth = models.DecimalField(max_digits=3, decimal_places=2)
    stress = models.DecimalField(max_digits=3, decimal_places=2)
    adaptation = models.DecimalField(max_digits=3, decimal_places=2)

    attention_check_pass = models.BooleanField(default=True)
    exaggeration_flag = models.BooleanField(default=False)

    type_label = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for Assessment {self.assessment_id}"



