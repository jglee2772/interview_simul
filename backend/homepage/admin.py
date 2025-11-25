from django.contrib import admin
from .models import Donation


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ['id', 'amount', 'donor_name', 'created_at']
    list_filter = ['created_at']
    search_fields = ['donor_name', 'message']
    readonly_fields = ['created_at']

