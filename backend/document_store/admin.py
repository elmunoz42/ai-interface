from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
	list_display = ('filename', 'status', 'file_size', 'content_type', 'created_at')
	search_fields = ('filename',)
