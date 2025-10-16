from django.contrib import admin
from django.urls import path, include

from .views import api_root


urlpatterns = [
    # API root / health check
    path("api/", api_root),

    # Django admin panel
    path("admin/", admin.site.urls),

    # Authentication & User Management
    path("api/auth/", include("users.urls")),

    # Loan Management
    path("api/loans/", include("loans.urls")),
]
