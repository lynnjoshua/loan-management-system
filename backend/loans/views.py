from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from .models import Loan
from .serializers import LoanSerializer
from django.shortcuts import get_object_or_404

class LoanListCreateView(generics.ListCreateAPIView):
    serializer_class = LoanSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            # Allow both admins and regular users to list loans
            return [IsAuthenticated()]
        else:
            # Only allow authenticated users to create loans
            return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == "ADMIN": 
            return Loan.objects.all()
        return Loan.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LoanForecloseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            loan = Loan.objects.get(pk=pk)
        except Loan.DoesNotExist:
            return Response({"error": "Loan not found"}, status=404)

        # Check if user is admin or the loan owner
        if request.user.role == "ADMIN" or loan.user == request.user:
            loan.status = "FORECLOSED"  # Update status instead of is_closed
            loan.is_closed = True  # Also update is_closed for backward compatibility
            loan.save()
            return Response({"message": "Loan foreclosed"})
        return Response({"error": "Not authorized"}, status=403)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_loan(request, loan_id):
    try:
        loan = Loan.objects.get(id=loan_id)
        loan.status = 'APPROVED'
        loan.save()
        return Response({"message": "Loan approved successfully"})
    except Loan.DoesNotExist:
        return Response({"error": "Loan not found"}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_loan(request, loan_id):
    try:
        loan = Loan.objects.get(id=loan_id)
        loan.delete()
        return Response({"message": "Loan deleted successfully"})
    except Loan.DoesNotExist:
        return Response({"error": "Loan not found"}, status=404)