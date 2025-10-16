from django.http import JsonResponse


def api_root(request):
    """
    API root endpoint - simple health check.
    Returns a JSON response confirming the API is working.
    """
    return JsonResponse({"message": "API is working!"})
