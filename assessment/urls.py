"""
앱: assessment (인적성검사)
파일: urls.py
역할: URL 라우팅 설정
설명:
- 인적성검사 관련 URL 경로를 정의합니다
- ViewSet을 Router에 등록하여 자동으로 URL을 생성합니다
- API 엔드포인트 경로:
  - /api/assessment/start/
  - /api/assessment/{id}/questions/
  - /api/assessment/{id}/submit/
  - /api/assessment/{id}/result/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssessmentViewSet

router = DefaultRouter()
router.register(r'', AssessmentViewSet, basename='assessment')

urlpatterns = [
    path('', include(router.urls)),
]
