from django.contrib.auth.models import Group
from rest_framework import viewsets, permissions
from hris_app.serializers.group_serializers import GroupSerializer


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    authentication_classes = [permissions.SessionAuthentication, permissions.BasicAuthentication]
    permission_classes = [permissions.IsAuthenticated]