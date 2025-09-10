from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def api_root(request):
    return JsonResponse({"message": "API is working!"})

urlpatterns = [
    path("api/", api_root),
    
    path("admin/", admin.site.urls),
    path("api/register/", include("users.urls")), 

    # JWT Authentication
    path("api/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # App routes
    path("api/users/", include("users.urls")),
    path("api/loans/", include("loans.urls")),
]
