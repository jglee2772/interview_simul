"""
앱: resume (이력서)
파일: views.py
역할: API 뷰(컨트롤러) 작성
"""

import json
import logging
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from openai import OpenAI

logger = logging.getLogger(__name__)

SECTION_LABELS = {
    'growthProcess': '성장과정',
    'strengthsWeaknesses': '성격의 장단점',
    'academicLife': '학업생활',
    'motivation': '지원동기와 입사 후 포부'
}

ANALYZE_SECTION_PROMPT_TEMPLATE = """당신은 15년 경력의 대기업 HR 담당자이자 취업 컨설턴트입니다. 실제 채용 현장에서 수천 명의 이력서를 검토하고 면접을 진행한 경험이 있습니다. 아래 내용을 실제 채용 담당자의 시선으로 분석하여, 구체적이고 실전적인 개선안을 제시하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
분석 대상 섹션: {section_label}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

중요 지침:
- 위 내용만 분석하세요. 일반적인 예시나 템플릿은 절대 사용하지 마세요.
- 채용 담당자가 실제로 문제라고 생각할 만한 구체적 지점을 찾으세요.
- 모든 개선안은 이력서에 바로 적용 가능해야 합니다.
- 수치, 기간, 성과는 반드시 구체적으로 명시하세요.
- 마크다운 문법이나 이모티콘을 절대 사용하지 마세요. 순수 텍스트만 작성하세요.
- 각 섹션 사이에는 빈 줄을 두어 가독성을 높이세요.

출력 형식 - 아래 구조를 정확히 따르세요:

[문제점 요약]

문제점을 한 문장으로 명확히 제시하세요.

왜 문제인가?
채용 담당자가 이 부분을 보고 떠올릴 수 있는 의문점이나 우려사항을 설명하세요. 면접관이 어떤 질문을 할 가능성이 높은지도 함께 제시하세요.


[피드백 및 개선사항]

Before (현재 내용)
문제가 있는 실제 문장을 그대로 인용하세요.

After (개선된 내용)
STAR 기법을 적용한 구체적 개선안을 작성하세요. 반드시 수치와 성과를 포함하세요.

Situation: 상황을 1줄로 설명
Task: 과제나 목표를 1줄로 설명 (수치 포함)
Action: 구체적 행동을 2-3줄로 설명 (수치, 기간, 방법 명시)
Result: 측정 가능한 성과를 1-2줄로 설명 (수치 필수)

개선 포인트
Before와 After의 가장 중요한 차이점과, 이 개선안이 채용 담당자에게 어떻게 어필되는지 설명하세요.


[개선된 내용 예시 - 바로 복사해서 사용]

위에서 제시한 After 내용을 그대로 다시 한 번 제시하여, 사용자가 바로 복사해서 이력서에 붙여넣을 수 있도록 하세요.

이 예시를 그대로 사용하거나, 본인의 실제 경험에 맞게 수치와 성과만 수정하여 활용하세요.


[예상 질문 및 대응]

Q1: 이 섹션에서 나올 가능성이 가장 높은 질문

면접관이 이 질문을 하는 이유:
이 질문이 왜 나올 수밖에 없는지 설명하세요.

완벽한 답변 (STAR 기법):
S (Situation): 상황 설명 1줄
T (Task): 과제나 목표 1줄 (수치 포함)
A (Action): 구체적 행동 2줄 (수치, 기간, 방법 명시)
R (Result): 측정 가능한 성과 1줄 (수치 필수)

면접관이 좋아하는 표현:
실제로 면접장에서 말할 수 있는 구체적인 문장을 제시하세요. 예: "저는 3개월간 매일 고객 20명에게 직접 방문하여 매출을 30% 증가시켰습니다"

절대 하지 말아야 할 표현:
피해야 할 표현을 제시하세요. 예: "열심히 했습니다", "많이 배웠습니다" 등 모호한 표현

Q2: 추가로 나올 수 있는 질문 (필요한 경우만)

면접관이 이 질문을 하는 이유:
이 질문이 왜 나올 수밖에 없는지 설명하세요.

완벽한 답변 (STAR 기법):
위와 동일한 형식으로 작성하세요.

면접관이 좋아하는 표현:
실제로 면접장에서 말할 수 있는 구체적인 문장을 제시하세요.

절대 하지 말아야 할 표현:
피해야 할 표현을 제시하세요.
"""

