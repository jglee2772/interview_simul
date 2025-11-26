"""
앱: interview (면접 시뮬레이션)
파일: views.py
역할: API 뷰(컨트롤러) 작성
설명:
- 면접 시뮬레이션 관련 API 엔드포인트의 비즈니스 로직을 작성합니다.
- 종료 조건: DB에 저장된 횟수(8~12회) 도달 시 종료
- ★추가됨: 면접 종료 시 전체 대화를 분석하여 '면접 피드백'을 생성합니다.
"""

import os
import openai
import random 
from typing import List, Dict

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
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
            max_tokens=1500 # 피드백이 길 수 있으므로 토큰 여유 있게 설정
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
    - 면접 시작: 랜덤 면접관 배정, 랜덤 질문 횟수 설정, 첫 질문 생성
    """
    permission_classes = [AllowAny] # 누구나 접근 가능하게 허용
    authentication_classes = []     # 로그인 검사 안 함   
    
    def post(self, request, *args, **kwargs):
        job_topic = request.data.get('job_topic')

        if not job_topic:
            return Response({"error": "job_topic이 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. 총 질문 개수 랜덤 결정 (8~12회)
            random_limit = random.randint(8, 12)

            # 2. 세션 생성 (질문 개수 저장)
            session = InterviewSession.objects.create(
                job_topic=job_topic,
                total_questions=random_limit 
            )
            
            # 3. 랜덤 면접관 4명 할당
            session.set_random_interviewers(count=4)
            
            # 4. 첫 번째 면접관 선택
            first_interviewer = session.interviewers.all().first()
            if not first_interviewer:
                return Response(
                    {"error": "등록된 면접관이 없습니다."}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 5. GPT 프롬프트 및 호출
            system_prompt = first_interviewer.system_prompt
            user_prompt = (
                f"저는 {job_topic} 직무 면접에 지원했습니다. "
                f"당신의 역할({first_interviewer.role})에 맞춰 첫 번째 면접 질문을 시작해주세요."
            )
            
            question_text = get_gpt_response(system_prompt, user_prompt)
            
            # 6. 저장 및 응답
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
    - 종료 조건: DB에 저장된 total_questions 횟수에 도달하면 종료
    - ★종료 시: 전체 면접 내용을 분석하여 피드백 제공
    """
    permission_classes = [AllowAny] # 누구나 접근 가능하게 허용
    authentication_classes = []     # 로그인 검사 안 함
    
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
            # 🔥 3. 종료 조건 확인 & 피드백 생성 (핵심 수정 부분)
            # -------------------------------------------------------
            if answered_count >= session.total_questions:
                session.status = 'completed'
                session.save()

                # (1) 피드백 생성을 위해 전체 대화 내역을 텍스트로 합침
                full_history_text = ""
                all_exchanges = session.exchanges.all().order_by('created_at')
                
                for ex in all_exchanges:
                    # 질문자(면접관) 역할과 질문 내용
                    role_name = ex.interviewer.role
                    full_history_text += f"면접관({role_name}): {ex.question_text}\n"
                    # 지원자 답변
                    full_history_text += f"지원자: {ex.answer_text}\n\n"

                # (2) 피드백 생성을 위한 프롬프트 작성
                feedback_system_prompt = (
                    "당신은 IT 및 전문 직무 면접관 헤드헌터입니다. "
                    "지원자의 전체 면접 기록을 분석하여 상세한 피드백을 제공해주세요. "
                    "마크다운(Markdown) 형식을 사용하여 가독성 있게 작성하세요.\n\n"
                    "다음 항목을 반드시 포함하세요:\n"
                    "1. 📋 [총평] (전반적인 인상과 태도)\n"
                    "2. 👍 [잘한 점] (구체적인 답변 사례 2~3가지)\n"
                    "3. 💡 [개선할 점] (부족했던 부분과 구체적인 수정 제안)\n"
                    "4. 💯 [종합 점수] (100점 만점 기준)"
                )
                
                feedback_user_prompt = f"다음은 '{job_topic}' 직무 지원자의 전체 면접 기록입니다. 이에 대한 피드백을 작성해주세요:\n\n{full_history_text}"

                # (3) GPT에게 피드백 요청 (시간이 조금 걸릴 수 있음)
                feedback_result = get_gpt_response(feedback_system_prompt, feedback_user_prompt)
                
                # (4) 종료 신호와 함께 피드백 반환
                return Response({
                    "id": None, 
                    "is_finished": True, 
                    "question_text": "면접이 종료되었습니다. 잠시 후 피드백을 확인해주세요.",
                    "feedback": feedback_result,  # 👈 React로 피드백 전달
                    "interviewer": None
                }, status=status.HTTP_200_OK)

            # -------------------------------------------------------
            # 4. 다음 면접관 결정 (종료 안 됐을 때)
            # -------------------------------------------------------
            session_interviewers = list(session.interviewers.all())
            
            if not session_interviewers:
                 return Response({"error": "면접관 없음"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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