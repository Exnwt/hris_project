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

from hris_app.serializers.onboarding import (
    EmployeeSubmissionStagingSerializer,
)
from hris_app.permissions import HasApiWhitelistPermission
from hris_app.models import EmployeeSubmissionStaging


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([HasApiWhitelistPermission])
def employee_submission_create_view(request):
  # Menerima data JSON yang dikirimkan
  serializer = EmployeeSubmissionStagingSerializer(data=request.data)

  # Validasi data sesuai aturan Serializer
  if serializer.is_valid():
    serializer.save()
    # Mengembalikan respons sukses dengan format REST (HTTP 201 Created)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

  # Jika tidak valid, kembalikan error dengan HTTP 400 Bad Request
  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([HasApiWhitelistPermission])
def employee_submission_detail(request, pk):
  data =EmployeeSubmissionStaging.objects.filter(pk=pk)
  serializer = EmployeeSubmissionStagingSerializer(data, many=True)
  return Response({
      "data": serializer.data[0]['raw_payload'] if serializer.data else None,
      "message": f"Detail submission dengan ID {pk} akan ditampilkan di sini."}, status=status.HTTP_200_OK)