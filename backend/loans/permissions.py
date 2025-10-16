from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Custom permission to check if user has role='ADMIN'.

    This is different from Django's IsAdminUser which checks is_staff.
    Use this for endpoints that should be accessible only to users with role='ADMIN'.
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has ADMIN role (case-insensitive)
        user_role = getattr(request.user, 'role', None)
        if user_role and str(user_role).upper() == 'ADMIN':
            return True

        return False
