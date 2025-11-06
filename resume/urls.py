"""
앱: resume (이력서)
파일: urls.py
역할: URL 라우팅 설정
설명:
- 이력서 관련 URL 경로를 정의합니다
- ViewSet을 Router에 등록하여 자동으로 URL을 생성합니다
- API 엔드포인트 경로:
  - /api/resume/ - 이력서 목록/생성
  - /api/resume/{id}/ - 이력서 조회/수정/삭제
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResumeViewSet

router = DefaultRouter()
router.register(r'', ResumeViewSet, basename='resume')

urlpatterns = [
    path('', include(router.urls)),
]

