const configuredBackendUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL?.replace(/\/$/, '');

export const DJANGO_API_URL = configuredBackendUrl || 'http://127.0.0.1:8000';
