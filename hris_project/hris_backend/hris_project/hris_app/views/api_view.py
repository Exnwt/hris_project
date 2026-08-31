from hris_app.models import APIAccessTemplate, UserAccessAssignment, GroupAccessAssignment
from hris_app.serializers.api_serializers import APIAccessTemplateSerializer, UserAccessAssignmentSerializer, GroupAccessAssignmentSerializer
from rest_framework import status
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication #JWT Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import (
    IsAuthenticated,
)  # Wajib login/bawa token
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication


class APIAccessTemplateViewSet(viewsets.ModelViewSet):
    queryset = APIAccessTemplate.objects.all()
    serializer_class = APIAccessTemplateSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class UserAccessAssignmentViewSet(viewsets.ModelViewSet):
    queryset = UserAccessAssignment.objects.all()
    serializer_class = UserAccessAssignmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    

class GroupAccessAssignmentViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    queryset = GroupAccessAssignment.objects.select_related(
        "group",
        "template"
    ).all()

    serializer_class = GroupAccessAssignmentSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        group_id = self.request.query_params.get("group")
        template_id = self.request.query_params.get("template")

        if group_id:
            queryset = queryset.filter(group_id=group_id)

        if template_id:
            queryset = queryset.filter(template_id=template_id)

        return queryset