from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from openai import OpenAI
import json
import os
import re

from .models import Assessment, AssessmentQuestion, AssessmentAnswer, AssessmentResult
from .serializers import (
    AssessmentSerializer,
    AssessmentQuestionSerializer,
    AssessmentResultSerializer,
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ===============================================
#   GPT 성향 분석 생성 함수
# ===============================================
def generate_personality_analysis(result):
    prompt = f"""
너는 HR 성격 평가 전문 컨설턴트이다.

다음은 인적성 검사 6개 역량이다:

의사소통(COMM): {result.communication}
책임감(RESP): {result.responsibility}
문제해결(PROB): {result.problem_solving}
성장성(GROW): {result.growth}
스트레스(STRE): {result.stress}
적응력(ADAP): {result.adaptation}

요구사항:
1) summary는 반드시 150~250자
2) strengths는 정확히 3개
3) weaknesses는 정확히 2개
4) work_style은 정확히 1개
5) 반드시 JSON만 출력
{{
  "summary": "...",
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "..."],
  "work_style": "..."
}}
"""

    res = client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}],
    )

    content = res.choices[0].message.content

    match = re.search(r"\{[\s\S]*\}", content)
    if match:
        content = match.group(0)

    try:
        return json.loads(content)
    except:
        return {"raw": content}


# ===============================================
#   Assessment API
# ===============================================
class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Assessment.objects.all().order_by("-created_at")

    # ----------------------------
    # 검사 시작
    # ----------------------------
    @action(detail=False, methods=["post"])
    def start(self, request):
        name = request.data.get("name")
        if not name:
            return Response({"error": "name 필수"},
                            status=status.HTTP_400_BAD_REQUEST)

        assessment = Assessment.objects.create(name=name)
        assessment_data = AssessmentSerializer(assessment).data

        questions = AssessmentQuestion.objects.order_by("number")
        question_data = AssessmentQuestionSerializer(questions, many=True).data

        return Response(
            {"assessment": assessment_data, "questions": question_data},
            status=status.HTTP_201_CREATED
        )

    # ----------------------------
    # 질문 조회
    # ----------------------------
    @action(detail=True, methods=["get"])
    def questions(self, request, pk=None):
        assessment = get_object_or_404(Assessment, pk=pk)

        questions = AssessmentQuestion.objects.order_by("number")
        question_data = AssessmentQuestionSerializer(questions, many=True).data

        return Response(
            {"assessment_id": assessment.id,
             "name": assessment.name,
             "questions": question_data},
            status=status.HTTP_200_OK,
        )

    # ----------------------------
    # 답변 제출
    # ----------------------------
    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        assessment = get_object_or_404(Assessment, pk=pk)
        answers = request.data.get("answers")

        if not isinstance(answers, list) or len(answers) != 40:
            return Response({"error": "answers는 길이 40리스트"},
                            status=status.HTTP_400_BAD_REQUEST)

        for v in answers:
            if not isinstance(v, int) or not (1 <= v <= 5):
                return Response({"error": "답변은 1~5 정수만 허용"},
                                status=status.HTTP_400_BAD_REQUEST)

        AssessmentAnswer.objects.filter(assessment=assessment).delete()

        for idx, val in enumerate(answers, start=1):
            q = get_object_or_404(AssessmentQuestion, number=idx)
            AssessmentAnswer.objects.create(
                assessment=assessment,
                question=q,
                value=val
            )

        result = assessment.calculate_result(answers)
        result_data = AssessmentResultSerializer(result).data

        analysis = generate_personality_analysis(result)

        return Response(
            {"message": "제출 완료", "result": result_data, "analysis": analysis},
            status=status.HTTP_200_OK
        )

    # ----------------------------
    # 결과 조회
    # ----------------------------
    @action(detail=True, methods=["get"])
    def result(self, request, pk=None):
        assessment = get_object_or_404(Assessment, pk=pk)

        try:
            result = assessment.result
        except AssessmentResult.DoesNotExist:
            return Response({"error": "결과 없음"}, status=404)

        result_data = AssessmentResultSerializer(result).data
        analysis = generate_personality_analysis(result)

        return Response(
            {"assessment_id": assessment.id,
             "name": assessment.name,
             "result": result_data,
             "analysis": analysis},
            status=status.HTTP_200_OK
        )
