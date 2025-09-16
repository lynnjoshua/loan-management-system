from rest_framework import serializers
from .models import Loan

class LoanSerializer(serializers.ModelSerializer):
    # Show username (or email) of the loan owner
    user = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Loan
        fields = [
            "id",
            "user",   # new field
            "amount",
            "tenure",
            "interest_rate",
            "monthly_installment",
            "total_payable",
            "total_interest",
            "is_closed",
        ]
        read_only_fields = ["user"]  # user is assigned automatically in views

