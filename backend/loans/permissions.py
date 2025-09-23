from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission:
    - Regular users can only manage their own loans.
    - Admin users (is_staff=True) can manage all loans.
    """

    def has_permission(self, request, view):
        # Allow all users to create loans (object-level will handle ownership)
        if request.method == 'POST':
            return True
            
        # For other methods, require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if request.user and request.user.is_staff:
            return True

        # Safe methods (GET, HEAD, OPTIONS) allowed if owner
        if request.method in SAFE_METHODS:
            return obj.user == request.user

        # For write actions (PUT, PATCH, DELETE, POST to custom actions)
        return obj.user == request.user