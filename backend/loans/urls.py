from django.urls import path
from .views import LoanListCreateView, LoanForecloseView
from .views import ping, echo

urlpatterns = [
    path("", LoanListCreateView.as_view(), name="loan_list_create"),
    path("<int:pk>/foreclose/", LoanForecloseView.as_view(), name="loan_foreclose"),
    path('ping/', ping, name='ping'),
    path("echo/", echo),
]
