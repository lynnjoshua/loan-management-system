from django.db import models
from django.conf import settings
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, PermissionDenied

from django.db.models import Sum, Q
from django.utils import timezone

def validate_amount(value):
    """Validate loan amount is between ₹1,000 and ₹100,000"""
    if value < 1000 or value > 100000:
        raise ValidationError("Amount must be between ₹1,000 and ₹100,000.")

def validate_tenure(value):
    """Validate tenure is between 3 and 24 months"""
    if value < 3 or value > 24:
        raise ValidationError("Tenure must be between 3 and 24 months.")
    
def validate_interest(value):
    if value <= 0:
        raise ValidationError("Interest rate must be a positive number.")

class Loan(models.Model):
    # User who applied for the loan
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='loans',  # Better reverse relation name
        limit_choices_to={'is_staff': False}
    )
    
    # Loan details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[validate_amount])
    tenure = models.PositiveIntegerField(help_text="Tenure in months", validators=[validate_tenure])
    
    # Fixed 10% interest as per LoanFriend policy
    interest_rate = models.FloatField(default=10.0, editable=True, help_text="Fixed 10% yearly interest")
    
    # Calculated fields
    monthly_installment = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, editable=True)
    total_payable = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, editable=True)
    total_interest = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, editable=True)
    is_closed = models.BooleanField(default=False)
    
    # Amortization schedule cache
    amortization_schedule = models.JSONField(null=True, blank=True, editable=True)
    
    # Loan status
    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved & Active'),
        ('REJECTED', 'Rejected'),
        ('REJECTED_LIMIT', 'Rejected - Limit Reached'),
        ('FORECLOSED', 'Foreclosed'),
        ('REPAID', 'Fully Repaid'),
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    
    # Timestamps and tracking
    applied_date = models.DateTimeField(default=timezone.now, help_text="Application timestamp")
    approved_date = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_loans',
        limit_choices_to={'is_staff': True},
    )
    rejection_reason = models.TextField(blank=True)

    # Foreclosure tracking
    foreclosure_date = models.DateTimeField(null=True, blank=True, help_text="Date when loan was foreclosed")
    foreclosure_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Amount paid to foreclose the loan")

    class Meta:
        ordering = ['-applied_date']  # ADDED: Default ordering

    def clean(self):
        """Extra validation for loan creation"""
        # Basic validations
        if self.amount and (self.amount < 1000 or self.amount > 100000):
            raise ValidationError({"amount": "Amount must be between ₹1,000 and ₹100,000."})
        
        if self.tenure and (self.tenure < 3 or self.tenure > 24):
            raise ValidationError({"tenure": "Tenure must be between 3 and 24 months."})
        
        # Loan limit validation (only for new loans or status changes to PENDING/APPROVED)
        if self._state.adding or self.status in ['PENDING', 'APPROVED']:  # IMPROVED: Use _state.adding
            # Only check if user is set
            if self.user:
                # Get total amount of user's pending and approved loans
                total_unpaid = Loan.objects.filter(
                    user=self.user
                ).filter(
                    Q(status='PENDING') | Q(status='APPROVED')
                ).exclude(  # EXCLUDE current loan if updating
                    pk=self.pk
                ).aggregate(Sum('amount'))['amount__sum'] or 0
                
                if total_unpaid + self.amount > 100000:
                    raise ValidationError({
                        "amount": f"Loan limit exceeded. You already have ₹{total_unpaid} in pending/approved loans."
                    })

    def save(self, *args, **kwargs):
        from .services import calculate_emi, generate_amortization_schedule # Local import to avoid circular dependency
        """Calculate EMI values and schedule when saving the loan"""
        
        # Always recalculate EMI for consistency
        emi, total_payable, total_interest = calculate_emi(
            loan_amount=self.amount,
            months=self.tenure,
            yearly_interest=10.0
        )
        
        self.monthly_installment = emi
        self.total_payable = total_payable
        self.total_interest = total_interest
        
        # Generate/update amortization schedule when loan is approved
        if self.status == 'APPROVED' and self.approved_date:
            # Only regenerate if not exists or loan terms changed
            if not self.amortization_schedule or self._loan_terms_changed():
                schedule = generate_amortization_schedule(
                    loan_amount=self.amount,
                    months=self.tenure,
                    yearly_interest=10.0,
                    start_date=self.approved_date.date()
                )
                self.amortization_schedule = schedule
        
        # Auto-manage is_closed based on status
        self.is_closed = self.status in ['REPAID', 'FORECLOSED', 'REJECTED', 'REJECTED_LIMIT']
        
        # simple enforcement: block non-staff even if someone tries to set it programmatically
        if self.approved_by and not getattr(self.approved_by, "is_staff", False):
            raise ValidationError({"approved_by": "approved_by must be a staff user."})
  
        super().save(*args, **kwargs)

    def _loan_terms_changed(self):
        """Check if loan amount or tenure changed (for amortization recalculation)"""
        if not self.pk:
            return False
        
        try:
            original = Loan.objects.get(pk=self.pk)
            return (original.amount != self.amount or 
                   original.tenure != self.tenure or
                   original.interest_rate != self.interest_rate)
        except Loan.DoesNotExist:
            return False

    def get_amortization_schedule(self):
        from .services import generate_amortization_schedule 
        """Get the payment schedule (generate if not stored)"""
        if self.amortization_schedule:
            return self.amortization_schedule
        
        # Generate on-the-fly if not stored
        start_date = self.approved_date.date() if self.approved_date else self.applied_date.date()
        return generate_amortization_schedule(
            loan_amount=self.amount,
            months=self.tenure,
            yearly_interest=10.0,
            start_date=start_date
        )

    def get_next_payment_details(self):
        """Get details of the next EMI due"""
        if self.status != 'APPROVED':
            return None
        
        schedule = self.get_amortization_schedule()
        payments_made = self.payments.filter(status='SUCCESS').count()
        
        if payments_made < len(schedule):
            return schedule[payments_made]
        return None

    @property
    def payments_made(self):
        """Convenience property for successful payments count"""
        return self.payments.filter(status='SUCCESS').count()

    @property
    def payments_remaining(self):
        """Convenience property for remaining payments"""
        return max(0, self.tenure - self.payments_made)

    def calculate_outstanding_amount(self):
        """
        Calculate the outstanding amount for loan foreclosure.
        Returns the remaining principal balance only (no future interest).
        This ensures customers only pay for the actual loan balance, not future interest.
        """
        if self.status != 'APPROVED':
            return Decimal('0.00')

        payments_made = self.payments.filter(status='SUCCESS').count()
        payments_remaining = self.tenure - payments_made

        if payments_remaining <= 0:
            return Decimal('0.00')

        # Get the amortization schedule to find the current remaining balance
        schedule = self.get_amortization_schedule()

        # If no payments made yet, remaining balance is the full loan amount
        if payments_made == 0:
            return Decimal(str(self.amount)).quantize(Decimal('0.01'))

        # Get the remaining balance after the last paid EMI
        # The schedule stores remaining_balance after each EMI payment
        if payments_made <= len(schedule):
            last_paid_emi = schedule[payments_made - 1]
            remaining_principal = Decimal(str(last_paid_emi.get('remaining_balance', 0)))
            return remaining_principal.quantize(Decimal('0.01'))

        return Decimal('0.00')

    def __str__(self):
        return f"Loan {self.id} - {self.user.username if self.user else 'No User'} - {self.status}"


