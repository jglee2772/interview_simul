"""
앱: interview (면접 시뮬레이션)
파일: urls.py
역할: API URL 라우팅 설정
설명:
- interview 앱 내부의 API 엔드포인트에 대한 URL 패턴을 정의합니다.
- views.py에서 정의한 APIView 클래스들을 특정 URL 경로와 연결합니다.
- 이 파일은 메인 프로젝트의 urls.py (config/urls.py)에 'api/' 경로로 include 됩니다.
"""

from django.urls import path
from . import views  # 👈 'InterviewViewSet' 대신 이렇게 'views' 전체를 임포트합니다.

urlpatterns = [
    # POST /api/interview/start/
    # 'views.StartInterviewView'를 사용합니다.
    path('start/', views.StartInterviewView.as_view(), name='interview-start'), 
    
    # POST /api/interview/answer/
    # 'views.SubmitAnswerView'를 사용합니다.
    path('answer/', views.SubmitAnswerView.as_view(), name='interview-answer'), 
]