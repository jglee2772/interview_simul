from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from interview.models import InterviewSession

class Command(BaseCommand):
    help = '지정된 기간(일수)보다 오래된 면접 세션 데이터를 삭제합니다.'

    def add_arguments(self, parser):
        # 실행할 때 '--days 30' 처럼 며칠 기준인지 입력받음 (기본값: 7일)
        parser.add_argument('--days', type=int, default=30, help='삭제 기준 일수 (기본값: 30일)')

    def handle(self, *args, **options):
        days = options['days']
        
        # 1. 삭제 기준 날짜 계산 (오늘 - days)
        cutoff_date = timezone.now() - timedelta(days=days)

        # 2. 기준 날짜보다 오래된 데이터 찾기
        # created_at__lt 뜻: created_at이 cutoff_date보다 '작은'(과거인) 것
        old_sessions = InterviewSession.objects.filter(created_at__lt=cutoff_date)
        count = old_sessions.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS(f"삭제할 데이터가 없습니다. (기준: {days}일 경과, {cutoff_date.date()} 이전 데이터)"))
            return

        # 3. 삭제 실행
        # (Session을 지우면 연결된 질문/답변들도 Cascade 설정에 의해 같이 지워집니다)
        old_sessions.delete()

        self.stdout.write(self.style.SUCCESS(f"총 {count}개의 오래된 면접 세션을 삭제했습니다. (기준: {days}일)"))