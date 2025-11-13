"""
앱: interview (면접 시뮬레이션)
파일: views.py
역할: API 뷰(컨트롤러) 작성
설명:
- 면접 시뮬레이션 관련 API 엔드포인트의 비즈니스 로직을 작성합니다.
- Django REST Framework의 APIView를 기반으로 작성되었습니다.
- GPT API(get_gpt_response)와 연동하여 AI의 질문을 생성하고 사용자의 답변을 처리합니다.
- API 엔드포인트:
  - POST /api/interview/start/ : 면접 시작 및 첫 질문 반환 (StartInterviewView)
  - POST /api/interview/answer/ : 답변 제출 및 다음 꼬리 질문 반환 (SubmitAnswerView)
"""

import os
import openai  # openai 라이브러리 임포트
from typing import List, Dict  # 타입 힌팅 임포트

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Interviewer, InterviewSession, InterviewExchange
from .serializers import InterviewExchangeSerializer, InterviewSessionDetailSerializer

# -----------------------------------------------------------------
# 1. GPT API 연동 헬퍼 함수 (views.py 내부에 포함)
# -----------------------------------------------------------------

# Django settings.py에 OPENAI_API_KEY가 설정되어 있다고 가정
# from django.conf import settings
# openai.api_key = settings.OPENAI_API_KEY

# 또는 .env 파일에서 직접 로드 (python-dotenv 설치 필요)
# from dotenv import load_dotenv
# load_dotenv()
# openai.api_key = os.environ.get("OPENAI_API_KEY")

# 가장 간단하게 os 환경 변수에서 직접 로드
openai.api_key = os.environ.get("OPENAI_API_KEY")

