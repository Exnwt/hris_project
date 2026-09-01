from hris_app.models import APIEndpoint, UserAccessAssignment, GroupAccessAssignment
from hris_app.serializers.api_serializers import APIEndpointSerializer, UserAccessAssignmentSerializer, GroupAccessAssignmentSerializer
from rest_framework import status
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication #JWT Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from hris_app.permissions import HasAPIAccessPermission
from rest_framework.response import Response
from rest_framework import viewsets, permissions
from rest_framework_simplejwt.authentication import JWTAuthentication


class APIEndpointViewSet(viewsets.ModelViewSet):
    queryset = APIEndpoint.objects.all()
    serializer_class = APIEndpointSerializer
    api_codename = 'APIEndpoints'
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated, HasAPIAccessPermission]

class UserAccessAssignmentViewSet(viewsets.ModelViewSet):
    queryset = UserAccessAssignment.objects.all()
    serializer_class = UserAccessAssignmentSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    

class GroupAccessAssignmentViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    queryset = GroupAccessAssignment.objects.select_related(
        "group",
        "api_endpoint"
    ).all()

    serializer_class = GroupAccessAssignmentSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):
        queryset = super().get_queryset()

        group_id = self.request.query_params.get("group")
        api_endpoint_id = self.request.query_params.get("api_endpoint")

        if group_id:
            queryset = queryset.filter(group_id=group_id)

        if api_endpoint_id:
            queryset = queryset.filter(api_endpoint_id=api_endpoint_id)

        return queryset