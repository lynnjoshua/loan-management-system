from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError

from .models import Loan, Payment
from .serializers import LoanSerializer, PaymentSerializer, LoanCreateSerializer
from .permissions import IsAdminRole
from .notifications import send_loan_email, send_loan_whatsapp
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum, Q


class LoanListCreateView(generics.ListCreateAPIView):
    """
    List and create loans with different serializers for GET/POST
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return LoanCreateSerializer if self.request.method == "POST" else LoanSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Loan.objects.all().order_by("-applied_date")

        return Loan.objects.filter(user=user).order_by("-applied_date")

    def perform_create(self, serializer):
        """Auto-assign user and validate loan limit before creating"""
        user = self.request.user

        # Check existing loan limit (₹100,000 max per user)
        existing_loans_total = (
            Loan.objects.filter(user=user)
            .filter(Q(status="PENDING") | Q(status="APPROVED"))
            .aggregate(Sum("amount"))["amount__sum"]
            or 0
        )

        requested_amount = serializer.validated_data["amount"]

        if existing_loans_total + requested_amount > 100000:
            raise ValidationError(
                {
                    "error": f"Loan limit exceeded. You already have ₹{existing_loans_total} in pending/approved loans."
                }
            )

        serializer.save(user=user, interest_rate=10.0, status="PENDING")


class LoanDetailView(generics.RetrieveAPIView):
    """View details of a single loan"""

    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Loan.objects.all()
        return Loan.objects.filter(user=user)


class LoanForecloseView(APIView):
    """Foreclose an approved loan by paying the outstanding amount"""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get foreclosure preview (amount calculation without actually foreclosing)"""
        loan = get_object_or_404(Loan, id=pk)

        # Permission check
        if loan.user != request.user and not request.user.is_staff:
            return Response(
                {"error": "You can only view your own loan foreclosure details"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Business logic checks
        if loan.status != "APPROVED":
            return Response(
                {"error": "Only approved loans can be foreclosed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate outstanding amount
        outstanding_amount = loan.calculate_outstanding_amount()
        payments_made = loan.payments.filter(status="SUCCESS").count()
        payments_remaining = loan.tenure - payments_made

        return Response(
            {
                "loan_id": loan.id,
                "foreclosure_amount": float(outstanding_amount),
                "payments_made": payments_made,
                "payments_remaining": payments_remaining,
                "total_tenure": loan.tenure,
                "original_amount": float(loan.amount),
                "monthly_installment": float(loan.monthly_installment),
            }
        )

    def post(self, request, pk):
        loan = get_object_or_404(Loan, id=pk)

        # Permission check
        if loan.user != request.user and not request.user.is_staff:
            return Response(
                {"error": "You can only foreclose your own loans"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Business logic checks
        if loan.status != "APPROVED":
            return Response(
                {"error": "Only approved loans can be foreclosed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate outstanding amount
        outstanding_amount = loan.calculate_outstanding_amount()
        payments_made = loan.payments.filter(status="SUCCESS").count()
        payments_remaining = loan.tenure - payments_made

        # If no outstanding amount, loan is already fully paid
        if outstanding_amount <= 0:
            return Response(
                {"error": "Loan has no outstanding amount"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create a final payment record for foreclosure settlement
        Payment.objects.create(
            loan=loan,
            amount=outstanding_amount,
            emi_number=payments_made + 1,  # Next EMI number
            status="SUCCESS",
            payment_type="FORECLOSURE",  # Mark as foreclosure payment
            gateway_reference=f"FORECLOSURE_{timezone.now().strftime('%Y%m%d%H%M%S')}",
            gateway_response={
                "type": "foreclosure",
                "message": "Loan foreclosed - full settlement",
                "emis_cleared": payments_remaining,
            },
        )

        # Update loan status with foreclosure details
        loan.status = "FORECLOSED"
        loan.is_closed = True
        loan.foreclosure_date = timezone.now()
        loan.foreclosure_amount = outstanding_amount
        loan.save()

        return Response(
            {
                "message": "Loan foreclosed successfully",
                "loan_id": loan.id,
                "status": loan.status,
                "foreclosure_amount": float(outstanding_amount),
                "emis_paid_before_foreclosure": payments_made,
                "emis_cleared_by_foreclosure": payments_remaining,
                "foreclosure_date": loan.foreclosure_date.isoformat(),
            }
        )


# ADMIN FUNCTIONS
@api_view(["POST"])
@permission_classes([IsAdminRole])
def approve_loan(request, pk):
    """Admin approves a pending loan"""
    loan = get_object_or_404(Loan, id=pk)

    if loan.status != "PENDING":
        return Response(
            {"error": "Only pending loans can be approved"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check loan limit (₹100,000 max per user)
    user_approved_loans = (
        Loan.objects.filter(user=loan.user, status="APPROVED").aggregate(
            total_amount=Sum("amount")
        )["total_amount"]
        or 0
    )

    if user_approved_loans + loan.amount > 100000:
        loan.status = "REJECTED_LIMIT"
        loan.rejection_reason = f"Loan limit exceeded. User already has ₹{user_approved_loans} in approved loans."
        loan.save()
        return Response(
            {
                "error": "Loan rejected - user exceeded ₹100,000 limit",
                "current_total": float(user_approved_loans),
                "requested_amount": float(loan.amount),
                "remaining_limit": float(100000 - user_approved_loans),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Approve the loan
    loan.status = "APPROVED"
    loan.approved_by = request.user
    loan.approved_date = timezone.now()
    loan.save()

    # Get updated loan data
    serializer = LoanSerializer(loan)

    return Response({"message": "Loan approved successfully!", "loan": serializer.data})


@api_view(["POST"])
@permission_classes([IsAdminRole])
def reject_loan(request, pk):
    """Admin rejects a pending loan"""
    loan = get_object_or_404(Loan, id=pk)

    if loan.status != "PENDING":
        return Response(
            {"error": "Only pending loans can be rejected"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reason = request.data.get("reason", "Application rejected")

    if not reason:
        return Response(
            {"error": "Rejection reason is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    loan.status = "REJECTED"
    loan.rejection_reason = reason
    loan.save()

    return Response(
        {
            "message": "Loan rejected",
            "loan_id": loan.id,
            "reason": reason,
            "status": loan.status,
        }
    )


@api_view(["DELETE"])
@permission_classes([IsAdminRole])
def delete_loan(request, pk):
    """Admin deletes any loan"""
    loan = get_object_or_404(Loan, id=pk)

    # Prevent deletion of loans with payments
    if loan.payments.exists():
        return Response(
            {
                "error": "Cannot delete loan with payment history. Use reject or foreclose instead."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    loan_id = loan.id
    loan.delete()

    return Response({"message": "Loan deleted permanently", "deleted_loan_id": loan_id})


# PAYMENT RELATED VIEWS
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def make_payment(request, pk):
    """Mock payment gateway for EMI payments"""
    loan = get_object_or_404(Loan, id=pk)

    # Permission check
    if loan.user != request.user and not request.user.is_staff:
        return Response(
            {"error": "Not authorized to make payments for this loan"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Business logic checks
    if loan.status != "APPROVED":
        return Response(
            {"error": "Can only pay for approved loans"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    paid_emis = loan.payments.filter(status="SUCCESS").count()
    if paid_emis >= loan.tenure:
        return Response(
            {"error": "Loan is already fully paid"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Check if next EMI is due (prevent skipping EMIs)
    next_emi_number = paid_emis + 1
    existing_payment = Payment.objects.filter(
        loan=loan, emi_number=next_emi_number
    ).first()
    if existing_payment:
        return Response(
            {
                "error": f"EMI #{next_emi_number} already exists",
                "payment_id": existing_payment.id,
                "status": existing_payment.status,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Process payment
    payment = Payment.objects.create(
        loan=loan,
        amount=loan.monthly_installment,
        emi_number=next_emi_number,
        status="SUCCESS",
        gateway_reference=f"MOCK_{timezone.now().strftime('%Y%m%d%H%M%S')}",
        gateway_response={"mock": True, "message": "Payment simulated successfully"},
    )

    # Check if loan is now fully paid
    if next_emi_number >= loan.tenure:
        loan.status = "REPAID"
        loan.is_closed = True
        loan.save()
        message = f"Final EMI #{next_emi_number} paid successfully - Loan Fully Repaid!"
    else:
        message = f"EMI #{next_emi_number} paid successfully"

    # Get updated loan info
    loan_serializer = LoanSerializer(loan)
    payment_serializer = PaymentSerializer(payment)

    return Response(
        {
            "message": message,
            "payment": payment_serializer.data,
            "loan": loan_serializer.data,
            "next_emi": next_emi_number + 1 if next_emi_number < loan.tenure else None,
            "payments_remaining": max(0, loan.tenure - next_emi_number),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_loan_schedule(request, pk):
    """Get amortization schedule for a specific loan"""
    loan = get_object_or_404(Loan, id=pk)

    if loan.user != request.user and not request.user.is_staff:
        return Response(
            {"error": "Not authorized to view this loan schedule"},
            status=status.HTTP_403_FORBIDDEN,
        )

    schedule = loan.get_amortization_schedule()
    payments_made = loan.payments.filter(status="SUCCESS").count()

    # Mark which payments have been made
    for i, payment_entry in enumerate(schedule):
        payment_entry["paid"] = i < payments_made
        if i < payments_made:
            try:
                payment = loan.payments.get(emi_number=i + 1, status="SUCCESS")
                payment_entry["payment_date"] = payment.payment_date.isoformat()
                payment_entry["payment_id"] = payment.id
            except Payment.DoesNotExist:
                payment_entry["payment_date"] = None

    return Response(
        {
            "loan_id": loan.id,
            "amount": float(loan.amount),
            "tenure": loan.tenure,
            "interest_rate": loan.interest_rate,
            "payments_made": payments_made,
            "payments_remaining": loan.tenure - payments_made,
            "schedule": schedule,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_next_payment(request, pk):
    """Get next due payment details"""
    loan = get_object_or_404(Loan, id=pk)

    if loan.user != request.user and not request.user.is_staff:
        return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    if loan.status != "APPROVED":
        return Response(
            {"error": "Loan is not active", "loan_status": loan.status},
            status=status.HTTP_400_BAD_REQUEST,
        )

    next_payment = loan.get_next_payment_details()
    payments_made = loan.payments.filter(status="SUCCESS").count()

    if next_payment:
        return Response(
            {
                "loan_id": loan.id,
                "next_payment": next_payment,
                "payments_made": payments_made,
                "payments_remaining": loan.tenure - payments_made,
                "total_tenure": loan.tenure,
                "emi_number": payments_made + 1,
            }
        )
    else:
        return Response(
            {
                "message": "No payments due - loan may be completed or not active",
                "loan_status": loan.status,
                "payments_made": payments_made,
                "total_tenure": loan.tenure,
            }
        )


# Get all payments for a loan
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_loan_payments(request, pk):
    """Get all payments for a specific loan"""
    loan = get_object_or_404(Loan, id=pk)

    if loan.user != request.user and not request.user.is_staff:
        return Response(
            {"error": "Not authorized to view these payments"},
            status=status.HTTP_403_FORBIDDEN,
        )

    payments = loan.payments.all().order_by("emi_number")
    serializer = PaymentSerializer(payments, many=True)

    return Response(
        {
            "loan_id": loan.id,
            "total_payments": payments.count(),
            "successful_payments": payments.filter(status="SUCCESS").count(),
            "payments": serializer.data,
        }
    )


# COMMUNICATION / NOTIFICATION FUNCTIONS
@api_view(["POST"])
@permission_classes([IsAdminRole])
def send_email_to_user(request, pk):
    """
    Admin sends an email to the loan user

    Expected payload:
    {
        "subject": "Email subject",
        "message": "Email message body"
    }
    """
    loan = get_object_or_404(Loan, id=pk)

    # Validate loan user exists and has email
    if not loan.user:
        return Response(
            {"error": "This loan has no associated user"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not loan.user.email:
        return Response(
            {"error": "User does not have an email address on file"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get subject and message from request
    subject = request.data.get("subject", "").strip()
    message = request.data.get("message", "").strip()

    if not subject:
        return Response(
            {"error": "Email subject is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not message:
        return Response(
            {"error": "Email message is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Send email using notification utility
    success, error_message = send_loan_email(
        loan=loan,
        subject=subject,
        message=message,
        admin_user=request.user
    )

    if success:
        return Response(
            {
                "message": "Email sent successfully",
                "recipient": loan.user.email,
                "loan_id": loan.id,
                "subject": subject
            },
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {"error": error_message or "Failed to send email"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAdminRole])
def send_whatsapp_to_user(request, pk):
    """
    Admin sends a WhatsApp message to the loan user via Twilio

    Expected payload:
    {
        "message": "WhatsApp message text"
    }
    """
    loan = get_object_or_404(Loan, id=pk)

    # Validate loan user exists
    if not loan.user:
        return Response(
            {"error": "This loan has no associated user"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get message from request
    message = request.data.get("message", "").strip()

    if not message:
        return Response(
            {"error": "WhatsApp message is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Send WhatsApp message using notification utility
    success, error_message = send_loan_whatsapp(
        loan=loan,
        message=message,
        admin_user=request.user
    )

    if success:
        # Get phone number from user profile for response
        try:
            phone = loan.user.profile.phone_number if hasattr(loan.user, 'profile') else None
        except:
            phone = None

        return Response(
            {
                "message": "WhatsApp message sent successfully",
                "recipient_phone": phone,
                "loan_id": loan.id,
            },
            status=status.HTTP_200_OK
        )
    else:
        return Response(
            {"error": error_message or "Failed to send WhatsApp message"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
