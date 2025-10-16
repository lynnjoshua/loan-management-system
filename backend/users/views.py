from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, permissions
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserProfileSerializer
)
from .models import UserProfile
from loans.permissions import IsAdminRole

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Public endpoint to register a new user.
    Uses RegisterSerializer which creates the User (inactive) and a UserProfile (PENDING).
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]  # anyone can sign up


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint (POST). Returns access + refresh tokens.
    We use a custom serializer so the response also includes small user info (username, role, user_id).
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserListView(generics.ListAPIView):
    """
    Admin-only list of users.
    Uses custom IsAdminRole permission to check role='ADMIN'.
    """
    queryset = User.objects.filter(role='USER')
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]


@api_view(["POST"])
@permission_classes([IsAdminRole])
def approve_user(request, pk):
    """
    Admin-only endpoint to approve/activate a user.

    POST /users/<pk>/approve/
    - Sets user.is_active = True so the user can log in
    - If a UserProfile exists, sets profile.status = 'APPROVED'
    """
    user = get_object_or_404(User, pk=pk)

    # Activate the user
    user.is_active = True
    user.save()

    # Try to update the profile status if profile exists
    profile = UserProfile.objects.filter(user=user).first()
    if profile: 
        profile.status = "APPROVED"
        profile.save()

    return Response({"detail": "User approved and activated."}, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAdminRole])
def suspend_user(request, pk):
    """
    Admin-only endpoint to suspend/de-activate a user.

    POST /users/<pk>/suspend/
    - Sets user.is_active = False so the user cannot log in
    - If a UserProfile exists, sets profile.status = 'SUSPENDED'
    """
    user = get_object_or_404(User, pk=pk)

    # De-activate the user
    user.is_active = False
    user.save()

    # Try to update the profile status if profile exists
    profile = UserProfile.objects.filter(user=user).first()
    if profile: 
        profile.status = "SUSPENDED"
        profile.save()

    return Response({"detail": "User suspended and de-activated."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def fetch_user_profile(request, pk):
    """
    Admin-only endpoint to fetch a user's profile details.

    GET /users/<pk>/profile/
    - Returns the UserProfile details for the specified user.
    """
    user = get_object_or_404(User, pk=pk)
    profile = UserProfile.objects.filter(user=user).first()

    # Combine user and profile data
    user_data = UserSerializer(user).data
    profile_data = UserProfileSerializer(profile).data if profile else {}

    response_data = {
        **user_data,
        'profile': profile_data
    }

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_current_user_profile(request):
    """
    Authenticated endpoint to fetch the current user's profile details.

    GET /users/me/
    - Returns the UserProfile details for the authenticated user.
    """
    user = request.user
    profile = UserProfile.objects.filter(user=user).first()

    # Combine user and profile data
    user_data = UserSerializer(user).data
    profile_data = UserProfileSerializer(profile).data if profile else {}

    response_data = {
        **user_data,
        'profile': profile_data
    }

    return Response(response_data, status=status.HTTP_200_OK)