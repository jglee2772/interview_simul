"""
앱: interview (면접 시뮬레이션)
파일: views.py
역할: API 뷰(컨트롤러) 작성
설명:
- 면접 시뮬레이션 관련 API 엔드포인트의 비즈니스 로직을 작성합니다.
- 종료 조건(총 8회 질문)이 추가되었습니다.
"""

import os
import openai
from typing import List, Dict

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Interviewer, InterviewSession, InterviewExchange
from .serializers import InterviewExchangeSerializer, InterviewSessionDetailSerializer

# -----------------------------------------------------------------
# 1. GPT API 연동 헬퍼 함수
# -----------------------------------------------------------------

openai.api_key = os.environ.get("OPENAI_API_KEY")

if not openai.api_key:
    print("경고: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")

def get_gpt_response(
    system_prompt: str, 
    user_prompt: str, 
    history: List[Dict[str, str]] = None
) -> str:
    """
    GPT API를 호출하여 응답을 받아옵니다.
    """
    if not openai.api_key:
        return "오류: 서버에 OPENAI_API_KEY가 설정되지 않았습니다."

    messages = []
    messages.append({"role": "system", "content": system_prompt})
    
    if history:
        messages.extend(history)
        
    messages.append({"role": "user", "content": user_prompt})

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        answer = response.choices[0].message.content
        return answer.strip()

    except Exception as e:
        print(f"GPT API 호출 오류: {e}")
        return "죄송합니다. AI 응답을 생성하는 데 실패했습니다."

# -----------------------------------------------------------------
# 2. 핵심 API 뷰 (Views)
# -----------------------------------------------------------------

class StartInterviewView(APIView):
    """
    POST /api/interview/start/
    - 면접 시작: 랜덤 면접관 배정 및 첫 질문 생성
    """
    def post(self, request, *args, **kwargs):
        job_topic = request.data.get('job_topic')

        if not job_topic:
            return Response({"error": "job_topic이 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. 세션 생성
            session = InterviewSession.objects.create(job_topic=job_topic)
            
            # 2. 랜덤 면접관 4명 할당 (여기가 랜덤 로직입니다 - 정상 작동함)
            session.set_random_interviewers(count=4)
            
            # 3. 첫 번째 면접관 선택
            first_interviewer = session.interviewers.all().first()
            if not first_interviewer:
                return Response(
                    {"error": "등록된 면접관이 없습니다."}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 4. GPT 프롬프트 및 호출
            system_prompt = first_interviewer.system_prompt
            user_prompt = (
                f"저는 {job_topic} 직무 면접에 지원했습니다. "
                f"당신의 역할({first_interviewer.role})에 맞춰 첫 번째 면접 질문을 시작해주세요."
            )
            
            question_text = get_gpt_response(system_prompt, user_prompt)
            
            # 5. 저장 및 응답
            exchange = InterviewExchange.objects.create(
                session=session,
                interviewer=first_interviewer,
                question_text=question_text
            )
            
            serializer = InterviewExchangeSerializer(exchange)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmitAnswerView(APIView):
    """
    POST /api/interview/answer/
    - 답변 제출 및 다음 질문 생성
    - ★수정됨: 질문 횟수 제한(8회) 로직 추가
    """
    
    # 🔥 종료 조건 설정: 총 8번 질문하면 끝남
    TOTAL_QUESTIONS_LIMIT = 8 

    def post(self, request, *args, **kwargs):
        exchange_id = request.data.get('exchange_id')
        user_answer = request.data.get('user_answer')

        if not exchange_id or not user_answer:
            return Response({"error": "필수 데이터 누락"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. 답변 저장
            current_exchange = InterviewExchange.objects.get(id=exchange_id)
            current_exchange.answer_text = user_answer
            current_exchange.save()
            
            session = current_exchange.session
            job_topic = session.job_topic

            # 2. 현재까지 답변 완료된 개수 확인
            answered_count = session.exchanges.filter(answer_text__isnull=False).count()

            # -------------------------------------------------------
            # 🔥 3. 종료 조건 확인 (핵심 로직)
            # -------------------------------------------------------
            if answered_count >= self.TOTAL_QUESTIONS_LIMIT:
                session.status = 'completed'
                session.save()
                
                # 프론트엔드에 'is_finished: True' 신호를 보냄
                return Response({
                    "id": None, 
                    "is_finished": True, 
                    "question_text": "수고하셨습니다. 모든 면접 질문이 종료되었습니다. 좋은 결과 있으시길 바랍니다.",
                    "interviewer": None
                }, status=status.HTTP_200_OK)

            # -------------------------------------------------------
            # 4. 다음 면접관 결정 (종료되지 않았을 때만 실행됨)
            # -------------------------------------------------------
            session_interviewers = list(session.interviewers.all())
            
            if not session_interviewers:
                 return Response({"error": "면접관 없음"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 4명이 돌아가면서 질문 (0 -> 1 -> 2 -> 3 -> 0 ...)
            next_interviewer_index = answered_count % len(session_interviewers)
            next_interviewer = session_interviewers[next_interviewer_index]

            # 5. GPT 히스토리 생성
            history = []
            previous_exchanges = session.exchanges.all().order_by('created_at')
            for ex in previous_exchanges:
                history.append({"role": "assistant", "content": ex.question_text})
                if ex.answer_text:
                    history.append({"role": "user", "content": ex.answer_text})

            # 6. 다음 질문 생성
            system_prompt = next_interviewer.system_prompt
            user_prompt = f"{job_topic} 면접 상황입니다. 위 대화에 이어서 꼬리 질문을 해주세요."
            
            next_question_text = get_gpt_response(system_prompt, user_prompt, history)

            # 7. 저장 및 응답
            new_exchange = InterviewExchange.objects.create(
                session=session,
                interviewer=next_interviewer,
                question_text=next_question_text
            )
            
            serializer = InterviewExchangeSerializer(new_exchange)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except InterviewExchange.DoesNotExist:
            return Response({"error": "유효하지 않은 exchange_id"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)