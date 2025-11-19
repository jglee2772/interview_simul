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

ANALYZE_SECTION_PROMPT_TEMPLATE = """실전형 HR 컨설턴트로서 아래 내용을 분석하여 **간결하고 실용적인** 개선안을 제시하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【분석 대상】섹션: '{section_label}'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{content}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 위 내용만 분석. 일반 예시 금지.

【출력 형식 - 아래 구조로 간결하게】

## 📌 핵심 문제점
[가장 큰 문제점, 한 문장 30단어 이내]

---

## 🔧 개선안

**Before:** [문제 부분 인용]

**After:** [STAR 기법, 수치/성과 포함 개선안]

**개선 포인트:** [핵심 이유 1줄]

---

## 💬 면접 예상 질문 (최대 2개)

**Q1: [질문]**
- S: [1줄] / T: [1줄] / A: [1줄, 수치] / R: [1줄, 성과]

**Q2: [질문]**
- S: [1줄] / T: [1줄] / A: [1줄, 수치] / R: [1줄, 성과]

---

💡 핵심만. 수치와 성과 명시.
"""

ANALYZE_FULL_PROMPT_TEMPLATE = """실전형 면접관으로서 아래 이력서를 분석하여 **간결하고 실용적인** 대응 전략을 제시하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【이력서 데이터】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{resume_json}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 위 데이터만 분석. 일반 예시 금지.

【출력 형식 - 아래 구조로 간결하게】

## ⚠️ 핵심 리스크
[면접관이 반드시 물어볼 가장 큰 문제점, 한 문장]

---

## 🔍 주요 문제점 (최대 3개)

**1. [문제명]**
- 발견: [구체적 내용, 수치]
- 리스크: ⚠️⚠️⚠️ / ⚠️⚠️ / ⚠️
- 대응: [대응 방향 1줄]

**2. [문제명]**
- 발견: [구체적 내용, 수치]
- 리스크: ⚠️⚠️⚠️ / ⚠️⚠️ / ⚠️
- 대응: [대응 방향 1줄]

**3. [문제명]** (있을 경우만)
- 발견: [구체적 내용, 수치]
- 리스크: ⚠️⚠️⚠️ / ⚠️⚠️ / ⚠️
- 대응: [대응 방향 1줄]

---

## 💬 예상 질문 & 대응 (최대 3개)

**Q1: [질문]**
- S: [1줄] / T: [1줄] / A: [1줄, 수치] / R: [1줄, 성과]
- 주의: [피해야 할 말 1줄]

**Q2: [질문]**
- S: [1줄] / T: [1줄] / A: [1줄, 수치] / R: [1줄, 성과]
- 주의: [피해야 할 말 1줄]

**Q3: [질문]** (있을 경우만)
- S: [1줄] / T: [1줄] / A: [1줄, 수치] / R: [1줄, 성과]
- 주의: [피해야 할 말 1줄]

---

💡 핵심만. 수치와 성과 명시.
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
            feedback = call_openai_api(prompt, max_tokens=1500)
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
            feedback = call_openai_api(prompt, max_tokens=2000)
            return Response({'feedback': feedback}, status=status.HTTP_200_OK)
        except ValueError as e:
            error_msg = str(e)
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if '한도' in error_msg else status.HTTP_500_INTERNAL_SERVER_ERROR
            logger.error(f'전체 분석 실패: {error_msg}')
            return Response({'error': error_msg}, status=status_code)

