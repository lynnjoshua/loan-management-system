from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Nested serializer for the user's profile data."""
    class Meta:
        model = UserProfile
        fields = (
            "phone_number",
            "bank_account_number",
            "ifsc_code",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "pin_code",
            "date_of_birth",
            "pan_number",
            "aadhaar_number",
            "full_address",
            "status",
        )
        read_only_fields = ["full_address", "status"]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Simple registration serializer:
    - accepts password + password_confirm
    - accepts nested profile data
    - creates the User (inactive) and the UserProfile (status='PENDING')
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(required=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password_confirm", "profile")
        extra_kwargs = {"email": {"required": True}}

    def validate(self, data):
        # Ensure passwords match
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        # remove password_confirm so it's not used in create()
        data.pop("password_confirm")
        return data

    @transaction.atomic
    def create(self, validated_data):
        profile_data = validated_data.pop("profile", {})
        password = validated_data.pop("password")

        # Create user but keep inactive until approved by an admin
        user = User(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
        )
        user.set_password(password)
        user.is_active = False  # block login until admin approves
        user.save()

        # Create related profile with status "PENDING"
        UserProfile.objects.create(user=user, status="PENDING", **profile_data)

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add small extra info to the login response (username, role, id)."""
    def validate(self, attrs):
        data = super().validate(attrs)
        data["username"] = self.user.username
        # include role if your User model has it; safe to use getattr
        data["role"] = getattr(self.user, "role", None)
        data["user_id"] = self.user.id
        return data


class UserSerializer(serializers.ModelSerializer):
    """Small read-only user summary for lists/details."""
    class Meta:
        model = User
        fields = ["id", "username", "email", "date_joined", "is_active", "role"]
        read_only_fields = ["id", "date_joined", "is_active"]
