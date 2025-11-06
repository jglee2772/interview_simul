"""
앱: interview (면접 시뮬레이션)
파일: views.py
역할: API 뷰(컨트롤러) 작성
설명:
- 면접 시뮬레이션 관련 API 엔드포인트를 작성합니다
- Django REST Framework의 ViewSet을 사용합니다
- API 엔드포인트:
  - POST /api/interview/start/ - 면접 시작
  - POST /api/interview/{id}/message/ - 메시지 전송
  - GET /api/interview/{id}/result/ - 결과 조회
- 비즈니스 로직을 작성합니다
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Interview, InterviewMessage, InterviewResult
from .serializers import InterviewSerializer, InterviewMessageSerializer, InterviewResultSerializer

class InterviewViewSet(viewsets.ModelViewSet):
    """
    면접 시뮬레이션 ViewSet
    - 면접 시작, 메시지 전송, 결과 조회 등의 API를 제공합니다
    """
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # 쿼리셋 작성
        pass
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """
        면접 시작 API
        - 면접 세션을 생성하고 초기 메시지를 반환합니다
        """
        # 면접 시작 로직 작성
        pass
    
    @action(detail=True, methods=['post'])
    def message(self, request, pk=None):
        """
        메시지 전송 API
        - 사용자 메시지를 받아 챗봇 응답을 생성합니다
        """
        # 메시지 전송 로직 작성
        pass
    
    @action(detail=True, methods=['get'])
    def result(self, request, pk=None):
        """
        결과 조회 API
        - 면접 결과를 조회합니다
        """
        # 결과 조회 로직 작성
        pass
