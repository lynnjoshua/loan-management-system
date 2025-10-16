from rest_framework import serializers
from .models import Loan, Payment

class LoanSerializer(serializers.ModelSerializer):
    # Show username of the loan owner
    user = serializers.CharField(source="user.username", read_only=True)

    # Show user contact information
    user_email = serializers.SerializerMethodField()
    user_phone = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()

    # Show approver username if available
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    # Format dates nicely
    applied_date = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)
    approved_date = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)
    foreclosure_date = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    # Add calculated fields for frontend convenience
    payments_made = serializers.SerializerMethodField()
    payments_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Loan
        fields = [
            "id",
            "user",
            "user_email",
            "user_phone",
            "user_full_name",
            "approved_by_username",
            "amount",
            "tenure",
            "interest_rate",
            "monthly_installment",
            "total_payable",
            "total_interest",
            "is_closed",
            "status",
            "applied_date",
            "approved_date",
            "rejection_reason",
            "foreclosure_date",
            "foreclosure_amount",
            "payments_made",  # calculated field
            "payments_remaining",  # calculated field
        ]
        read_only_fields = [
            "user",
            "user_email",
            "user_phone",
            "user_full_name",
            "approved_by_username",
            "monthly_installment",
            "total_payable",
            "total_interest",
            "is_closed",
            "status",
            "applied_date",
            "approved_date",
            "rejection_reason",
            "foreclosure_date",
            "foreclosure_amount",
            "payments_made",
            "payments_remaining",
        ]

    def get_user_email(self, obj):
        """Get user's email address"""
        return obj.user.email if obj.user and obj.user.email else None

    def get_user_phone(self, obj):
        """Get user's phone number from profile"""
        try:
            if obj.user and hasattr(obj.user, 'profile'):
                return obj.user.profile.phone_number
        except Exception:
            pass
        return None

    def get_user_full_name(self, obj):
        """Get user's full name or username"""
        if obj.user:
            if obj.user.first_name or obj.user.last_name:
                return f"{obj.user.first_name} {obj.user.last_name}".strip()
            return obj.user.username
        return None

    def get_payments_made(self, obj):
        """Get count of successful payments"""
        return obj.payments.filter(status='SUCCESS').count()

    def get_payments_remaining(self, obj):
        """Calculate remaining payments"""
        payments_made = obj.payments.filter(status='SUCCESS').count()
        return max(0, obj.tenure - payments_made)

    def validate_amount(self, value):
        """Custom validation for amount"""
        if value < 1000 or value > 100000:
            raise serializers.ValidationError("Amount must be between ₹1,000 and ₹100,000.")
        return value

    def validate_tenure(self, value):
        """Custom validation for tenure"""
        if value < 3 or value > 24:
            raise serializers.ValidationError("Tenure must be between 3 and 24 months.")
        return value

class PaymentSerializer(serializers.ModelSerializer):
    # Show loan details with payment
    loan_id = serializers.IntegerField(source="loan.id", read_only=True)
    loan_amount = serializers.DecimalField(source="loan.amount", max_digits=10, decimal_places=2, read_only=True)

    # Format date nicely
    payment_date = serializers.DateTimeField(format="%Y-%m-%d %H:%M", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "loan_id",
            "loan_amount",
            "amount",
            "payment_date",
            "emi_number",
            "status",
            "payment_type",
            "gateway_reference",
        ]
        read_only_fields = [
            "id",
            "loan_id",
            "loan_amount",
            "payment_date",
            "payment_type",
            "gateway_reference",
        ]

class LoanCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for loan creation (only amount and tenure needed)
    """
    class Meta:
        model = Loan
        fields = ["amount", "tenure"]  # Only these fields are needed for creation

    def validate_amount(self, value):
        if value < 1000 or value > 100000:
            raise serializers.ValidationError("Amount must be between ₹1,000 and ₹100,000.")
        return value

    def validate_tenure(self, value):
        if value < 3 or value > 24:
            raise serializers.ValidationError("Tenure must be between 3 and 24 months.")
        return value

class AmortizationScheduleSerializer(serializers.Serializer):
    """
    Serializer for amortization schedule API response
    """
    loan_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    tenure = serializers.IntegerField()
    interest_rate = serializers.FloatField()
    schedule = serializers.JSONField()