ANALYZE_FULL_PROMPT_TEMPLATE = """당신은 15년 경력의 대기업 HR 담당자이자 면접관입니다. 실제 채용 현장에서 수천 명의 이력서를 검토하고 수백 명의 면접을 진행한 경험이 있습니다. 아래 이력서를 실제 채용 담당자의 시선으로 분석하여, 구체적이고 실전적인 면접 대응 전략을 제시하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이력서 전체 데이터
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{resume_json}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

중요 지침:
- 위 데이터만 분석하세요. 일반적인 예시나 템플릿은 절대 사용하지 마세요.
- 실제 면접관이 반드시 물어봐야 할 질문을 찾으세요.
- 모든 대응 전략은 면접장에서 바로 사용할 수 있어야 합니다.
- 수치, 기간, 성과는 반드시 구체적으로 명시하세요.
- 마크다운 문법이나 이모티콘을 절대 사용하지 마세요. 순수 텍스트만 작성하세요.
- 각 섹션 사이에는 빈 줄을 두어 가독성을 높이세요.

출력 형식 - 아래 구조를 정확히 따르세요:

[문제점 요약]

이력서에서 가장 눈에 띄는 문제점이나 의문점을 한 문장으로 명확히 제시하세요.

왜 문제인가?
면접관이 이 부분을 보고 떠올릴 수 있는 의문점이나 우려사항을 설명하세요. 이 문제가 왜 면접에서 치명적일 수 있는지도 함께 설명하세요.


[피드백 및 개선사항]

발견된 주요 이슈 (최대 3개):

1. 첫 번째 문제명

발견된 내용:
이력서에서 발견된 구체적 내용을 수치, 기간, 사실 기반으로 제시하세요.

리스크 수준: 매우 높음 / 높음 / 보통

면접관이 물어볼 질문:
실제로 면접장에서 나올 수 있는 구체적 질문을 제시하세요.

완벽한 대응 전략:
STAR 기법을 적용한 답변 전략을 3-4줄로 작성하세요. 반드시 수치와 성과를 포함하세요.

절대 하지 말아야 할 답변:
피해야 할 표현을 제시하세요.

2. 두 번째 문제명 (있을 경우만)

발견된 내용:
이력서에서 발견된 구체적 내용을 수치, 기간, 사실 기반으로 제시하세요.

리스크 수준: 매우 높음 / 높음 / 보통

면접관이 물어볼 질문:
실제로 면접장에서 나올 수 있는 구체적 질문을 제시하세요.

완벽한 대응 전략:
STAR 기법을 적용한 답변 전략을 3-4줄로 작성하세요. 반드시 수치와 성과를 포함하세요.

절대 하지 말아야 할 답변:
피해야 할 표현을 제시하세요.

3. 세 번째 문제명 (있을 경우만)

발견된 내용:
이력서에서 발견된 구체적 내용을 수치, 기간, 사실 기반으로 제시하세요.

리스크 수준: 매우 높음 / 높음 / 보통

면접관이 물어볼 질문:
실제로 면접장에서 나올 수 있는 구체적 질문을 제시하세요.

완벽한 대응 전략:
STAR 기법을 적용한 답변 전략을 3-4줄로 작성하세요. 반드시 수치와 성과를 포함하세요.

절대 하지 말아야 할 답변:
피해야 할 표현을 제시하세요.


[개선된 내용 예시 - 면접 준비용]

위에서 제시한 대응 전략을 바탕으로, 면접에서 바로 사용할 수 있는 답변 예시를 제시하세요. 사용자가 이를 암기하고 연습할 수 있도록 명확하게 작성하세요.


[예상 질문 및 대응]

Q1: 가장 확실하게 나올 질문 (이력서의 핵심 이슈 기반)

면접관이 이 질문을 하는 이유:
이 질문이 왜 나올 수밖에 없는지 설명하세요.

완벽한 답변 (STAR 기법):
S (Situation): 상황 설명 1-2줄
T (Task): 과제나 목표 1줄 (수치 포함)
A (Action): 구체적 행동 3-4줄 (수치, 기간, 방법 명시)
R (Result): 측정 가능한 성과 2줄 (수치 필수)

면접관이 좋아하는 표현:
실제로 면접장에서 말할 수 있는 구체적인 문장을 제시하세요. 예: "저는 3개월간 매일 고객 20명에게 직접 방문하여 매출을 30% 증가시켰습니다"

절대 하지 말아야 할 표현:
피해야 할 표현을 제시하세요. 예: "열심히 했습니다", "많이 배웠습니다" 등 모호한 표현

Q2: 두 번째로 나올 가능성이 높은 질문

면접관이 이 질문을 하는 이유:
이 질문이 왜 나올 수밖에 없는지 설명하세요.

완벽한 답변 (STAR 기법):
위와 동일한 형식으로 작성하세요.

면접관이 좋아하는 표현:
실제로 면접장에서 말할 수 있는 구체적인 문장을 제시하세요.

절대 하지 말아야 할 표현:
피해야 할 표현을 제시하세요.

Q3: 세 번째 질문 (있을 경우만)

면접관이 이 질문을 하는 이유:
이 질문이 왜 나올 수밖에 없는지 설명하세요.

완벽한 답변 (STAR 기법):
위와 동일한 형식으로 작성하세요.

면접관이 좋아하는 표현:
실제로 면접장에서 말할 수 있는 구체적인 문장을 제시하세요.

절대 하지 말아야 할 표현:
피해야 할 표현을 제시하세요.
"""

