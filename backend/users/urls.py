from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    UserListView,
    approve_user,   # admin endpoint to activate users
    suspend_user,
    fetch_user_profile,
    get_current_user_profile
)

app_name = "accounts"  # optional but helpful for reversing urls

urlpatterns = [
    # Public: create a new account (user created inactive / profile PENDING)
    path("register/", RegisterView.as_view(), name="register"),

    # Public: login -> returns access + refresh tokens + small user info
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),

    # Token refresh: exchange a refresh token for a fresh access token
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Authenticated user: get current user's profile
    path("users/me/", get_current_user_profile, name="current_user_profile"),

    # Admin-only: list all users (uses permission classes in the view)
    path("users/", UserListView.as_view(), name="user_list"),

    # Admin-only: approve a user so they can log in
    path("users/<int:pk>/approve/", approve_user, name="approve_user"),
    
    # Admin-only: suspend a user so they can't log in
    path("users/<int:pk>/suspend/", suspend_user, name="suspend_user"),
    
    # Admin-only: fetch user profile details
    path("users/<int:pk>/profile/", fetch_user_profile, name="fetch_user_profile"),
]
