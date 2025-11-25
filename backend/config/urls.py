"""
파일: urls.py
역할: 메인 URL 라우팅 설정
설명:
- Django 프로젝트의 메인 URL 라우팅을 정의합니다
- 각 앱의 URL을 include하여 연결합니다
- API 엔드포인트 경로:
  - /admin/ - Django Admin
  - /api/auth/ - 인증 관련 API
  - /api/interview/ - 면접 시뮬레이션 API
  - /api/assessment/ - 인적성검사 API
  - /api/resume/ - 이력서 API
  - /api/homepage/ - 홈페이지 관련 API (후원)
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/interview/', include('interview.urls')),
    path('api/assessment/', include('assessment.urls')),
    path('api/resume/', include('resume.urls')),
    path('api/homepage/', include('homepage.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
