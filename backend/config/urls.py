from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include

def api_root(request):
    return JsonResponse({"message": "API is working!"})

urlpatterns = [
    path("api/", api_root),

    path("admin/", admin.site.urls),

    # Auth + Users (custom JWT + register handled inside users/urls.py)
    path("api/", include("users.urls")),

    # Loans
    path("api/loans/", include("loans.urls")),
]