def get_openai_client():
    if not settings.OPENAI_API_KEY:
        raise ValueError('OpenAI API 키가 설정되지 않았습니다.')
    return OpenAI(api_key=settings.OPENAI_API_KEY)

def call_openai_api(prompt, max_tokens=2000):
    try:
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except ValueError as e:
        logger.error(f'OpenAI API ValueError: {e}')
        raise
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f'OpenAI API 오류: {e}')
        if 'rate limit' in error_msg:
            logger.warning('OpenAI API 호출 한도 초과')
            raise ValueError('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.')
        raise ValueError(f'AI 분석 중 오류가 발생했습니다: {str(e)}')

class ResumeViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'], url_path='analyze')
    def analyze(self, request):
        section = request.data.get('section')
        content = request.data.get('content', '').strip()
        
        if not content:
            logger.warning(f'분석 요청 실패: 내용 없음 (section: {section})')
            return Response({'error': '분석할 내용이 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if section not in SECTION_LABELS:
            logger.warning(f'분석 요청 실패: 유효하지 않은 섹션 (section: {section})')
            return Response({'error': '유효하지 않은 섹션입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 500:
            content = content[:500]
        
        section_label = SECTION_LABELS[section]
        prompt = ANALYZE_SECTION_PROMPT_TEMPLATE.format(
            section_label=section_label,
            content=content
        )
        
        try:
            feedback = call_openai_api(prompt, max_tokens=2500)
            return Response({'feedback': feedback}, status=status.HTTP_200_OK)
        except ValueError as e:
            logger.error(f'섹션 분석 실패: {section} - {e}')
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='analyze-full')
    def analyze_full(self, request):
        resume_data = request.data.get('resumeData')
        if not resume_data:
            logger.warning('전체 분석 요청 실패: 이력서 데이터 없음')
            return Response({'error': '이력서 데이터가 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            resume_json = json.dumps(resume_data, ensure_ascii=False, indent=2)
        except (TypeError, ValueError) as e:
            logger.error(f'이력서 데이터 변환 실패: {e}')
            return Response({'error': f'이력서 데이터 변환 중 오류가 발생했습니다: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        prompt = ANALYZE_FULL_PROMPT_TEMPLATE.format(resume_json=resume_json)
        
        try:
            feedback = call_openai_api(prompt, max_tokens=3000)
            return Response({'feedback': feedback}, status=status.HTTP_200_OK)
        except ValueError as e:
            error_msg = str(e)
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if '한도' in error_msg else status.HTTP_500_INTERNAL_SERVER_ERROR
            logger.error(f'전체 분석 실패: {error_msg}')
            return Response({'error': error_msg}, status=status_code)

