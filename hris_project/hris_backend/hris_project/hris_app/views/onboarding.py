from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication #JWT Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from hris_app.permissions import HasAPIAccessPermission
from rest_framework import viewsets, permissions, status, generics
from hris_app.models import Employee, EmployeeStatusHistory, EmployeeContactHistory, EmployeeSubmissionStaging
from hris_app.serializers.onboarding_serializer import EmployeeStatusHistorySerializer, EmployeeContactHistorySerializer, EmployeeSubmissionStagingSerializer, OnboardingApproveSerializer
from hris_app.serializers.employee_serializer import EmployeeSerializer

import hmac
import hashlib
import json
from rest_framework.views import APIView


class OnboardingListView(generics.ListAPIView):
    api_codename = 'OnboardingList'
    queryset = Employee.objects.filter(is_onboarding=True)
    serializer_class = EmployeeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]

class OnboardingDetailView(generics.RetrieveAPIView):
    api_codename = 'OnboardingList'
    queryset = Employee.objects.filter(is_onboarding=True)
    serializer_class = EmployeeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]

class OnboardingUpdateView(generics.UpdateAPIView):
    api_codename = 'OnboardingUpdate'
    queryset = Employee.objects.filter(is_onboarding=True)
    serializer_class = EmployeeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]


class OnboardingApproveView(generics.UpdateAPIView):
    api_codename = 'OnboardingUpdate'
    queryset = Employee.objects.filter(is_onboarding=True)
    serializer_class = OnboardingApproveSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]

    def perform_update(self, serializer):
       serializer.save(
          form_status='approved',
          status='active',
       )


class OnboardingCreateView(generics.CreateAPIView):
    api_codename = 'OnboardingCreate'
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasAPIAccessPermission]

    def perform_create(self, serializer):
       serializer.save(
          is_onboarding=True
       )


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([HasAPIAccessPermission])
def employee_submission_create_view(request):
  # Menerima data JSON yang dikirimkan
  serializer = EmployeeSubmissionStagingSerializer(data=request.data)

  # Validasi data sesuai aturan Serializer
  print('111')
  if serializer.is_valid():
    print('222')
    serializer.save()
    # Mengembalikan respons sukses dengan format REST (HTTP 201 Created)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

  # Jika tidak valid, kembalikan error dengan HTTP 400 Bad Request
  print('3333')
  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([HasAPIAccessPermission])
def employee_submission_detail(request, pk):
  data =EmployeeSubmissionStaging.objects.filter(pk=pk)
  serializer = EmployeeSubmissionStagingSerializer(data, many=True)
  return Response({
      "data": serializer.data[0]['raw_payload'] if serializer.data else None,
      "message": f"Detail submission dengan ID {pk} akan ditampilkan di sini."}, status=status.HTTP_200_OK)




class EmployeeStatusHistoryViewSet(viewsets.ModelViewSet):
    queryset = EmployeeStatusHistory.objects.all()
    serializer_class = EmployeeStatusHistorySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class EmployeeContactHistoryViewSet(viewsets.ModelViewSet):
    queryset = EmployeeContactHistory.objects.all()
    serializer_class = EmployeeContactHistorySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class EmployeeSubmissionStagingViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSubmissionStaging.objects.all()
    serializer_class = EmployeeSubmissionStagingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


