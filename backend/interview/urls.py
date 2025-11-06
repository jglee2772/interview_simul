"""
앱: interview (면접 시뮬레이션)
파일: urls.py
역할: URL 라우팅 설정
설명:
- 면접 시뮬레이션 관련 URL 경로를 정의합니다
- ViewSet을 Router에 등록하여 자동으로 URL을 생성합니다
- API 엔드포인트 경로:
  - /api/interview/start/
  - /api/interview/{id}/message/
  - /api/interview/{id}/result/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InterviewViewSet

router = DefaultRouter()
router.register(r'', InterviewViewSet, basename='interview')

urlpatterns = [
    path('', include(router.urls)),
]
