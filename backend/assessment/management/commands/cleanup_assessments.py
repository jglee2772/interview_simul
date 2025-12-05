from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from assessment.models import Assessment, AssessmentAnswer, AssessmentResult

class Command(BaseCommand):
    help = "30일 지난 검사 데이터 자동 삭제"

    def handle(self, *args, **kwargs):
        threshold = timezone.now() - timedelta(days=30)

        old_assessments = Assessment.objects.filter(created_at__lt=threshold)

        count = old_assessments.count()

        if count == 0:
            self.stdout.write("삭제할 검사 데이터 없음.")
            return

        AssessmentAnswer.objects.filter(assessment__in=old_assessments).delete()
        AssessmentResult.objects.filter(assessment__in=old_assessments).delete()
        old_assessments.delete()

        self.stdout.write(f"{count}개의 검사 데이터 삭제 완료!")
