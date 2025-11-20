"""
앱: assessment (인적성검사)
파일: views.py
역할: API 뷰(컨트롤러) 작성
설명:
- 인적성검사 관련 API 엔드포인트를 작성합니다
- Django REST Framework의 ViewSet을 사용합니다
- API 엔드포인트:
  - POST /api/assessment/start/          - 인적성검사 시작
  - GET  /api/assessment/{id}/questions/ - 질문 조회
  - POST /api/assessment/{id}/submit/    - 답변 제출
  - GET  /api/assessment/{id}/result/    - 결과 조회
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # 로그인 없이 사용
from django.shortcuts import get_object_or_404

# GPT API
from openai import OpenAI
import json
import os  
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
import re

from .models import Assessment, AssessmentQuestion, AssessmentAnswer, AssessmentResult
from .serializers import (
    AssessmentSerializer,
    AssessmentQuestionSerializer,
    AssessmentResultSerializer,
)

def generate_personality_analysis(result):
    prompt = f"""
너는 HR 성격 평가 전문 컨설턴트이다.

다음은 인적성 검사 6개 역량의 점수이다. 점수는 1~5점이다.
이를 기반으로 사용자의 전체 성향을 분석하라.

[점수]
의사소통(COMM): {result.communication}
책임감(RESP): {result.responsibility}
문제해결(PROB): {result.problem_solving}
성장성(GROW): {result.growth}
스트레스 내성(STRE): {result.stress}
적응력(ADAP): {result.adaptation}

요구사항:
1) summary 는 반드시 150~250자 사이
2) strengths 는 정확히 3개
3) weaknesses 는 정확히 2개
4) work_style 은 반드시 1개 (예: 분석형, 조율형, 창의형 등)
5) **하나라도 비워두면 안 됨**
6) **반드시 완전한 JSON 형식만 출력** (설명 금지, 텍스트 금지)

JSON 예시 형식:
{{
  "summary": "텍스트",
  "strengths": ["문장1", "문장2", "문장3"],
  "weaknesses": ["문장1", "문장2"],
  "work_style": "텍스트"
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}],
    )

    # 🔥 최신 SDK 방식
    content = response.choices[0].message.content

    # JSON만 추출
    json_match = re.search(r"\{[\s\S]*\}", content)
    if json_match:
        content = json_match.group(0)

    try:
        return json.loads(content)
    except Exception:
        return {"raw": content}


class AssessmentViewSet(viewsets.ModelViewSet):
    """
    인적성검사 ViewSet
    - 인적성검사 시작, 질문 조회, 답변 제출, 결과 조회 등의 API를 제공합니다
    """
    serializer_class = AssessmentSerializer
    permission_classes = [AllowAny]  #  로그인 없이 사용 가능하게

    def get_queryset(self):
        # 일단 전체 세션 조회. 나중에 필요하면 필터 추가 가능
        return Assessment.objects.all().order_by("-created_at")

    @action(detail=False, methods=["post"])
    def start(self, request):
        """
        인적성검사 시작 API
        - 메인 페이지에서 이름을 받아 인적성검사 세션을 생성합니다.
        - 생성된 세션 정보와 질문 목록(20개)을 함께 반환합니다.
        예시 요청:
        {
            "name": "홍길동"
        }
        """
        name = request.data.get("name")
        if not name:
            return Response(
                {"error": "name 필드는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 인적성검사 세션 생성
        assessment = Assessment.objects.create(name=name)

        # 세션 정보 직렬화
        assessment_data = AssessmentSerializer(assessment).data

        # 질문 20개 조회
        questions = AssessmentQuestion.objects.order_by("number")
        question_data = AssessmentQuestionSerializer(questions, many=True).data

        return Response(
            {
                "assessment": assessment_data,  # id, name 등
                "questions": question_data,     # 문항 전체
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"])
    def questions(self, request, pk=None):
        """
        질문 조회 API
        - 특정 인적성검사 세션에 대해 문항 목록을 조회합니다.
        - 사실 세션과 상관없이 공통 문항 20개이지만,
          프론트에서 assessment_id를 기준으로 움직이기 때문에 세션 확인은 해줍니다.
        """
        assessment = get_object_or_404(Assessment, pk=pk)

        questions = AssessmentQuestion.objects.order_by("number")
        question_data = AssessmentQuestionSerializer(questions, many=True).data

        return Response(
            {
                "assessment_id": assessment.id,
                "name": assessment.name,
                "questions": question_data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """
        답변 제출 API
        - 20개 문항에 대한 답변을 제출하고, 결과를 계산합니다.
        예시 요청:
        {
            "answers": [4, 3, 2, 5, ... 총 20개]
        }
        """
        assessment = get_object_or_404(Assessment, pk=pk)

        answers = request.data.get("answers")

        # 기본 검증
        if not isinstance(answers, list) or len(answers) != 20:
            return Response(
                {"error": "answers는 길이 20인 리스트여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 각 값이 1~5인지 확인
        for v in answers:
            if not isinstance(v, int) or v < 1 or v > 5:
                return Response(
                    {"error": "각 답변은 1~5 사이의 정수여야 합니다."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # 기존 답변이 있다면 삭제 후 다시 저장 (재응시 대비)
        AssessmentAnswer.objects.filter(assessment=assessment).delete()

        # 답변 저장
        for idx, value in enumerate(answers, start=1):
            question = get_object_or_404(AssessmentQuestion, number=idx)
            AssessmentAnswer.objects.create(
                assessment=assessment,
                question=question,
                value=value,
            )

        # models.py에 만든 계산 메서드 호출
        result = assessment.calculate_result(answers)

        result_data = AssessmentResultSerializer(result).data

        # 🔥 GPT 기반 성향 분석 생성
        analysis = generate_personality_analysis(result)

        return Response(
            {
                "message": "답변이 정상적으로 제출되고 결과가 계산되었습니다.",
                "result": result_data,
                "analysis": analysis, 
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def result(self, request, pk=None):
        assessment = get_object_or_404(Assessment, pk=pk)

        try:
            result = assessment.result
        except AssessmentResult.DoesNotExist:
            return Response(
                {"error": "아직 이 세션에 대한 결과가 존재하지 않습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        result_data = AssessmentResultSerializer(result).data

        # 🔥 GPT 분석 다시 생성 (또는 DB에 저장해두고 가져와도 됨)
        analysis = generate_personality_analysis(result)

        return Response(
            {
                "assessment_id": assessment.id,
                "name": assessment.name,
                "result": result_data,
                "analysis": analysis,   # ✔ 반드시 포함
            },
            status=status.HTTP_200_OK,
        )
