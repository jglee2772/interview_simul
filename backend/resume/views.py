"""
앱: resume (이력서)
파일: views.py
역할: API 뷰(컨트롤러) 작성
설명:
- 이력서 관련 API 엔드포인트를 작성합니다
- Django REST Framework의 ViewSet을 사용합니다
- API 엔드포인트:
  - POST /api/resume/ - 이력서 생성
  - GET /api/resume/{id}/ - 이력서 조회
  - PUT /api/resume/{id}/ - 이력서 수정
  - DELETE /api/resume/{id}/ - 이력서 삭제
- 비즈니스 로직을 작성합니다
"""

from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from openai import OpenAI
from .serializers import ResumeSerializer

class ResumeViewSet(viewsets.ModelViewSet):
    """
    이력서 ViewSet
    - 이력서 생성, 조회, 수정, 삭제 등의 API를 제공합니다
    """
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # 쿼리셋 작성 (현재 사용자의 이력서만 조회)
        pass
    
    def create(self, request):
        """
        이력서 생성 API
        - 이력서를 생성합니다
        """
        # 이력서 생성 로직 작성
        pass
    
    def update(self, request, pk=None):
        """
        이력서 수정 API
        - 이력서를 수정합니다
        """
        # 이력서 수정 로직 작성
        pass
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def analyze(self, request):
        """
        자기소개서 섹션 AI 분석 API
        - 요청: { "section": "growthProcess", "content": "..." }
        - 응답: { "feedback": "..." }
        - 로그인 없이 사용 가능
        """
        section = request.data.get('section')
        content = request.data.get('content', '').strip()
        
        # 빈 필드 검증
        if not content:
            return Response(
                {'error': '분석할 내용이 없습니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 섹션 유효성 검증 및 라벨 매핑
        SECTION_LABELS = {
            'growthProcess': '성장과정',
            'strengthsWeaknesses': '성격의 장단점',
            'academicLife': '학업생활',
            'motivation': '지원동기와 입사 후 포부'
        }
        
        if section not in SECTION_LABELS:
            return Response(
                {'error': '유효하지 않은 섹션입니다.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        section_label = SECTION_LABELS[section]
        
        # 500자 제한 (프론트엔드에서도 처리하지만 이중 체크)
        if len(content) > 500:
            content = content[:500]
        
        # OpenAI API 키 확인
        if not settings.OPENAI_API_KEY:
            return Response(
                {'error': 'OpenAI API 키가 설정되지 않았습니다.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # 프롬프트 생성
        prompt = (
            f"다음은 이력서의 '{section_label}' 섹션 내용입니다.\n"
            f"이 내용에 대해 구체적이고 건설적인 피드백을 제공해주세요.\n\n"
            f"내용:\n{content}\n\n"
            f"피드백 시 다음 사항을 고려해주세요:\n"
            f"- 강점과 개선점을 균형있게 제시\n"
            f"- 구체적인 예시와 함께 설명\n"
            f"- 실무에 도움이 되는 조언 포함\n\n"
            f"피드백:"
        )
        
        try:
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=0.7
            )
            
            feedback = response.choices[0].message.content.strip()
            
            return Response(
                {'feedback': feedback},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'AI 분석 중 오류가 발생했습니다: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