class Payment(models.Model):
    """Track EMI payments for loans"""
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    emi_number = models.PositiveIntegerField(help_text="Which EMI number this payment covers")

    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

    # Payment type
    PAYMENT_TYPE_CHOICES = (
        ('EMI', 'Regular EMI Payment'),
        ('FORECLOSURE', 'Foreclosure Settlement'),
    )
    payment_type = models.CharField(max_length=15, choices=PAYMENT_TYPE_CHOICES, default='EMI', help_text="Type of payment")

    # Payment gateway tracking
    gateway_reference = models.CharField(max_length=100, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['payment_date']  # ADDED: Chronological order
        unique_together = ['loan', 'emi_number']  # ADDED: Prevent duplicate EMI payments

    def clean(self):
        """Validate payment amount based on payment type"""
        if not self.loan:
            return

        # For regular EMI payments, amount must match monthly installment
        if self.payment_type == 'EMI' and self.amount != self.loan.monthly_installment:
            raise ValidationError({
                "amount": f"EMI payment amount must match loan EMI: ₹{self.loan.monthly_installment}"
            })

        # For foreclosure payments, amount should be positive (no specific validation)
        if self.payment_type == 'FORECLOSURE' and self.amount <= 0:
            raise ValidationError({
                "amount": "Foreclosure amount must be positive"
            })

    def __str__(self):
        return f"Payment {self.emi_number} - Loan {self.loan.id} - ₹{self.amount} - {self.status}"