if not openai.api_key:
    # 실제 프로덕션에서는 print 대신 logging을 사용하세요.
    print("경고: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
    # raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.") # 서버 시작 시 오류 발생

def get_gpt_response(
    system_prompt: str, 
    user_prompt: str, 
    history: List[Dict[str, str]] = None
) -> str:
    """
    GPT API를 호출하여 응답을 받아옵니다.
    - system_prompt: 면접관의 '성격' 프롬프트
    - user_prompt: 사용자의 '요청' (예: "첫 질문 해주세요")
    - history: 이전 대화 내역 (꼬리 질문 시 필요)
    """
    
    if not openai.api_key:
        return "오류: 서버에 OPENAI_API_KEY가 설정되지 않았습니다. 관리자에게 문의하세요."

    messages = []
    
    # 1. 시스템 프롬프트 (면접관 성격)
    messages.append({"role": "system", "content": system_prompt})
    
    # 2. 이전 대화 내역 (history)
    if history:
        messages.extend(history)
        
    # 3. 현재 사용자 요청
    messages.append({"role": "user", "content": user_prompt})

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",  # 또는 "gpt-3.5-turbo"
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        answer = response.choices[0].message.content
        return answer.strip()

    except Exception as e:
        print(f"GPT API 호출 오류: {e}")
        return "죄송합니다. AI 응답을 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요."

# -----------------------------------------------------------------
# 2. 핵심 API 뷰 (Views)
# -----------------------------------------------------------------

class StartInterviewView(APIView):
    """
    POST /api/interview/start/
    - 면접을 시작하고 첫 번째 질문을 반환합니다.
    - React로부터 'job_topic'을 받습니다.
    """
    def post(self, request, *args, **kwargs):
        job_topic = request.data.get('job_topic')

        if not job_topic:
            return Response(
                {"error": "job_topic (면접 주제)가 필요합니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. 새 면접 세션 생성
            session = InterviewSession.objects.create(job_topic=job_topic)
            
            # 2. 랜덤 면접관 4명 할당 (모델 메서드 호출)
            session.set_random_interviewers(count=4)
            
            # 3. 첫 번째 면접관 선택
            first_interviewer = session.interviewers.all().first()
            if not first_interviewer:
                return Response(
                    {"error": "등록된 면접관이 없습니다. (Admin에서 Interviewer를 생성해야 합니다)"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 4. GPT에 보낼 프롬프트 정의
            system_prompt = first_interviewer.system_prompt
            user_prompt = (
                f"저는 {job_topic} 직무 면접에 지원했습니다. "
                f"당신의 역할({first_interviewer.role})에 맞춰 첫 번째 면접 질문을 시작해주세요."
            )
            
            # 5. GPT API 호출 (파일 내의 헬퍼 함수 사용)
            question_text = get_gpt_response(system_prompt, user_prompt)
            
            # 6. 첫 번째 질문/답변 쌍(Exchange) 저장 (답변은 비어있음)
            exchange = InterviewExchange.objects.create(
                session=session,
                interviewer=first_interviewer,
                question_text=question_text
            )
            
            # 7. React에 보낼 데이터 직렬화 (Serializer 사용)
            serializer = InterviewExchangeSerializer(exchange)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmitAnswerView(APIView):
    """
    POST /api/interview/answer/
    - 사용자의 답변을 받고, 다음 꼬리 질문을 반환합니다.
    - React로부터 'exchange_id'와 'user_answer'를 받습니다.
    """
    def post(self, request, *args, **kwargs):
        exchange_id = request.data.get('exchange_id')
        user_answer = request.data.get('user_answer')

        if not exchange_id or not user_answer:
            return Response(
                {"error": "'exchange_id'와 'user_answer'가 모두 필요합니다."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. 현재 질문/답변 쌍(Exchange) 찾기
            current_exchange = InterviewExchange.objects.get(id=exchange_id)
            
            # 2. 사용자 답변 저장
            current_exchange.answer_text = user_answer
            current_exchange.save()
            
            session = current_exchange.session
            job_topic = session.job_topic

            # 3. 다음 면접관 결정 (4명 순환 로직)
            session_interviewers = list(session.interviewers.all())
            
            if not session_interviewers:
                 return Response(
                    {"error": "이 세션에 배정된 면접관이 없습니다."}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            answered_count = session.exchanges.filter(answer_text__isnull=False).count()
            
            # 4명의 면접관이 순서대로 질문 (0, 1, 2, 3, 0, 1...)
            next_interviewer_index = answered_count % len(session_interviewers)
            next_interviewer = session_interviewers[next_interviewer_index]

            # 4. GPT에 전달할 '대화 내역(history)' 생성
            history = []
            previous_exchanges = session.exchanges.all().order_by('created_at')
            for ex in previous_exchanges:
                # API 비용 절약을 위해 프롬프트가 너무 길어지는 것을 방지할 수 있습니다.
                # 여기서는 모든 대화를 포함합니다.
                history.append({"role": "assistant", "content": ex.question_text}) # AI가 한 질문
                if ex.answer_text:
                    history.append({"role": "user", "content": ex.answer_text}) # 사용자가 한 답변

            # 5. GPT에 보낼 프롬프트 정의
            system_prompt = next_interviewer.system_prompt
            # (참고) history에 이미 마지막 질문/답변이 포함되어 있으므로 user_prompt는 간단하게
            user_prompt = f"{job_topic} 면접 상황입니다. 위 대화에 이어서 꼬리 질문을 해주세요."
            
            # 6. GPT API 호출 (파일 내의 헬퍼 함수 사용)
            next_question_text = get_gpt_response(system_prompt, user_prompt, history)

            # 7. 새 질문/답변 쌍(Exchange) 저장 (답변은 비어있음)
            new_exchange = InterviewExchange.objects.create(
                session=session,
                interviewer=next_interviewer,
                question_text=next_question_text
            )
            
            # 8. React에 보낼 새 질문 데이터 직렬화
            serializer = InterviewExchangeSerializer(new_exchange)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except InterviewExchange.DoesNotExist:
            return Response({"error": "유효하지 않은 exchange_id입니다."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)