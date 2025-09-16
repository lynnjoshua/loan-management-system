from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role")
        extra_kwargs = {"email": {"required": False}}

    def validate_role(self, value):
        # Prevent self-registration as admin
        if value == "ADMIN":
            raise serializers.ValidationError("You cannot register as admin directly.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user( 
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            role=validated_data.get("role", "USER"),
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extend the default Token serializer to include username + role in the response.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        data["username"] = self.user.username
        data["role"] = self.user.role
        return data

