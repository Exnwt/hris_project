from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from hris_app.serializers.user_serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [permissions.SessionAuthentication, permissions.BasicAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    