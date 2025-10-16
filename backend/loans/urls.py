from django.urls import path
from .views import LoanListCreateView, LoanForecloseView, LoanDetailView
from .views import approve_loan,reject_loan, delete_loan,make_payment, get_loan_schedule, get_next_payment
from .views import get_loan_payments, send_email_to_user, send_whatsapp_to_user

urlpatterns = [
    path("", LoanListCreateView.as_view(), name="loan_list_create"),
    path("<int:pk>/", LoanDetailView.as_view(), name="loan_detail"),
    path("<int:pk>/foreclose/", LoanForecloseView.as_view(), name="loan_foreclose"),

    path("<int:pk>/approve/", approve_loan, name="approve_loan"),
    path("<int:pk>/reject/", reject_loan, name="reject_loan"),
    path("<int:pk>/delete/", delete_loan, name="delete_loan"),
    path("<int:pk>/pay/", make_payment, name="make_payment"),
    path("<int:pk>/schedule/", get_loan_schedule, name="get_schedule"),
    path("<int:pk>/next-payment/", get_next_payment, name="next_payment"),
    path("<int:pk>/payments/", get_loan_payments, name="loan_payments"),

    # Communication endpoints
    path("<int:pk>/send-email/", send_email_to_user, name="send_email"),
    path("<int:pk>/send-whatsapp/", send_whatsapp_to_user, name="send_whatsapp"),
]