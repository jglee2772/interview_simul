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

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Resume, Education, Experience, Certificate
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

