from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('USER', 'User'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER')
    email = models.EmailField(blank=False, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    # Phone number 
    phone_number = models.CharField(max_length=15, blank=False)

    # Bank account details 
    bank_account_number = models.CharField(max_length=34, blank=False)
    ifsc_code = models.CharField(max_length=11, blank=False)

    # Address fields
    address_line_1 = models.CharField(max_length=100, blank=False)
    address_line_2 = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=50, blank=False)
    state = models.CharField(max_length=50, blank=False)
    pin_code = models.CharField(max_length=10, blank=False)

    # Additional fields
    date_of_birth = models.DateField(null=True, blank=True)  
    pan_number = models.CharField(max_length=10, blank=False, unique=True)
    aadhaar_number = models.CharField(max_length=12, blank=False, unique=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Profile status
    STATUS_CHOICES = (
        ('PENDING', 'Admin Approval Pending'),
        ('APPROVED', 'Approved'),
        ('SUSPENDED', 'Suspended')
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def full_address(self):
        parts = [self.address_line_1]
        if self.address_line_2:
            parts.append(self.address_line_2)
        parts.extend([self.city, self.state])
        return ", ".join(parts) + f" - {self.pin_code}"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
