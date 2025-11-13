"""
앱: interview (면접 시뮬레이션)
파일: serializers.py
역할: 데이터 직렬화 (JSON 변환기)
설명:
- models.py의 Django 모델 객체(QuerySet)를 React가 이해할 수 있는 JSON 형태로 변환합니다.
- 또한, React에서 보낸 JSON을 Python 객체로 변환(역직렬화)할 때도 사용됩니다.
- Django REST Framework의 ModelSerializer를 주로 사용합니다.
- Serializer 목록:
  - InterviewerSerializer: 면접관의 기본 정보 (이름, 역할 등)
  - InterviewExchangeSerializer: 질문/답변 1회(Exchange) 정보 (핵심 API 응답)
  - InterviewSessionDetailSerializer: 면접 세션 전체 정보 (결과 페이지용)
"""

from rest_framework import serializers
from .models import Interviewer, InterviewSession, InterviewExchange

class InterviewerSerializer(serializers.ModelSerializer):
    """
    면접관의 기본 정보를 보여주기 위한 Serializer
    (GPT 프롬프트 같은 민감 정보는 제외)
    """
    class Meta:
        model = Interviewer
        fields = ['name', 'role', 'personality']


class InterviewExchangeSerializer(serializers.ModelSerializer):
    """
    하나의 '질문-답변' 쌍을 JSON으로 변환하기 위한 Serializer (핵심)
    React와 주로 이 데이터를 주고받게 됩니다.
    """
    # 'interviewer' 필드는 ID(숫자) 대신, 
    # 위에서 만든 InterviewerSerializer를 사용해 면접관 객체(이름, 역할 등)로 보여줍니다.
    interviewer = InterviewerSerializer(read_only=True)

    class Meta:
        model = InterviewExchange
        # React에게 이 필드들을 JSON으로 보내주겠다고 정의
        fields = [
            'id', 
            'session', 
            'interviewer', 
            'question_text', 
            'answer_text', 
            'feedback_text', 
            'created_at'
        ]
        # 'session'은 React에서 받아야 할 수도 있으므로 read_only=False (기본값)로 둡니다.


class InterviewSessionDetailSerializer(serializers.ModelSerializer):
    """
    (선택) 하나의 면접 세션 '전체' 정보를 보여줄 때 사용
    (예: 면접 결과 페이지)
    """
    # 이 세션에 배정된 면접관 목록 (위의 Serializer 사용)
    interviewers = InterviewerSerializer(many=True, read_only=True)
    
    # 이 세션에서 오고 간 모든 대화 목록 (위의 Serializer 사용)
    exchanges = InterviewExchangeSerializer(many=True, read_only=True, source='exchanges') 

    class Meta:
        model = InterviewSession
        fields = [
            'id', 
            'job_topic', 
            'status', 
            'created_at', 
            'interviewers', 
            'exchanges'
        ]