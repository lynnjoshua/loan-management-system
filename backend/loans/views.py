from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action , api_view , permission_classes
from rest_framework.views import APIView
from .models import Loan
from .serializers import LoanSerializer

from rest_framework.permissions import IsAuthenticated

class LoanListCreateView(generics.ListCreateAPIView):
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]   # ✅ requires JWT

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Loan.objects.all()
        return Loan.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LoanForecloseView(APIView):
    permission_classes = [IsAuthenticated]   # ✅ requires JWT

    def post(self, request, pk):
        try:
            loan = Loan.objects.get(pk=pk)
        except Loan.DoesNotExist:
            return Response({"error": "Loan not found"}, status=404)

        if request.user.role == "admin" or loan.user == request.user:
            loan.is_closed = True
            loan.save()
            return Response({"message": "Loan foreclosed"})
        return Response({"error": "Not authorized"}, status=403)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])   # makes it public
def ping(request):
    return Response({"message": "pong from Django!"})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def echo(request):
    if request.method == "GET":
        return Response({"message": "pong"})
    elif request.method == "POST":
        data = request.data
        return Response({"received": data})