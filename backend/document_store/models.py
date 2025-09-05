from django.db import models
import uuid

class Document(models.Model):
	"""Model for uploaded documents"""
	STATUS_CHOICES = [
		('uploading', 'Uploading'),
		('processing', 'Processing'),
		('completed', 'Completed'),
		('failed', 'Failed'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	filename = models.CharField(max_length=255)
	file_path = models.CharField(max_length=500)
	file_size = models.PositiveIntegerField()
	content_type = models.CharField(max_length=100)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
	processing_error = models.TextField(blank=True, null=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return self.filename
