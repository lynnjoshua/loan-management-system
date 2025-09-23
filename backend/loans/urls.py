from django.urls import path
from .views import LoanListCreateView, LoanForecloseView, approve_loan, delete_loan

urlpatterns = [
    path("", LoanListCreateView.as_view(), name="loan_list_create"),
    path("<int:pk>/foreclose/", LoanForecloseView.as_view(), name="loan_foreclose"),
    path("<int:loan_id>/approve/", approve_loan, name="approve_loan"),
    path("<int:loan_id>/delete/", delete_loan, name="delete_loan")
]