from django.db import models
from django.conf import settings
from decimal import Decimal, ROUND_HALF_UP, getcontext
from django.core.exceptions import ValidationError

getcontext().prec = 10  # set decimal precision

def validate_amount(value):
    if value < 1000 or value > 100000:
        raise ValidationError("Amount must be between ₹1,000 and ₹100,000.")

def validate_tenure(value):
    if value < 3 or value > 24:
        raise ValidationError("Tenure must be between 3 and 24 months.")

def validate_interest(value):
    if value <= 0:
        raise ValidationError("Interest rate must be a positive number.")

class Loan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[validate_amount])
    tenure = models.PositiveIntegerField(help_text="Tenure in months", validators=[validate_tenure])
    interest_rate = models.FloatField(help_text="Yearly interest %", validators=[validate_interest])
    monthly_installment = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_payable = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_interest = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_closed = models.BooleanField(default=False)
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('ACTIVE', 'Active'),
        ('FORECLOSED', 'Foreclosed'),
        ('REJECTED', 'Rejected'),
        ('REPAID','Repaid'),
        ('DEFAULTED','Defaulted'),
    )
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

    def clean(self):
        """Extra validation hook if needed."""
        if self.amount and (self.amount < 1000 or self.amount > 100000):
            raise ValidationError({"amount": "Amount must be between ₹1,000 and ₹100,000."})
        if self.tenure and (self.tenure < 3 or self.tenure > 24):
            raise ValidationError({"tenure": "Tenure must be between 3 and 24 months."})
        if self.interest_rate and self.interest_rate <= 0:
            raise ValidationError({"interest_rate": "Interest rate must be positive."})

    def save(self, *args, **kwargs):
        monthly_rate = Decimal(self.interest_rate) / Decimal(12 * 100)
        p = Decimal(self.amount)
        n = self.tenure

        if monthly_rate == 0:
            emi = p / n
            total_payable = p
        else:
            factor = (1 + monthly_rate) ** n
            emi = p * monthly_rate * factor / (factor - 1)
            total_payable = emi * n

        total_interest = total_payable - p

        self.monthly_installment = emi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.total_payable = total_payable.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.total_interest = total_interest.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Loan {self.id} - {self.user.username if self.user else 'Unassigned'}"