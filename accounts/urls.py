"""
앱: accounts (인증)
파일: urls.py
역할: URL 라우팅 설정
설명:
- 인증 관련 URL 경로를 정의합니다
- API 엔드포인트 경로:
  - /api/auth/register/ - 회원가입
  - /api/auth/login/ - 로그인
  - /api/auth/user/ - 현재 사용자 정보
"""

from django.urls import path
from django.contrib.auth import views as auth_views
from rest_framework.authtoken.views import obtain_auth_token
from .views import RegisterView, UserView

urlpatterns = [
    path('register/', RegisterView, name='register'),
    path('login/', obtain_auth_token, name='login'),
    path('user/', UserView, name='user'),
]
