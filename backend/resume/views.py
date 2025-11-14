"""
앱: resume (이력서)
파일: views.py
역할: API 뷰(컨트롤러) 작성
"""

import json
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from openai import OpenAI
from .serializers import ResumeSerializer

SECTION_LABELS = {
    'growthProcess': '성장과정',
    'strengthsWeaknesses': '성격의 장단점',
    'academicLife': '학업생활',
    'motivation': '지원동기와 입사 후 포부'
}

def get_openai_client():
    if not settings.OPENAI_API_KEY:
        raise ValueError('OpenAI API 키가 설정되지 않았습니다.')
    return OpenAI(api_key=settings.OPENAI_API_KEY)

def call_openai_api(prompt, max_tokens=2500):
    try:
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except ValueError:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if 'rate limit' in error_msg:
            raise ValueError('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.')
        raise ValueError(f'AI 분석 중 오류가 발생했습니다: {str(e)}')

class ResumeViewSet(viewsets.ModelViewSet):
    serializer_class = ResumeSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'], url_path='analyze')
    def analyze(self, request):
        section = request.data.get('section')
        content = request.data.get('content', '').strip()
        
        if not content:
            return Response({'error': '분석할 내용이 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if section not in SECTION_LABELS:
            return Response({'error': '유효하지 않은 섹션입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(content) > 500:
            content = content[:500]
        
        section_label = SECTION_LABELS[section]
        
        # 프롬프트 생성 (가독성 최적화 버전)
        prompt = (
            f"think hard about this. think deeply about this. think carefully about this.\n\n"
            f"당신은 20년 경력의 시니어 HR 컨설턴트이자 전략적 스토리텔링 전문가입니다.\n"
            f"수천 명의 지원자를 합격시킨 실적을 가지고 있으며, 최신 채용 트렌드와 AI 기반 선별 방식을 완벽히 이해하고 있습니다.\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"【분석 대상 - 반드시 이 내용만 분석하세요】\n"
            f"섹션: '{section_label}'\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{content}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"⚠️ 중요: 위 내용이 사용자가 실제로 입력한 내용입니다.\n"
            f"일반적인 예시나 템플릿을 제공하지 마세요. 반드시 위 내용을 분석하고, 실제 입력 내용을 인용하여 개선하세요.\n\n"
            f"【목표】\n"
            f"채용담당자가 3초 안에 '면접하고 싶다'고 판단하게 만드는 수준으로 개선\n"
            f"STAR 기법 적용, 구체적 수치/성과 포함, 클리셰 표현 제거\n\n"
            f"【분석 방법】\n"
            f"- 다차원적 분석 (시간적/공간적/계층적 관점)\n"
            f"- STAR 기법 (Situation, Task, Action, Result)\n"
            f"- 문제-해결-성과 구조로 서사화\n"
            f"- 창의적 연결로 차별화 포인트 발견\n\n"
            f"【출력 형식 - 반드시 아래 마크다운 구조로 출력하세요】\n\n"
            f"## 📌 핵심 요약\n\n"
            f"사용자가 입력한 실제 내용을 분석하여, 가장 큰 문제점과 즉시 개선해야 할 핵심 포인트를 **한 문장**으로 제시하세요.\n"
            f"(50단어 이내, 실제 입력 내용을 구체적으로 언급)\n\n"
            f"---\n\n"
            f"## 📊 문제 분석\n\n"
            f"### 현재 내용의 문제점\n"
            f"사용자가 입력한 실제 내용을 인용하며, 왜 문제인지 구체적으로 설명하세요.\n\n"
            f"### 개선 방향\n"
            f"사용자의 실제 경험을 바탕으로 어떻게 개선할지, 어떤 원칙을 적용할지 제시하세요.\n\n"
            f"### 예상 효과\n"
            f"개선 시 어떤 효과가 있는지, 어떻게 차별화되는지 설명하세요.\n\n"
            f"---\n\n"
            f"## 🎯 개선 가이드\n\n"
            f"### 예시 1: Before → After\n\n"
            f"**Before (사용자 입력 내용 인용):**\n"
            f"> [사용자가 실제로 입력한 문제가 있는 부분을 정확히 인용]\n\n"
            f"**문제점:**\n"
            f"- [이 부분이 왜 문제인지 구체적으로 설명]\n\n"
            f"**After (개선된 버전):**\n"
            f"> [사용자의 실제 경험을 바탕으로 STAR 기법 적용, 구체적 수치/성과 포함]\n\n"
            f"**개선 이유:**\n"
            f"- [왜 이렇게 바꿨는지, 사용자의 실제 경험을 어떻게 활용했는지]\n\n"
            f"### 예시 2: 추가 개선 대안\n\n"
            f"**대안 A:**\n"
            f"> [사용자의 실제 경험을 바탕으로 한 구체적 문장]\n\n"
            f"- ✅ 장점: [장점]\n"
            f"- ⚠️ 단점: [단점]\n"
            f"- 📌 적용 시기: [언제 사용하면 좋은지]\n\n"
            f"**대안 B:**\n"
            f"> [사용자의 실제 경험을 다른 관점으로 재구성한 문장]\n\n"
            f"- ✅ 장점: [장점]\n"
            f"- ⚠️ 단점: [단점]\n"
            f"- 📌 적용 시기: [언제 사용하면 좋은지]\n\n"
            f"---\n\n"
            f"## 💼 면접 대비\n\n"
            f"### 예상 질문 1\n"
            f"**질문:** [질문 내용]\n\n"
            f"**답변 구조 (STAR 기법):**\n"
            f"- Situation: [상황]\n"
            f"- Task: [과제]\n"
            f"- Action: [행동]\n"
            f"- Result: [결과]\n\n"
            f"### 예상 질문 2\n"
            f"**질문:** [질문 내용]\n\n"
            f"**답변 구조 (STAR 기법):**\n"
            f"- Situation: [상황]\n"
            f"- Task: [과제]\n"
            f"- Action: [행동]\n"
            f"- Result: [결과]\n\n"
            f"### 예상 질문 3\n"
            f"**질문:** [질문 내용]\n\n"
            f"**답변 구조 (STAR 기법):**\n"
            f"- Situation: [상황]\n"
            f"- Task: [과제]\n"
            f"- Action: [행동]\n"
            f"- Result: [결과]\n\n"
            f"---\n\n"
            f"## ⚠️ 주의사항\n\n"
            f"- **피해야 할 표현:** [클리셰 표현 예시]\n"
            f"- **고려사항:** [개선 시 리스크, 산업/직무별 차이점]\n"
            f"- **트레이드오프:** [각 대안의 장단점 균형]\n"
        )
        
        try:
            feedback = call_openai_api(prompt, max_tokens=2500)
            return Response({'feedback': feedback}, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='analyze-full')
    def analyze_full(self, request):
        resume_data = request.data.get('resumeData')
        if not resume_data:
            return Response({'error': '이력서 데이터가 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            resume_json = json.dumps(resume_data, ensure_ascii=False, indent=2)
        except (TypeError, ValueError) as e:
            return Response({'error': f'이력서 데이터 변환 중 오류가 발생했습니다: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 프롬프트 생성 (분석적이고 대응 가능한 버전)
        prompt = (
            f"당신은 15년 이상 경력의 시니어 면접관입니다. 이력서를 철저히 분석하여 구체적이고 실용적인 대응 전략을 제시하세요.\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"【분석 대상】\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{resume_json}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"⚠️ 위 데이터만 분석하세요. 일반적인 예시는 필요 없습니다.\n\n"
            f"【분석 방법 - 체계적으로】\n"
            f"1. **나이 vs 경력 분석:**\n"
            f"   - 생년월일로 현재 나이 정확히 계산\n"
            f"   - 첫 경력 시작 시점과 나이 비교\n"
            f"   - 나이 대비 경력 연수 적절성 평가 (예: 30세에 경력 1년 = 리스크)\n\n"
            f"2. **경력 공백 분석:**\n"
            f"   - 각 경력 사이 공백 기간 정확히 계산 (월 단위)\n"
            f"   - 6개월 이상 공백은 리스크로 표시\n"
            f"   - 공백 기간에 대한 설명 존재 여부 확인\n\n"
            f"3. **학력 수준 분석:**\n"
            f"   - 최종 학력 확인 (고졸/전문대/대졸/석사/박사)\n"
            f"   - 지원 분야와 학력의 적합성 평가\n"
            f"   - 고졸만 있다면 그 이유 추론 (경제적/가족 사정 등)\n\n"
            f"4. **경력 연속성 분석:**\n"
            f"   - 직급/직책 상승 여부 확인\n"
            f"   - 회사 규모나 산업 일관성 확인\n"
            f"   - 경력이 띄엄띄엄한지, 연속적인지 평가\n\n"
            f"5. **자기소개서-이력서 일관성:**\n"
            f"   - 자기소개서에 언급된 경험이 이력서에 있는지 확인\n"
            f"   - 모순되는 부분 발견 (예: 자기소개서에 '3년 경력' 언급, 이력서에는 1년만)\n\n"
            f"6. **지원 분야 적합성:**\n"
            f"   - 경력/학력/자격증이 지원 분야와 관련 있는지\n"
            f"   - 전혀 다른 분야에서 지원한 경우 리스크 표시\n\n"
            f"【출력 형식 - 반드시 이 구조로】\n\n"
            f"## ⚠️ 핵심 리스크 (한 줄)\n\n"
            f"면접관이 반드시 물어볼 가장 큰 문제점을 한 문장으로.\n"
            f"예: '35세에 경력 2년 → 늦은 시작 이유를 반드시 물어볼 것'\n\n"
            f"---\n\n"
            f"## 🔍 발견된 문제점\n\n"
            f"### 1. [문제명 - 구체적으로]\n"
            f"- **발견:** [이력서에서 발견한 구체적 내용을 인용, 수치 포함]\n"
            f"  예: '생년월일 1990-01-01 (현재 34세), 첫 경력 시작 2022년 (32세 시작, 경력 2년)'\n"
            f"- **면접관 관점:** [왜 문제인지, 면접관이 어떻게 생각할지 구체적으로]\n"
            f"- **리스크:** ⚠️⚠️⚠️ (높음) / ⚠️⚠️ (중간) / ⚠️ (낮음)\n"
            f"- **대응 난이도:** [쉬움/보통/어려움 - 왜 그런지 간단히]\n\n"
            f"### 2. [문제명]\n"
            f"[위와 동일 형식]\n\n"
            f"---\n\n"
            f"## 💬 예상 질문 & 대응 전략\n\n"
            f"### Q1: [구체적 질문 - 이력서 내용 기반]\n"
            f"**의도:** [면접관이 이 질문을 하는 심리적 이유]\n"
            f"**리스크:** ⚠️⚠️⚠️\n"
            f"**나올 확률:** 높음/중간/낮음\n\n"
            f"**답변 (STAR - 구체적이고 실용적으로):**\n"
            f"- **S:** [상황 - 1-2줄, 구체적 배경]\n"
            f"- **T:** [과제 - 1줄, 해결해야 했던 문제]\n"
            f"- **A:** [행동 - 2-3줄, 구체적 행동과 수치 포함]\n"
            f"  예: '온라인 강의 3개 수강(총 120시간), 개인 프로젝트 2개 완료, 자격증 1개 취득'\n"
            f"- **R:** [결과 - 1-2줄, 측정 가능한 성과]\n"
            f"  예: '프로젝트 완료율 100%, 사용자 만족도 4.5/5.0'\n\n"
            f"**⚠️ 주의사항:**\n"
            f"- 피해야 할 말: [구체적 표현 예시]\n"
            f"- 추가 질문 대비: [면접관이 꼬리 질문으로 물어볼 수 있는 내용]\n"
            f"- 대응 팁: [실전에서 유용한 조언]\n\n"
            f"### Q2: [구체적 질문]\n"
            f"[위와 동일 형식]\n\n"
            f"### Q3: [구체적 질문]\n"
            f"[위와 동일 형식]\n\n"
            f"---\n\n"
            f"## ✅ 실전 체크리스트\n\n"
            f"### 준비할 증거 자료\n"
            f"- [ ] [구체적 항목 1 - 예: 자격증 원본, 프로젝트 포트폴리오]\n"
            f"- [ ] [구체적 항목 2]\n"
            f"- [ ] [구체적 항목 3]\n\n"
            f"### 피해야 할 표현\n"
            f"- '[구체적 표현 1 - 예: \"경력이 없어서 죄송합니다\"]'\n"
            f"- '[구체적 표현 2]'\n\n"
            f"### 강조할 포인트\n"
            f"- [구체적 내용 1 - 예: 짧은 기간에 습득한 기술]\n"
            f"- [구체적 내용 2]\n\n"
            f"### 대응 시나리오\n"
            f"- **시나리오 1:** [면접관이 공격적으로 물어볼 때]\n"
            f"  → 대응: [구체적 대응 방법]\n"
            f"- **시나리오 2:** [면접관이 우려를 표현할 때]\n"
            f"  → 대응: [구체적 대응 방법]\n\n"
            f"---\n\n"
            f"**💡 핵심:** 구체적이고 실용적으로. 장황하지 말고 핵심만. 수치와 증거를 명시하세요."
        )
        
        try:
            feedback = call_openai_api(prompt, max_tokens=4000)
            return Response({'feedback': feedback}, status=status.HTTP_200_OK)
        except ValueError as e:
            error_msg = str(e)
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if '한도' in error_msg else status.HTTP_500_INTERNAL_SERVER_ERROR
            return Response({'error': error_msg}, status=status_code)

