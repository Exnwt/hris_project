from django.contrib.auth.models import Group
from rest_framework import viewsets, permissions
from hris_app.serializers.group_serializers import GroupSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
