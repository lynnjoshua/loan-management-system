from rest_framework import serializers
from .models import Loan

class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = [
            "id", "amount", "tenure", "interest_rate",
            "monthly_installment", "total_payable", "total_interest",
            "is_closed"
        ]
